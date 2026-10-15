import React from 'react';
import { ShieldAlert, X, ExternalLink, CheckCircle2 } from 'lucide-react';
import { TranslationDictionary } from '../translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  t: TranslationDictionary;
  isRtl?: boolean;
}

export const DisclaimerModal: React.FC<Props> = ({ isOpen, onClose, t, isRtl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        dir={isRtl ? 'rtl' : 'ltr'} 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-200 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t.disclaimerTitle}</h3>
              <p className="text-xs text-slate-400">Browser Environment & Integrity Guidelines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-sm leading-relaxed text-slate-300">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {t.screenShareNoticeTitle}
            </h4>
            <p className="text-xs text-slate-300">
              {t.screenShareNoticeText}
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-400">
            <p>
              • <strong className="text-slate-200">Browser Permissions:</strong> The browser explicitly prompts you to select a screen, window, or tab. No video feed is recorded or streamed without your explicit consent.
            </p>
            <p>
              • <strong className="text-slate-200">Restricted Testing Websites:</strong> If a testing website uses full-screen lockouts or tab-switch detection, switching focus to another window or tab will be recorded by that website. Screen sharing cannot and will not conceal tab switching.
            </p>
            <p>
              • <strong className="text-slate-200">Educational Practice:</strong> Use this assistant to solve practice problems, understand difficult equations, learn grammatical structures, and study step-by-step methodologies.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
          >
            {t.disclaimerClose}
          </button>
        </div>
      </div>
    </div>
  );
};
