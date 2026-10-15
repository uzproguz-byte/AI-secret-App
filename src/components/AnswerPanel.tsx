import React, { useState } from 'react';
import { AlertTriangle, BookOpen, Check, CheckCircle2, ChevronDown, Copy, Layers, Volume2, VolumeX, Zap } from 'lucide-react';
import { AnalysisResult } from '../types';
import { TranslationDictionary } from '../translations';

interface Props {
  result: AnalysisResult;
  sourceImage?: string | null;
  t: TranslationDictionary;
  isRtl?: boolean;
}

export const AnswerPanel: React.FC<Props> = ({ result, sourceImage, t, isRtl }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLearningDetails, setShowLearningDetails] = useState(false);

  const handleCopy = async () => {
    const answer = [result.correctAnswerLabel || '', result.correctAnswerText || ''].filter(Boolean).join(': ');
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      window.alert('Speech synthesis is not supported in this browser.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const speech = new SpeechSynthesisUtterance(
      [t.correctAnswer, result.correctAnswerLabel, result.correctAnswerText, result.summaryExplanation].filter(Boolean).join('. ')
    );
    const detected = result.detectedLanguage?.toLowerCase() || '';
    if (detected.includes('uzbek') || detected.includes("o'zbek")) speech.lang = 'uz-UZ';
    else if (detected.includes('arab')) speech.lang = 'ar-SA';
    else if (detected.includes('russ')) speech.lang = 'ru-RU';
    else speech.lang = 'en-US';
    speech.onend = () => setIsSpeaking(false);
    speech.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
    setIsSpeaking(true);
  };

  const confidenceColor = {
    HIGH: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    MEDIUM: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
    LOW: 'text-rose-300 bg-rose-500/10 border-rose-500/25',
  }[result.confidence] || 'text-indigo-300 bg-indigo-500/10 border-indigo-500/25';
  const confidenceLabel = {
    HIGH: t.confidenceHigh,
    MEDIUM: t.confidenceMedium,
    LOW: t.confidenceLow,
  }[result.confidence] || result.confidence;
  const isArabicContent = result.detectedLanguage?.toLowerCase().includes('arab') || /[\u0600-\u06FF]/.test(result.questionText || '');
  const correctOptionWithBox = result.options?.find((option) => option.isCorrect && option.box2d && option.box2d.length === 4);

  return (
    <section dir={isRtl || isArabicContent ? 'rtl' : 'ltr'} className="space-y-3 animate-in fade-in duration-300" aria-label="Practice result">
      {(result.isUnclear || result.warningNotice) && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold">{result.isUnclear ? t.unclearTitle : t.warningTitle}</h4>
            <p className="leading-relaxed text-amber-100/90">{result.unclearReason || result.warningNotice}</p>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/35 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 p-4 sm:p-5 shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500" />
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500/15 text-indigo-200 border border-indigo-500/25">{result.detectedSubject || 'Study practice'}</span>
            {result.detectedLanguage && <span className="px-2.5 py-1 rounded-lg text-[11px] text-slate-300 bg-slate-800/80 border border-slate-700/70">{result.detectedLanguage}</span>}
            {result.durationMs != null && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 bg-slate-800/80 border border-slate-700/70"><Zap className="w-3 h-3 text-amber-300" />{(result.durationMs / 1000).toFixed(1)}s</span>}
          </div>
          <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border " + confidenceColor}>
            <CheckCircle2 className="w-3.5 h-3.5" />{confidenceLabel}
            {result.confidenceScore != null && <span>· {result.confidenceScore}%</span>}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-16 h-16 sm:w-[76px] sm:h-[76px] shrink-0 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-600 p-[1px] shadow-lg shadow-indigo-900/40">
            <div className="w-full h-full rounded-2xl bg-slate-950/90 flex items-center justify-center text-3xl sm:text-4xl font-black text-white">{result.correctAnswerLabel || '—'}</div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-indigo-300 mb-1">{t.correctAnswer}</p>
            <p className={"text-base sm:text-lg font-bold text-white leading-snug break-words " + (isArabicContent ? 'font-arabic' : '')}>{result.correctAnswerText || 'No answer text returned'}</p>
            <p className="text-xs text-slate-400 mt-1">Open the explanation to review how to reach the result.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button type="button" onClick={handleCopy} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}{copied ? t.copied : t.copyAnswer}
          </button>
          <button type="button" onClick={handleToggleSpeech} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors">
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-300" /> : <Volume2 className="w-3.5 h-3.5" />}{isSpeaking ? t.stopAudio : t.readAloud}
          </button>
          <button type="button" onClick={() => setShowLearningDetails((visible) => !visible)} aria-expanded={showLearningDetails} className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/35 text-xs font-bold text-indigo-100 transition-colors">
            <BookOpen className="w-3.5 h-3.5" />{showLearningDetails ? 'Hide explanation' : 'Show explanation'}
            <ChevronDown className={"w-3.5 h-3.5 transition-transform " + (showLearningDetails ? 'rotate-180' : '')} />
          </button>
        </div>
      </div>

      {showLearningDetails && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {result.questionText && <section className="rounded-xl bg-slate-950/60 border border-slate-800 p-3.5 space-y-1.5"><h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-400">{t.questionDetected}</h3><p className={"text-sm text-slate-200 leading-relaxed whitespace-pre-wrap " + (isArabicContent ? 'font-arabic text-base' : '')}>{result.questionText}</p></section>}

          {result.isMultipleChoice && result.options && result.options.length > 0 && (
            <section className="rounded-xl bg-slate-950/50 border border-slate-800 p-3.5 space-y-2">
              <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Answer options</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.options.map((option, index) => {
                  const isCorrect = option.isCorrect || option.label.trim().toUpperCase() === (result.correctAnswerLabel || '').trim().toUpperCase();
                  return <div key={String(option.label) + '-' + index} className={"flex items-start gap-2.5 p-2.5 rounded-lg border " + (isCorrect ? 'bg-emerald-500/10 border-emerald-500/35 text-white' : 'bg-slate-900/70 border-slate-800 text-slate-300')}>
                    <span className={"w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-xs font-bold " + (isCorrect ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-800 text-slate-400')}>{option.label}</span>
                    <span className={"text-xs leading-relaxed " + (isArabicContent ? 'font-arabic text-sm' : '')}>{option.text}</span>
                  </div>;
                })}
              </div>
            </section>
          )}

          {sourceImage && <section className="rounded-xl bg-slate-950/50 border border-slate-800 p-3.5 space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Question image</h3>
            <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
              <img src={sourceImage} alt="Question used for practice analysis" className="w-full max-h-80 object-contain" />
              {correctOptionWithBox?.box2d && <div className="absolute border-2 border-emerald-400 bg-emerald-500/15 rounded pointer-events-none" style={{
                top: String(correctOptionWithBox.box2d[0] / 10) + '%',
                left: String(correctOptionWithBox.box2d[1] / 10) + '%',
                height: String((correctOptionWithBox.box2d[2] - correctOptionWithBox.box2d[0]) / 10) + '%',
                width: String((correctOptionWithBox.box2d[3] - correctOptionWithBox.box2d[1]) / 10) + '%',
              }} />}
            </div>
          </section>}

          {result.summaryExplanation && <section className="rounded-xl bg-slate-950/60 border border-indigo-500/20 p-3.5 space-y-1.5">
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-indigo-300">Summary explanation</h3>
            <p className={"text-sm text-slate-200 leading-relaxed " + (isArabicContent ? 'font-arabic text-base' : '')}>{result.summaryExplanation}</p>
          </section>}

          {result.stepByStepExplanation && result.stepByStepExplanation.length > 0 && <section className="rounded-xl bg-slate-950/40 border border-slate-800 p-3.5 space-y-2.5">
            <h3 className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-slate-400"><Layers className="w-3.5 h-3.5 text-indigo-300" />{t.explanationSteps}</h3>
            <div className="space-y-2">
              {result.stepByStepExplanation.map((step, index) => <div key={index} className="flex items-start gap-2.5">
                <span className="w-6 h-6 shrink-0 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-200 font-bold text-xs flex items-center justify-center">{index + 1}</span>
                <p className={"text-sm text-slate-300 leading-relaxed pt-0.5 " + (isArabicContent ? 'font-arabic text-base' : '')}>{step}</p>
              </div>)}
            </div>
          </section>}

          {result.diagramDescription && <section className="rounded-xl bg-blue-950/20 border border-blue-500/25 p-3.5 space-y-1">
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-blue-200">{t.diagramNotes}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{result.diagramDescription}</p>
          </section>}

          {result.keyConcepts && result.keyConcepts.length > 0 && <section className="rounded-xl bg-slate-950/40 border border-slate-800 p-3.5 space-y-2">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.keyConcepts}</h3>
            <div className="flex flex-wrap gap-1.5">{result.keyConcepts.map((concept, index) => <span key={String(concept) + '-' + index} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-indigo-200">{concept}</span>)}</div>
          </section>}
        </div>
      )}
    </section>
  );
};
