import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, Sparkles, RefreshCw, Clipboard } from 'lucide-react';
import { TranslationDictionary } from '../translations';

interface Props {
  t: TranslationDictionary;
  onAnalyzeImage: (imageDataUrl: string) => void;
  isLoading: boolean;
  isRtl?: boolean;
}

export const ImageUploader: React.FC<Props> = ({
  t,
  onAnalyzeImage,
  isLoading,
  isRtl,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageMeta, setImageMeta] = useState<{ name: string; size: string } | null>(null);

  // Read file as Base64 Data URL
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const originalDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1440;
        let targetW = img.width;
        let targetH = img.height;

        if (img.width > maxDim || img.height > maxDim) {
          if (img.width > img.height) {
            targetH = Math.round((img.height * maxDim) / img.width);
            targetW = maxDim;
          } else {
            targetW = Math.round((img.width * maxDim) / img.height);
            targetH = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setSelectedImage(compressedDataUrl);
          const sizeKb = Math.round(compressedDataUrl.length * 0.75 / 1024);
          setImageMeta({
            name: file.name,
            size: `${sizeKb} KB (Optimized)`,
          });
        } else {
          setSelectedImage(originalDataUrl);
          setImageMeta({
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
          });
        }
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Global clipboard paste listener for Ctrl+V / Cmd+V
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  const clearImage = () => {
    setSelectedImage(null);
    setImageMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = () => {
    if (selectedImage) {
      onAnalyzeImage(selectedImage);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Dropzone or Selected Image */}
      {!selectedImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[260px] ${
            isDragging
              ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/40'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-white mb-1">
            {t.dragDropOrClick}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Supports exam screenshots, camera photos of worksheets, diagrams, textbooks, and multiple-choice questions.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.pasteFromClipboardTip}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black/60 max-h-[460px] flex items-center justify-center border border-slate-800/80">
            <img
              src={selectedImage}
              alt="Uploaded Question"
              className="w-full h-auto max-h-[440px] object-contain rounded-lg"
            />
            <button
              onClick={clearImage}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-950/80 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-lg"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>

            {imageMeta && (
              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 text-[11px] text-slate-300">
                {imageMeta.name} ({imageMeta.size})
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Choose different image
            </button>

            <button
              onClick={handleAnalyze}
              disabled={isLoading}
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
                  <span>Analyze Screenshot</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
