import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Upload,
  Type as TypeIcon,
  Sparkles,
  Layers,
  Globe,
  BookOpen,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  Zap,
  Camera,
  Smartphone,
} from 'lucide-react';
import { Header } from './components/Header';
import { ScreenSharePanel } from './components/ScreenSharePanel';
import { CameraScanner } from './components/CameraScanner';
import { ImageUploader } from './components/ImageUploader';
import { TextQuestionInput } from './components/TextQuestionInput';
import { AnswerPanel } from './components/AnswerPanel';
import { MultiQuestionTabs } from './components/MultiQuestionTabs';
import { HistoryDrawer } from './components/HistoryDrawer';
import { DisclaimerModal } from './components/DisclaimerModal';
import {
  SupportedLanguage,
  SupportedSubject,
  AnalysisResult,
  HistoryItem,
  InputMode,
} from './types';
import { translations, TranslationDictionary } from './translations';

export default function App() {
  // Mobile mode auto-detection & toggle
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    );
  });

  // UI Language: Uzbek (uz) by default, English (en), Arabic (ar), Russian (ru)
  const [uiLang, setUiLang] = useState<'uz' | 'en' | 'ar' | 'ru'>('uz');
  const t: TranslationDictionary = translations[uiLang] || translations.en;
  const isRtl = uiLang === 'ar';

  // Analysis target configuration
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('auto');
  const [targetSubject, setTargetSubject] = useState<SupportedSubject>('auto');

  // Input tabs: 'screen' is the primary mode on all devices
  const [inputMode, setInputMode] = useState<InputMode>('screen');

  // Active analysis states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Live timer during analysis
  useEffect(() => {
    if (!isLoading) {
      setElapsedSeconds(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(parseFloat(((Date.now() - start) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Countdown timer for rate limits
  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) return;
    const interval = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitCountdown]);

  // Result & cached inputs for re-querying multiple questions
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeText, setActiveText] = useState<string | null>(null);

  // Session history
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);

  // Set RTL attribute on body when Arabic UI is chosen
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = uiLang;
  }, [uiLang, isRtl]);

  // Auto-scroll to answer results on mobile devices when solution appears
  useEffect(() => {
    if (currentResult) {
      const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 1024;
      if (isSmallScreen || isMobileMode) {
        setTimeout(() => {
          const el = document.getElementById('results-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    }
  }, [currentResult, isMobileMode]);

  // Unified Analysis Caller
  const executeAnalysis = async (params: {
    image?: string | null;
    text?: string | null;
    selectedQuestionIndex?: number;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Uploading and scanning question input...');

    try {
      const payload: any = {
        language: targetLang,
        subject: targetSubject,
        selectedQuestionIndex: params.selectedQuestionIndex ?? 0,
      };

      if (params.image) {
        payload.image = params.image;
        setActiveImage(params.image);
      } else if (params.text) {
        payload.text = params.text;
        setActiveText(params.text);
      }

      setLoadingStep('Consulting Gemini Vision multimodal model...');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        if (json.isRateLimit || response.status === 429) {
          const waitTime = json.retryAfter || 30;
          setRateLimitCountdown(waitTime);
          throw new Error(
            json.error || `Free tier rate limit reached. Please wait ${waitTime} seconds.`
          );
        }
        throw new Error(
          json.error || `Server responded with status: ${response.status}`
        );
      }

      setRateLimitCountdown(null);
      const resultData: AnalysisResult = json.data;
      setCurrentResult(resultData);

      // Save to session history
      const historyEntry: HistoryItem = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        imageUrl: params.image || undefined,
        textPrompt: params.text || undefined,
        result: resultData,
        subject: resultData.detectedSubject || targetSubject,
        language: resultData.detectedLanguage || targetLang,
      };

      setHistoryItems((prev) => [historyEntry, ...prev.slice(0, 49)]);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(
        err.message || 'An error occurred during analysis. Please try again.'
      );
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Multiple Question Switcher
  const handleSelectSubQuestion = (index: number) => {
    executeAnalysis({
      image: activeImage,
      text: activeText,
      selectedQuestionIndex: index,
    });
  };

  // History item loader
  const handleSelectHistoryItem = (item: HistoryItem) => {
    setCurrentResult(item.result);
    setActiveImage(item.imageUrl || null);
    setActiveText(item.textPrompt || null);
  };

  // Clear current state
  const handleClearCurrent = () => {
    setCurrentResult(null);
    setActiveImage(null);
    setActiveText(null);
    setErrorMessage(null);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans"
    >
      {/* Top Header */}
      <Header
        t={t}
        uiLang={uiLang}
        onUiLangChange={setUiLang}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={historyItems.length}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        onClear={handleClearCurrent}
        hasActiveResult={Boolean(currentResult)}
        isMobileMode={isMobileMode}
        onToggleMobileMode={() => setIsMobileMode(!isMobileMode)}
        isRtl={isRtl}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Education and Practice Assistant</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {t.appTitle}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {t.appSubtitle}
              </p>
            </div>

            {/* Language & Subject Filters */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md space-y-3 shrink-0 min-w-[280px]">
              {/* Target Response Language */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.selectLanguage}</span>
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value as SupportedLanguage)}
                  className="w-full text-xs font-medium bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="auto">🌐 {t.autoDetect}</option>
                  <option value="uz">🇺🇿 O'zbek tili (Uzbek)</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="ar">🇸🇦 العربية (Arabic - RTL)</option>
                  <option value="ru">🇷🇺 Русский (Russian)</option>
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.selectSubject}</span>
                </label>
                <select
                  value={targetSubject}
                  onChange={(e) => setTargetSubject(e.target.value as SupportedSubject)}
                  className="w-full text-xs font-medium bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="auto">✨ {t.autoDetect}</option>
                  <option value="math">📐 {t.subjectMath}</option>
                  <option value="english">📝 {t.subjectEnglish}</option>
                  <option value="arabic">📖 {t.subjectArabic}</option>
                  <option value="it">💻 {t.subjectIT}</option>
                  <option value="science">🔬 {t.subjectScience}</option>
                  <option value="history">🏛️ {t.subjectHistory}</option>
                  <option value="geography">🌍 {t.subjectGeography}</option>
                  <option value="general">💡 {t.subjectGeneral}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Grid: Left (Inputs) | Right (Answer Display) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Input Methods */}
          <div className="lg:col-span-5 space-y-4">
            {/* Input Navigation Tabs: Screen Share is Primary */}
            <div className="p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => setInputMode('screen')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'screen'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Monitor className="w-4 h-4 text-cyan-300" />
                <span className="truncate">Screen Share</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/30 text-amber-300 hidden sm:inline">
                  ⚡ Tez rejim
                </span>
              </button>

              <button
                onClick={() => setInputMode('upload')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'upload'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span className="truncate">Upload</span>
              </button>

              <button
                onClick={() => setInputMode('text')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'text'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <TypeIcon className="w-4 h-4" />
                <span className="truncate">Text</span>
              </button>

              <button
                onClick={() => setInputMode('camera')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'camera'
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Camera className="w-4 h-4 text-amber-300" />
                <span className="truncate">{t.tabCamera}</span>
              </button>
            </div>

            {/* Input Component Panels */}
            <div className="rounded-2xl border border-slate-800/90 bg-slate-900/30 backdrop-blur-sm p-4 sm:p-5 shadow-xl">
              {inputMode === 'screen' && (
                <ScreenSharePanel
                  t={t}
                  onAnalyzeFrame={(imageDataUrl) =>
                    executeAnalysis({ image: imageDataUrl })
                  }
                  isLoading={isLoading}
                  currentResult={currentResult}
                  elapsedSeconds={elapsedSeconds}
                  isRtl={isRtl}
                />
              )}

              {inputMode === 'camera' && (
                <CameraScanner
                  t={t}
                  onAnalyzeFrame={(imageDataUrl) =>
                    executeAnalysis({ image: imageDataUrl })
                  }
                  isLoading={isLoading}
                  isRtl={isRtl}
                />
              )}

              {inputMode === 'upload' && (
                <ImageUploader
                  t={t}
                  onAnalyzeImage={(imageDataUrl) =>
                    executeAnalysis({ image: imageDataUrl })
                  }
                  isLoading={isLoading}
                  isRtl={isRtl}
                />
              )}

              {inputMode === 'text' && (
                <TextQuestionInput
                  t={t}
                  onAnalyzeText={(textQuery) =>
                    executeAnalysis({ text: textQuery })
                  }
                  isLoading={isLoading}
                  isRtl={isRtl}
                />
              )}
            </div>

            {/* Helpful Educational Tips */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Capabilities & Layout Handling</span>
              </div>
              <p className="leading-relaxed">
                The AI vision engine reads questions arranged in single or multiple columns, tables, handwritten notes, diagrams, and math symbols.
              </p>
            </div>
          </div>

          {/* Right Column: Answers and Results */}
          <div id="results-section" className="lg:col-span-7 space-y-4">
            {/* Loading Indicator State */}
            {isLoading && (
              <div className="p-8 sm:p-12 rounded-3xl border border-indigo-500/40 bg-slate-950/90 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 animate-spin">
                    <RefreshCw className="w-8 h-8" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold shadow-inner">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                    <span>⚡ Solving Fast: {elapsedSeconds}s</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {t.loadingMessage}
                  </h3>
                  <p className="text-xs text-indigo-300/80">
                    {loadingStep || t.loadingSubtitle}
                  </p>
                </div>

                <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-indigo-500 animate-pulse w-3/4 rounded-full" />
                </div>

                <span className="text-[11px] text-slate-500">
                  Tez rejim yoqilgan · natija savol va tarmoqqa bog‘liq
                </span>
              </div>
            )}

            {/* Error Message Display */}
            {errorMessage && !isLoading && (
              <div
                className={`p-5 rounded-2xl border flex items-start gap-3.5 shadow-xl animate-in fade-in ${
                  rateLimitCountdown
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <AlertCircle
                  className={`w-6 h-6 shrink-0 mt-0.5 ${
                    rateLimitCountdown ? 'text-amber-400' : 'text-rose-400'
                  }`}
                />
                <div className="space-y-1.5 flex-1 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-white">
                      {rateLimitCountdown ? 'Rate Limit Notice' : t.errorOccurred}
                    </h4>
                    {rateLimitCountdown !== null && rateLimitCountdown > 0 && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Cooldown: {rateLimitCountdown}s
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {errorMessage}
                  </p>
                  <div className="pt-1 flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (activeImage) {
                          executeAnalysis({ image: activeImage });
                        } else if (activeText) {
                          executeAnalysis({ text: activeText });
                        }
                      }}
                      disabled={rateLimitCountdown !== null && rateLimitCountdown > 0}
                      className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 text-white transition-all cursor-pointer shadow"
                    >
                      {rateLimitCountdown !== null && rateLimitCountdown > 0
                        ? `Please wait ${rateLimitCountdown}s...`
                        : t.retry}
                    </button>

                    {rateLimitCountdown !== null && rateLimitCountdown > 0 && (
                      <span className="text-[11px] text-amber-300/80">
                        The retry button will activate automatically once the cooldown expires.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Questions Selector Tabs if detected in current frame */}
            {currentResult?.allQuestionsSummary &&
              currentResult.allQuestionsSummary.length > 1 && (
                <MultiQuestionTabs
                  questions={currentResult.allQuestionsSummary}
                  activeIndex={currentResult.activeQuestionIndex ?? 0}
                  onSelectQuestion={handleSelectSubQuestion}
                  isLoading={isLoading}
                  t={t}
                  isRtl={isRtl}
                />
              )}

            {/* Primary Answer Panel */}
            {currentResult && !isLoading && (
              <AnswerPanel
                result={currentResult}
                sourceImage={activeImage}
                t={t}
                isRtl={isRtl}
              />
            )}

            {/* Placeholder Empty State */}
            {!currentResult && !isLoading && !errorMessage && (
              <div className="p-8 sm:p-14 rounded-3xl border border-slate-800/80 bg-slate-950/40 text-center flex flex-col items-center justify-center space-y-4 min-h-[380px]">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-base font-bold text-white">
                    Ready to Solve Educational Questions
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click <strong className="text-slate-200">Start Screen Share</strong>,{' '}
                    <strong className="text-slate-200">Upload Image</strong>, or{' '}
                    <strong className="text-slate-200">Paste Question</strong> on the left to begin instant AI analysis.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 w-full max-w-md">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-[11px] font-bold text-slate-300">Uzbek</div>
                    <div className="text-[10px] text-slate-500">O'zbek tili</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-[11px] font-bold text-slate-300">English</div>
                    <div className="text-[10px] text-slate-500">Grammar & STEM</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-[11px] font-bold text-slate-300">Arabic</div>
                    <div className="text-[10px] text-slate-500">العربية وإعراب</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-[11px] font-bold text-slate-300">Russian</div>
                    <div className="text-[10px] text-slate-500">Русский язык</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Study Assistant • Multilingual Educational Practice</span>
          <button
            onClick={() => setIsDisclaimerOpen(true)}
            className="hover:text-slate-300 underline transition-colors cursor-pointer"
          >
            Browser Permissions & Integrity Guidelines
          </button>
        </div>
      </footer>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onSelect={handleSelectHistoryItem}
        onClear={() => setHistoryItems([])}
        t={t}
        isRtl={isRtl}
      />

      {/* Educational Guidelines & Disclaimer Modal */}
      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
        t={t}
        isRtl={isRtl}
      />
    </div>
  );
}
