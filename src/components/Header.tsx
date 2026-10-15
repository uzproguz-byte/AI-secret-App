import React, { useState } from 'react';
import { Sparkles, Globe, History, Info, RotateCcw, Smartphone, Share2, Check } from 'lucide-react';
import { TranslationDictionary } from '../translations';

interface Props {
  t: TranslationDictionary;
  uiLang: 'uz' | 'en' | 'ar' | 'ru';
  onUiLangChange: (lang: 'uz' | 'en' | 'ar' | 'ru') => void;
  onOpenHistory: () => void;
  historyCount: number;
  onOpenDisclaimer: () => void;
  onClear: () => void;
  hasActiveResult: boolean;
  isMobileMode?: boolean;
  onToggleMobileMode?: () => void;
  isRtl?: boolean;
}

export const Header: React.FC<Props> = ({
  t,
  uiLang,
  onUiLangChange,
  onOpenHistory,
  historyCount,
  onOpenDisclaimer,
  onClear,
  hasActiveResult,
  isMobileMode,
  onToggleMobileMode,
  isRtl,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = async () => {
    // Use the active live website URL
    const shareUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Study Assistant',
          text: 'AI study practice with multilingual explanations.',
          url: shareUrl,
        });
        return;
      } catch (e) {
        // Fallback to clipboard if share sheet dismissed or not allowed
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-lg tracking-tight text-white flex items-center gap-2">
                AI Study Assistant
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Mobile mode switch button */}
          {onToggleMobileMode && (
            <button
              onClick={onToggleMobileMode}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isMobileMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:text-white border-slate-700/60'
              }`}
              title="Toggle Mobile Mode"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isMobileMode ? 'Mobile ON' : 'Mobile'}
              </span>
            </button>
          )}

          {/* Share with Friends Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 border border-indigo-500/40 shadow-sm cursor-pointer active:scale-95 transition-all"
            title="Share Website Link"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-200">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-cyan-200" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          {/* Clear button if active */}
          {hasActiveResult && (
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title={t.clear}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.clear}</span>
            </button>
          )}

          {/* Educational notice button */}
          <button
            onClick={onOpenDisclaimer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            title={t.disclaimerBtn}
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">{t.disclaimerBtn}</span>
          </button>

          {/* History drawer button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors relative"
            title={t.history}
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{t.history}</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500 text-white leading-tight">
                {historyCount}
              </span>
            )}
          </button>

          {/* UI Language selector */}
          <div className="flex items-center gap-0.5 p-0.5 sm:p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 mx-1 hidden sm:inline" />
            {(['uz', 'en', 'ar', 'ru'] as const).map((code) => {
              const label = {
                uz: "O'Z",
                en: "EN",
                ar: "عر",
                ru: "РУ",
              }[code];
              const isSelected = uiLang === code;
              return (
                <button
                  key={code}
                  onClick={() => onUiLangChange(code)}
                  className={`px-1.5 sm:px-2 py-1 rounded-lg font-bold text-[10px] sm:text-xs transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
