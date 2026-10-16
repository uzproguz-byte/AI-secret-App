import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createHash } from 'node:crypto';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support high-resolution screen grabs (up to 30MB base64 payload)
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Reuse one Gemini client so requests can reuse pooled network connections.
let cachedGeminiClient: GoogleGenAI | null = null;

// Helper to get Gemini Client
function getGeminiClient(): GoogleGenAI {
  if (cachedGeminiClient) return cachedGeminiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please ensure the API key is set in environment secrets.');
  }
  cachedGeminiClient = new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  return cachedGeminiClient;
}

// Fast in-memory cache to serve identical questions instantly and protect free-tier quota
const fastCache = new Map<string, { data: any; timestamp: number }>();

// Analysis API endpoint
app.post('/api/analyze', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      image, // base64 string or data URL
      text, // text question if provided
      language = 'auto', // 'auto' | 'uz' | 'en' | 'ar' | 'ru'
      subject = 'auto', // 'auto' | 'math' | 'english' | 'arabic' | 'it' | 'science' | 'history' | 'geography' | 'general'
      selectedQuestionIndex = 0,
      fastMode = true,
    } = req.body;

    if (!image && (!text || !text.trim())) {
      return res.status(400).json({
        error: 'Please provide an image (screen capture/upload/camera) or enter a text question.',
      });
    }

    // Check fast cache first
    const inputFingerprint = createHash('sha256')
      .update(image ? `image:${image}` : `text:${(text || '').trim()}`)
      .digest('hex')
      .slice(0, 32);
    const cacheKey = `${language}_${subject}_${selectedQuestionIndex}_${inputFingerprint}`;

    const cachedEntry = fastCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < 3600000) {
      console.log('[AI Solver] Serving from instant cache (< 0.05s)');
      return res.json({
        success: true,
        data: {
          ...cachedEntry.data,
          durationMs: 40,
        },
        durationMs: 40,
        isCached: true,
      });
    }

    const ai = getGeminiClient();

    // Prepare contents array
    const parts: any[] = [];

    // Parse image if provided
    if (image && typeof image === 'string') {
      let mimeType = 'image/jpeg';
      let base64Data = image;

      if (image.startsWith('data:')) {
        const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          const commaIdx = image.indexOf(',');
          if (commaIdx !== -1) {
            base64Data = image.slice(commaIdx + 1);
          }
        }
      }

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
        // Fast Mode trades some fine detail for lower vision-processing latency.
        // Disable fastMode in the request to retain high-resolution image analysis.
        mediaResolution: {
          level: fastMode ? 'MEDIA_RESOLUTION_LOW' : 'MEDIA_RESOLUTION_HIGH',
        },
      });
    }

    // Language direction prompt instructions
    const langInstructions = {
      uz: "O'zbek tilida javob bering. Savolni to'liq o'qib chiqing va tushuntirishni sodda, ravon o'zbek tilida taqdim eting.",
      en: "Respond in English. Read the entire question and provide explanations in clear, simple English.",
      ar: "يرجى الإجابة باللغة العربية الفصحى. اقرأ السؤال بالكامل وقدم شرحاً واضحاً ومفصلاً باللغة العربية مع مراعاة اتجاه النص وقواعد اللغة.",
      ru: "Отвечайте на русском языке. Внимательно прочитайте вопрос и дайте понятное, подробное пошаговое объяснение на русском языке.",
      auto: "Detect the language of the question (Uzbek, English, Arabic, Russian, etc.) and respond in that same language or in clear bilingual format if educational. If the question is in Uzbek, answer in Uzbek. If Arabic, answer in Arabic.",
    }[language as 'uz' | 'en' | 'ar' | 'ru' | 'auto'] || "Respond in the language of the question.";

    const promptText = `
You are a high-speed AI Education Assistant solving questions from screen sharing or user input.

SPEED & ACCURACY RULE:
- Prioritize speed and accuracy. Be direct and concise.
- Target Language: ${language} (${langInstructions})
- Subject: ${subject}
- Focus Question Index: ${selectedQuestionIndex}
${text ? `QUESTION CONTENT:\n${text}` : ''}

OUTPUT INSTRUCTIONS:
1. Read only the question or questions actually visible in the supplied image/text. Never invent other questions.
2. Identify the correct answer and explain it briefly in the requested language.
3. Keep the output compact: at most 3 short explanation steps and one short summary sentence.
4. If multiple questions are clearly visible, set multipleQuestionsFound to true and include a short allQuestionsSummary; otherwise omit it and use false.
5. Return only fields needed for a concise answer. Do not emit empty optional fields or verbose metadata.
6. Keep stepByStepExplanation to 1-2 short steps and summaryExplanation to one sentence.
7. Never put JSON or field names inside correctAnswerText or summaryExplanation.
8. For a direct-answer question, put only the answer in correctAnswerText and use "Direct Answer" as correctAnswerLabel.
`;

    parts.push({ text: promptText });

    const systemInstruction = `You are a rapid-response educational AI tutor. Read the supplied image or text carefully and return concise, accurate structured JSON as quickly as possible. State uncertainty rather than guessing when key details are unreadable.`;

    // Use the latest stable Flash model first, then fall back if it is overloaded.
    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.8-flash',
    ];
    let lastError: any = null;
    let responseText: string | null = null;
    let detectedRetrySeconds = 3;
    let sawRateLimit = false;
    let sawUnavailable = false;

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const getStatusCode = (err: any): number | undefined => {
      const raw = err?.status ?? err?.statusCode ?? err?.response?.status;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    for (const modelName of candidateModels) {
      if (responseText) break;

      // Retry a transient failure once with short backoff, then try the next model.
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log('[AI Solver] Calling ' + modelName + ' (attempt ' + attempt + ')...');
          const geminiStartedAt = Date.now();
          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              systemInstruction,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              maxOutputTokens: 1024,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  multipleQuestionsFound: { type: Type.BOOLEAN },
                  allQuestionsSummary: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        index: { type: Type.INTEGER },
                        title: { type: Type.STRING },
                        snippet: { type: Type.STRING },
                      },
                      required: ['index', 'title', 'snippet'],
                    },
                  },
                  activeQuestionIndex: { type: Type.INTEGER },
                  questionText: { type: Type.STRING },
                  detectedSubject: { type: Type.STRING },
                  detectedLanguage: { type: Type.STRING },
                  isMultipleChoice: { type: Type.BOOLEAN },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        text: { type: Type.STRING },
                        isCorrect: { type: Type.BOOLEAN },
                        box2d: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                      },
                      required: ['label', 'text', 'isCorrect'],
                    },
                  },
                  correctAnswerLabel: { type: Type.STRING },
                  correctAnswerText: { type: Type.STRING },
                  confidence: { type: Type.STRING },
                  confidenceScore: { type: Type.INTEGER },
                  isUnclear: { type: Type.BOOLEAN },
                  unclearReason: { type: Type.STRING },
                  warningNotice: { type: Type.STRING },
                  stepByStepExplanation: { type: Type.ARRAY, items: { type: Type.STRING } },
                  summaryExplanation: { type: Type.STRING },
                  keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                  diagramDescription: { type: Type.STRING },
                },
                required: ['questionText', 'correctAnswerText', 'summaryExplanation'],
              },
            },
          });

          if (!response.text) throw new Error('Gemini ' + modelName + ' returned an empty response.');
          responseText = response.text;
          console.log('[AI Solver] Gemini ' + modelName + ' responded in ' + ((Date.now() - geminiStartedAt) / 1000).toFixed(2) + 's');
          break;
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || String(err);
          const statusCode = getStatusCode(err);
          const isRateLimit = statusCode === 429 || /RESOURCE_EXHAUSTED|rate.?limit|quota/i.test(errMsg);
          const isUnavailable = statusCode === 503 || statusCode === 502 || statusCode === 504 ||
            /UNAVAILABLE|SERVICE_UNAVAILABLE|high demand|overloaded|timed? ?out|deadline exceeded/i.test(errMsg);

          console.warn('[AI Solver] Model ' + modelName + ' attempt ' + attempt + ' failed:', errMsg);

          if (isRateLimit) {
            sawRateLimit = true;
            const retryMatch = errMsg.match(/retry in ([0-9.]+)s/i);
            if (retryMatch?.[1]) detectedRetrySeconds = Math.max(1, Math.ceil(parseFloat(retryMatch[1])));
          }
          if (isUnavailable) sawUnavailable = true;

          if ((isRateLimit || isUnavailable) && attempt === 1) {
            const backoffMs = 500 + Math.floor(Math.random() * 350);
            await sleep(backoffMs);
            continue;
          }
          break;
        }
      }
    }

    if (!responseText) {
      const status = sawRateLimit ? 429 : sawUnavailable ? 503 : 502;
      const errorMessage = sawRateLimit
        ? 'Gemini is rate-limiting requests right now. Please wait about ' + detectedRetrySeconds + ' seconds, then retry.'
        : sawUnavailable
          ? 'Gemini is temporarily busy. All available Flash models were tried; please retry in a few seconds.'
          : 'Gemini could not complete this request. ' + (lastError?.message || 'Please retry.');

      console.error('[AI Solver] All configured Gemini models failed.', {
        status,
        lastError: lastError?.message || String(lastError || 'unknown error'),
      });
      return res.status(status).json({
        success: false,
        isRateLimit: sawRateLimit,
        isTemporary: sawUnavailable,
        retryAfter: detectedRetrySeconds,
        error: errorMessage,
      });
    }

    function extractJson(raw: string): any {
      if (!raw) return null;
      let text = raw.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        text = text.substring(firstBrace, lastBrace + 1);
      }
      return JSON.parse(text);
    }

    let parsedData: any;
    try {
      parsedData = extractJson(responseText);
      if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
        throw new Error('Gemini response was not a JSON object');
      }

      // A truncated or malformed model response must never be presented as the answer.
      const answerText = typeof parsedData.correctAnswerText === 'string'
        ? parsedData.correctAnswerText.trim()
        : '';
      const looksLikeNestedJson = answerText.startsWith('{') &&
        /["']?(multipleQuestionsFound|questionText|correctAnswerText)["']?\s*:/.test(answerText);

      if (looksLikeNestedJson) {
        try {
          const nested = extractJson(answerText);
          if (nested && typeof nested === 'object' &&
              typeof nested.correctAnswerText === 'string' &&
              typeof nested.questionText === 'string') {
            parsedData = nested;
          } else {
            throw new Error('Nested model response did not contain an answer');
          }
        } catch {
          throw new Error('Gemini placed malformed JSON inside the answer field');
        }
      }

      if (
        typeof parsedData.correctAnswerText !== 'string' ||
        !parsedData.correctAnswerText.trim() ||
        typeof parsedData.questionText !== 'string' ||
        typeof parsedData.summaryExplanation !== 'string'
      ) {
        throw new Error('Gemini response is missing required answer fields');
      }

      // Normalize omitted optional fields so compact fast-mode JSON remains UI-safe.
      if (!Array.isArray(parsedData.options)) parsedData.options = [];
      if (!Array.isArray(parsedData.keyConcepts)) parsedData.keyConcepts = [];
      if (!Array.isArray(parsedData.stepByStepExplanation)) parsedData.stepByStepExplanation = [];
      if (typeof parsedData.multipleQuestionsFound !== 'boolean') parsedData.multipleQuestionsFound = false;
      if (typeof parsedData.isMultipleChoice !== 'boolean') parsedData.isMultipleChoice = parsedData.options.length > 0;
      if (typeof parsedData.detectedSubject !== 'string' || !parsedData.detectedSubject.trim()) parsedData.detectedSubject = subject === 'auto' ? 'General' : subject;
      if (typeof parsedData.detectedLanguage !== 'string' || !parsedData.detectedLanguage.trim()) parsedData.detectedLanguage = language === 'auto' ? 'Detected' : language;
      if (typeof parsedData.confidence !== 'string' || !parsedData.confidence.trim()) parsedData.confidence = 'MEDIUM';
      if (!Number.isFinite(parsedData.confidenceScore)) parsedData.confidenceScore = 70;
      if (typeof parsedData.correctAnswerLabel !== 'string' || !parsedData.correctAnswerLabel.trim()) {
        parsedData.correctAnswerLabel = 'Direct Answer';
      }
      if (typeof parsedData.isUnclear !== 'boolean') parsedData.isUnclear = false;
    } catch (parseErr) {
      console.warn('[AI Solver] Failed to parse a complete answer JSON:', parseErr);
      return res.status(502).json({
        success: false,
        isIncompleteResponse: true,
        error: 'Gemini returned an incomplete answer. Please try again.',
      });
    }

    const durationMs = Date.now() - startTime;
    console.log(`[AI Solver] Solved in ${(durationMs / 1000).toFixed(2)}s`);

    // Cache the result for immediate lookup
    if (cacheKey) {
      if (fastCache.size > 250) {
        const oldestKey = fastCache.keys().next().value;
        if (oldestKey) fastCache.delete(oldestKey);
      }
      fastCache.set(cacheKey, { data: parsedData, timestamp: Date.now() });
    }

    return res.json({
      success: true,
      data: {
        ...parsedData,
        durationMs,
      },
      durationMs,
    });
  } catch (error: any) {
    console.error('API /api/analyze error:', error);
    let message = error?.message || 'Failed to analyze question';

    // Parse nested JSON errors if present
    try {
      if (message.startsWith('{') && message.endsWith('}')) {
        const parsedErr = JSON.parse(message);
        if (parsedErr.error?.message) {
          message = parsedErr.error.message;
        }
      }
    } catch {
      // Keep message as is
    }

    const isRateLimit = message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota');

    return res.status(isRateLimit ? 429 : 500).json({
      success: false,
      isRateLimit,
      retryAfter: 30,
      error: isRateLimit
        ? 'Free tier quota limit reached (5 requests/minute). Please wait a few moments and try again.'
        : message,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Study Assistant server listening on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
