export type SupportedLanguage = 'auto' | 'uz' | 'en' | 'ar' | 'ru';

export type SupportedSubject =
  | 'auto'
  | 'math'
  | 'english'
  | 'arabic'
  | 'it'
  | 'science'
  | 'history'
  | 'geography'
  | 'general';

export interface QuestionOption {
  label: string; // e.g. "A", "B", "C", "D"
  text: string;
  isCorrect: boolean;
  box2d?: number[]; // [ymin, xmin, ymax, xmax] in 0-1000 scale
}

export interface QuestionSummary {
  index: number;
  title: string;
  snippet: string;
}

export interface AnalysisResult {
  multipleQuestionsFound: boolean;
  allQuestionsSummary?: QuestionSummary[];
  activeQuestionIndex?: number;
  questionText: string;
  detectedSubject: string;
  detectedLanguage: string;
  isMultipleChoice: boolean;
  options: QuestionOption[];
  correctAnswerLabel: string;
  correctAnswerText: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  isUnclear: boolean;
  unclearReason?: string;
  warningNotice?: string;
  stepByStepExplanation: string[];
  summaryExplanation: string;
  keyConcepts?: string[];
  diagramDescription?: string;
  durationMs?: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  imageUrl?: string;
  textPrompt?: string;
  result: AnalysisResult;
  subject: string;
  language: string;
}

export type InputMode = 'camera' | 'screen' | 'upload' | 'text';
