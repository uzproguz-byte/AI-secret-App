import React, { useState } from 'react';
import { Sparkles, RefreshCw, BookOpen, Send, Eraser } from 'lucide-react';
import { TranslationDictionary } from '../translations';

interface Props {
  t: TranslationDictionary;
  onAnalyzeText: (text: string) => void;
  isLoading: boolean;
  isRtl?: boolean;
}

export const TextQuestionInput: React.FC<Props> = ({
  t,
  onAnalyzeText,
  isLoading,
  isRtl,
}) => {
  const [text, setText] = useState<string>('');

  const sampleQuestions = [
    {
      id: 'uz-math',
      title: "O'zbekcha Matematika (Kvadrat tenglama)",
      subject: 'math',
      lang: 'uz',
      content: `Savol: Ushbu kvadrat tenglamaning ildizlari yig'indisini toping:\n2x² - 8x + 6 = 0\n\nVariantlar:\nA) 2\nB) 4\nC) 6\nD) -4`,
    },
    {
      id: 'en-grammar',
      title: 'English SAT Grammar (Subject-Verb)',
      subject: 'english',
      lang: 'en',
      content: `Question: Select the correct verb form to complete the sentence:\n\n"The committee of experienced educational researchers _____ decided to publish their empirical findings next month."\n\nOptions:\nA) have\nB) has\nC) were\nD) having`,
    },
    {
      id: 'ar-grammar',
      title: 'اللغة العربية (الإعراب والنحو)',
      subject: 'arabic',
      lang: 'ar',
      content: `السؤال: ما هو إعراب كلمة "العلمُ" في الجملة التالية: "العلمُ نورٌ يضيءُ دروبَ الحياةِ"؟\n\nالخيارات:\nأ) فاعل مرفوع بالضمة\nب) مبتدأ مرفوع وعلامة رفعه الضمة الظاهرة على آخره\nج) خبر مرفوع بالضمة\nد) مفعول به منصوب بالفتحة`,
    },
    {
      id: 'it-code',
      title: 'IT & Python Programming',
      subject: 'it',
      lang: 'en',
      content: `Question: What is the output of the following Python code snippet?\n\ndef func(x, lst=[]):\n    lst.append(x)\n    return lst\n\nprint(func(1))\nprint(func(2))\n\nOptions:\nA) [1] and [2]\nB) [1] and [1, 2]\nC) [1, 2] and [1, 2]\nD) Error: mutable default parameter`,
    },
    {
      id: 'ru-physics',
      title: 'Физика (Кинематика)',
      subject: 'science',
      lang: 'ru',
      content: `Вопрос: Автомобиль движется равноускоренно из состояния покоя с ускорением a = 2 м/с². Какой путь пройдет автомобиль за t = 5 секунд?\n\nВарианты ответов:\nА) 10 м\nБ) 20 м\nВ) 25 м\nГ) 50 м`,
    },
  ];

  const handleApplySample = (content: string) => {
    setText(content);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAnalyzeText(text.trim());
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative rounded-2xl border border-slate-800 bg-slate-950/80 p-3 shadow-xl focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.pasteTextPlaceholder}
            rows={6}
            dir="auto"
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-y min-h-[140px] leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <span>{text.length} characters</span>
            {text && (
              <button
                type="button"
                onClick={() => setText('')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>{t.clear}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/40 active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.loadingMessage}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Solve Question</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick sample templates */}
      <div className="pt-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t.quickSamples}:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleApplySample(sample.content)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
