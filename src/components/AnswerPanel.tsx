import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  Volume2,
  VolumeX,
  BookOpen,
  Sparkles,
  Layers,
  ArrowRight,
  Maximize2,
  Zap,
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { TranslationDictionary } from '../translations';

interface Props {
  result: AnalysisResult;
  sourceImage?: string | null;
  t: TranslationDictionary;
  isRtl?: boolean;
}

export const AnswerPanel: React.FC<Props> = ({
  result,
  sourceImage,
  t,
  isRtl,
}) => {
  const [copiedType, setCopiedType] = useState<'answer' | 'full' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showFullImage, setShowFullImage] = useState<boolean>(false);

  // Copy helpers
  const handleCopy = (text: string, type: 'answer' | 'full') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Text to Speech
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${t.correctAnswer}: ${result.correctAnswerLabel}. ${result.correctAnswerText}. ${result.summaryExplanation}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Set voice language if available
    const langMap: Record<string, string> = {
      uz: 'uz-UZ',
      en: 'en-US',
      ar: 'ar-SA',
      ru: 'ru-RU',
    };
    const detected = result.detectedLanguage?.toLowerCase() || 'en';
    if (detected.includes('uzbek') || detected.includes("o'zbek")) {
      utterance.lang = 'uz-UZ';
    } else if (detected.includes('arab')) {
      utterance.lang = 'ar-SA';
    } else if (detected.includes('russ')) {
      utterance.lang = 'ru-RU';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Confidence styling
  const confidenceColor = {
    HIGH: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    LOW: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  }[result.confidence] || 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

  const confidenceLabel = {
    HIGH: t.confidenceHigh,
    MEDIUM: t.confidenceMedium,
    LOW: t.confidenceLow,
  }[result.confidence] || result.confidence;

  const isArabicContent =
    result.detectedLanguage?.toLowerCase().includes('arab') ||
    /[\u0600-\u06FF]/.test(result.questionText);

  // Check if any option has bounding box for image overlay highlighting
  const correctOptionWithBox = result.options?.find(
    (opt) => opt.isCorrect && opt.box2d && opt.box2d.length === 4
  );

  return (
    <div
      dir={isRtl || isArabicContent ? 'rtl' : 'ltr'}
      className="space-y-5 animate-in fade-in duration-300"
    >
      {/* Warning or Unclear Notification */}
      {(result.isUnclear || result.warningNotice) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-200">
              {result.isUnclear ? t.unclearTitle : t.warningTitle}
            </h4>
            <p className="text-amber-300/90 leading-relaxed">
              {result.unclearReason || result.warningNotice}
            </p>
          </div>
        </div>
      )}

      {/* Primary Answer Card */}
      <div className="relative rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/40 p-5 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        {/* Top Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {result.detectedSubject || 'General Subject'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              {result.detectedLanguage || 'Auto Language'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Fast solve duration badge */}
            {result.durationMs && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 shadow-sm">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{(result.durationMs / 1000).toFixed(1)}s</span>
              </div>
            )}

            {/* Confidence pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${confidenceColor}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{confidenceLabel}</span>
              <span className="font-mono text-[11px] opacity-80">
                ({result.confidenceScore}%)
              </span>
            </div>

            {/* Read Aloud button */}
            <button
              onClick={handleToggleSpeech}
              className={`p-2 rounded-xl border transition-colors ${
                isSpeaking
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title={isSpeaking ? t.stopAudio : t.readAloud}
            >
              {isSpeaking ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Answer Highlight Banner */}
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-violet-900/40 border border-indigo-500/30 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            {/* Answer Choice Letter e.g. [A], [B], [C] */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              {result.correctAnswerLabel || '✓'}
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-indigo-300 mb-0.5">
                {t.correctAnswer}
              </div>
              <div className="text-base sm:text-lg font-bold text-white leading-snug">
                {result.correctAnswerText || `Option ${result.correctAnswerLabel}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Copy Answer Button */}
            <button
              onClick={() =>
                handleCopy(
                  `${result.correctAnswerLabel}: ${result.correctAnswerText}`,
                  'answer'
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              {copiedType === 'answer' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.copyAnswer}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Question detected */}
        <div className="mb-5 space-y-1.5">
          <div className="text-xs font-bold text-slate-400 tracking-wide uppercase">
            {t.questionDetected}
          </div>
          <div
            className={`p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-wrap ${
              isArabicContent ? 'font-arabic text-base' : ''
            }`}
          >
            {result.questionText}
          </div>
        </div>

        {/* Answer choices if multiple choice */}
        {result.isMultipleChoice && result.options && result.options.length > 0 && (
          <div className="mb-5 space-y-2">
            <div className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              Answer Options
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.options.map((opt, i) => {
                const isSelected =
                  opt.isCorrect ||
                  opt.label.trim().toUpperCase() ===
                    result.correctAnswerLabel.trim().toUpperCase();

                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/80 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-indigo-500 text-white shadow'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span
                      className={`text-xs font-medium flex-1 ${
                        isArabicContent ? 'font-arabic text-sm' : ''
                      }`}
                    >
                      {opt.text}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Visual Screenshot Overlay with Highlighted Answer Box */}
        {sourceImage && (
          <div className="mb-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wide">
                Image Preview & Answer Highlight
              </span>
              <button
                onClick={() => setShowFullImage(!showFullImage)}
                className="hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{showFullImage ? 'Collapse' : 'Expand'}</span>
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 max-h-[360px] flex items-center justify-center group">
              <img
                src={sourceImage}
                alt="Analyzed question screenshot"
                className="w-full h-auto max-h-[350px] object-contain rounded-lg"
              />

              {/* Bounding box overlay for correct choice if coordinates detected */}
              {correctOptionWithBox?.box2d && (
                <div
                  className="absolute border-2 border-emerald-400 bg-emerald-500/20 rounded shadow-lg shadow-emerald-500/40 pointer-events-none transition-all animate-pulse"
                  style={{
                    top: `${correctOptionWithBox.box2d[0] / 10}%`,
                    left: `${correctOptionWithBox.box2d[1] / 10}%`,
                    height: `${(correctOptionWithBox.box2d[2] - correctOptionWithBox.box2d[0]) / 10}%`,
                    width: `${(correctOptionWithBox.box2d[3] - correctOptionWithBox.box2d[1]) / 10}%`,
                  }}
                >
                  <span className="absolute -top-5 left-0 bg-emerald-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded shadow">
                    Correct: {correctOptionWithBox.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Explanation */}
        <div className="mb-5 space-y-2">
          <div className="text-xs font-bold text-slate-400 tracking-wide uppercase">
            Summary Explanation
          </div>
          <div
            className={`p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 text-sm text-slate-200 leading-relaxed ${
              isArabicContent ? 'font-arabic text-base' : ''
            }`}
          >
            {result.summaryExplanation}
          </div>
        </div>

        {/* Step-by-Step Reasoning */}
        {result.stepByStepExplanation &&
          result.stepByStepExplanation.length > 0 && (
            <div className="mb-5 space-y-2.5">
              <div className="text-xs font-bold text-slate-400 tracking-wide uppercase flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.explanationSteps}</span>
              </div>
              <div className="space-y-2">
                {result.stepByStepExplanation.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/70 flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div
                      className={`text-xs sm:text-sm text-slate-300 leading-relaxed ${
                        isArabicContent ? 'font-arabic text-base' : ''
                      }`}
                    >
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Diagram & Visual Notes if any */}
        {result.diagramDescription && (
          <div className="mb-5 p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 text-xs text-blue-200 space-y-1">
            <span className="font-bold text-blue-300 uppercase tracking-wide">
              {t.diagramNotes}
            </span>
            <p className="leading-relaxed text-slate-300">
              {result.diagramDescription}
            </p>
          </div>
        )}

        {/* Key Educational Concepts */}
        {result.keyConcepts && result.keyConcepts.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              {t.keyConcepts}:
            </span>
            {result.keyConcepts.map((concept, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 border border-slate-700/80 text-indigo-300"
              >
                {concept}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
