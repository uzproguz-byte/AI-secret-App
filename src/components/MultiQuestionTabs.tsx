import React from 'react';
import { Layers, ChevronRight, Check } from 'lucide-react';
import { QuestionSummary } from '../types';
import { TranslationDictionary } from '../translations';

interface Props {
  questions: QuestionSummary[];
  activeIndex: number;
  onSelectQuestion: (index: number) => void;
  isLoading: boolean;
  t: TranslationDictionary;
  isRtl?: boolean;
}

export const MultiQuestionTabs: React.FC<Props> = ({
  questions,
  activeIndex,
  onSelectQuestion,
  isLoading,
  t,
  isRtl,
}) => {
  if (!questions || questions.length <= 1) return null;

  return (
    <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 mb-5 animate-in fade-in">
      <div className="flex items-center gap-2 mb-2.5">
        <Layers className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-bold text-white">
          {t.multipleQuestionsFoundTitle}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
          {questions.length} questions detected
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-2.5">
        {t.selectQuestionToSolve}
      </p>

      <div className="flex flex-wrap gap-2">
        {questions.map((q) => {
          const isSelected = activeIndex === q.index;
          return (
            <button
              key={q.index}
              onClick={() => onSelectQuestion(q.index)}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left border ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isSelected ? 'bg-white text-indigo-700' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {q.index + 1}
              </div>
              <span className="max-w-[200px] truncate">
                {q.title || q.snippet || `Question ${q.index + 1}`}
              </span>
              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
