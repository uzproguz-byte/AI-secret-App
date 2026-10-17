import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Monitor,
  Square,
  AlertCircle,
  RefreshCw,
  Video,
  Eye,
  Sparkles,
  Zap,
  CheckCircle2,
  Smartphone,
  Play,
  Pause,
  ArrowRight,
} from 'lucide-react';
import { TranslationDictionary } from '../translations';
import { AnalysisResult } from '../types';

const SIGNATURE_WIDTH = 32;
const SIGNATURE_HEIGHT = 18;

// A tiny grayscale signature lets us detect meaningful page changes without
// uploading every frame. It deliberately ignores tiny cursor/blink changes.
function captureVisualSignature(video: HTMLVideoElement | null): number[] | null {
  if (!video || video.videoWidth < 20 || video.videoHeight < 20) return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = SIGNATURE_WIDTH;
    canvas.height = SIGNATURE_HEIGHT;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(video, 0, 0, SIGNATURE_WIDTH, SIGNATURE_HEIGHT);
    const pixels = context.getImageData(0, 0, SIGNATURE_WIDTH, SIGNATURE_HEIGHT).data;
    const signature: number[] = [];
    for (let i = 0; i < pixels.length; i += 4) {
      signature.push(Math.round((pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114) / 8) * 8);
    }
    return signature;
  } catch {
    return null;
  }
}

function compareVisualSignatures(a: number[], b: number[]) {
  if (a.length !== b.length || !a.length) return { changedRatio: 1, meanDelta: 255 };
  let changed = 0;
  let totalDelta = 0;
  for (let i = 0; i < a.length; i += 1) {
    const delta = Math.abs(a[i] - b[i]);
    if (delta >= 24) changed += 1;
    totalDelta += delta;
  }
  return {
    changedRatio: changed / a.length,
    meanDelta: totalDelta / a.length,
  };
}

interface Props {
  t: TranslationDictionary;
  onAnalyzeFrame: (imageDataUrl: string, fastMode?: boolean) => void;
  isLoading: boolean;
  currentResult?: AnalysisResult | null;
  elapsedSeconds?: number;
  isRtl?: boolean;
}

export const ScreenSharePanel: React.FC<Props> = ({
  t,
  onAnalyzeFrame,
  isLoading,
  currentResult,
  elapsedSeconds = 0,
  isRtl,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const baselineSignatureRef = useRef<number[] | null>(null);
  const autoAnalysisInFlightRef = useRef(false);
  const previousLoadingRef = useRef(false);

  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [streamResolution, setStreamResolution] = useState<{ width: number; height: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [autoSolveActive, setAutoSolveActive] = useState<boolean>(false);
  const [autoQuestionCount, setAutoQuestionCount] = useState<number>(0);

  // Stop sharing cleanup
  const stopScreenShare = useCallback(() => {
    setAutoSolveActive(false);
    baselineSignatureRef.current = null;
    autoAnalysisInFlightRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsSharing(false);
    setStreamResolution(null);
  }, []);

  // Start screen sharing directly from this button tap.
  // Some legacy browsers expose the API on navigator; standard browsers expose it on mediaDevices.
  const startScreenShare = async () => {
    setErrorMessage(null);

    const nav = navigator as Navigator & {
      getDisplayMedia?: (options?: DisplayMediaStreamOptions) => Promise<MediaStream>;
    };
    const devices = navigator.mediaDevices as (MediaDevices & {
      getDisplayMedia?: (options?: DisplayMediaStreamOptions) => Promise<MediaStream>;
    }) | undefined;

    const getDisplayMedia =
      (devices?.getDisplayMedia && devices.getDisplayMedia.bind(devices)) ||
      (nav.getDisplayMedia && nav.getDisplayMedia.bind(nav));

    if (!getDisplayMedia) {
      const mobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      setErrorMessage(
        mobileDevice
          ? 'This phone browser does not expose screen sharing to websites. The phone can share its screen in some apps, but this browser must provide getDisplayMedia for this website to receive the screen. Try opening this page in a browser that supports website screen capture.'
          : 'This browser does not expose the screen-capture API. Open this site in a current browser over HTTPS and try again.'
      );
      return;
    }

    try {
      // Use the least restrictive constraints. Some mobile pickers reject frame-rate preferences.
      const stream = await getDisplayMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0];
      if (!track) {
        stream.getTracks().forEach((item) => item.stop());
        throw new Error('The browser did not return a screen-share video track.');
      }

      streamRef.current = stream;
      track.onended = () => stopScreenShare();

      const settings = track.getSettings();
      if (settings.width && settings.height) {
        setStreamResolution({ width: settings.width, height: settings.height });
      }

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((item) => item.stop());
        streamRef.current = null;
        throw new Error('The screen-share preview is not ready. Tap Share Screen again.');
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      try {
        await video.play();
      } catch (playError) {
        // Keep the sharing state so the user can retry preview playback with a tap.
        console.warn('Screen-share preview autoplay was blocked:', playError);
      }
      if (video.videoWidth && video.videoHeight) {
        setStreamResolution({ width: video.videoWidth, height: video.videoHeight });
      }
      setIsSharing(true);
    } catch (err: any) {
      console.warn('Screen share cancelled or failed:', err);
      const mobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      if (err?.name === 'NotAllowedError') {
        setErrorMessage('Screen sharing was cancelled or blocked. Tap Start Screen Sharing again and approve the browser/system screen-share prompt.');
      } else if (err?.name === 'NotSupportedError' || err?.name === 'TypeError') {
        setErrorMessage(mobileDevice
          ? 'This mobile browser rejected website screen sharing. Screen sharing in the phone OS is not automatically available to webpages; the browser must support getDisplayMedia.'
          : 'This browser rejected the screen-capture request. Try an updated browser over HTTPS.');
      } else {
        setErrorMessage(err?.message || 'Unable to start screen capture.');
      }
      setIsSharing(false);
    }
  };

  // Capture a high-detail frame for accuracy on small answer choices.
  const handleCaptureAndAnalyze = useCallback((autoTriggered = false) => {
    if (!videoRef.current || !streamRef.current || isLoading) {
      if (autoTriggered) autoAnalysisInFlightRef.current = false;
      return;
    }

    try {
      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight || video.videoWidth < 20 || video.videoHeight < 20) {
        setErrorMessage('The shared screen is not ready yet. Wait for the question to appear, then try again.');
        if (autoTriggered) autoAnalysisInFlightRef.current = false;
        return;
      }

      // If the user manually analyzes while Solve Page is watching, treat this
      // frame as the current question so it is not immediately analyzed twice.
      if (!autoTriggered && autoSolveActive) {
        baselineSignatureRef.current = captureVisualSignature(video);
      }

      const rawW = video.videoWidth;
      const rawH = video.videoHeight;
      const maxDim = 1440;
      const scale = Math.min(1, maxDim / Math.max(rawW, rawH));
      const targetW = Math.max(1, Math.round(rawW * scale));
      const targetH = Math.max(1, Math.round(rawH * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setErrorMessage('Could not prepare the screenshot. Please try again.');
        if (autoTriggered) autoAnalysisInFlightRef.current = false;
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, targetW, targetH);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setCapturedPreview(dataUrl);
      setErrorMessage(null);
      if (autoTriggered) setAutoQuestionCount((count) => count + 1);
      // Higher vision resolution is intentional: it helps separate adjacent questions
      // and read small option labels. The server still returns quickly where possible.
      onAnalyzeFrame(dataUrl, false);
    } catch (err: any) {
      console.error('Frame capture error:', err);
      setErrorMessage('Could not capture the shared screen. Please try again.');
      if (autoTriggered) autoAnalysisInFlightRef.current = false;
    }
  }, [isLoading, onAnalyzeFrame, autoSolveActive]);

  // Release the auto-solve lock only after the current AI request has finished.
  // Keep the old baseline so a question change that happens during analysis is not missed.
  useEffect(() => {
    if (isLoading) {
      previousLoadingRef.current = true;
      return;
    }
    if (previousLoadingRef.current) {
      previousLoadingRef.current = false;
      autoAnalysisInFlightRef.current = false;
    }
  }, [isLoading]);

  // Solve Page: analyze the first visible question, then only analyze again when
  // the shared page visibly changes and remains stable. No repeated API calls
  // on the same question, and no accidental use of an adjacent question's option.
  useEffect(() => {
    if (!autoSolveActive || !isSharing || isLoading) return;

    let candidateSignature: number[] | null = null;
    let candidateSince = 0;

    const timer = window.setInterval(() => {
      if (isLoading || autoAnalysisInFlightRef.current) return;

      const signature = captureVisualSignature(videoRef.current);
      if (!signature) return;

      if (!baselineSignatureRef.current) {
        baselineSignatureRef.current = signature;
        return;
      }

      const change = compareVisualSignatures(signature, baselineSignatureRef.current);
      const isMeaningfulChange = change.changedRatio >= 0.055 && change.meanDelta >= 10;
      if (!isMeaningfulChange) {
        candidateSignature = null;
        candidateSince = 0;
        return;
      }

      if (!candidateSignature) {
        candidateSignature = signature;
        candidateSince = Date.now();
        return;
      }

      const stability = compareVisualSignatures(signature, candidateSignature);
      if (stability.changedRatio > 0.025 || stability.meanDelta > 8) {
        candidateSignature = signature;
        candidateSince = Date.now();
        return;
      }

      if (Date.now() - candidateSince >= 1000) {
        baselineSignatureRef.current = signature;
        candidateSignature = null;
        candidateSince = 0;
        autoAnalysisInFlightRef.current = true;
        handleCaptureAndAnalyze(true);
      }
    }, 700);

    return () => window.clearInterval(timer);
  }, [autoSolveActive, isSharing, isLoading, handleCaptureAndAnalyze]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, [stopScreenShare]);

  return (
    <div className="space-y-4">
      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="flex-1">
            <p className="font-semibold">{t.errorOccurred}</p>
            <p className="text-xs text-amber-200/90 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-amber-400 hover:text-white underline"
          >
            OK
          </button>
        </div>
      )}

      {/* Screen share player container */}
      <div className="relative rounded-3xl overflow-hidden border border-indigo-500/30 bg-slate-950 shadow-2xl min-h-[300px] sm:min-h-[360px] flex flex-col justify-center items-center group">
        {/* Active video stream element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-auto max-h-[520px] object-contain rounded-2xl transition-all ${
            isSharing ? 'block' : 'hidden'
          }`}
        />

        {/* Live stream status bar */}
        {isSharing && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
            <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                EKRAN ULASHILDI
              </span>
              {streamResolution && (
                <span className="text-[10px] text-slate-400 font-mono border-l border-slate-700 pl-2 hidden sm:inline">
                  {streamResolution.width} × {streamResolution.height}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="bg-amber-500/20 text-amber-300 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/40 text-[11px] font-bold shadow">
                ⚡ &lt;5s goal solve
              </span>
            </div>
          </div>
        )}

        {/* Live Solving Progress Banner over video feed */}
        {isSharing && isLoading && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-30 pointer-events-none animate-in fade-in">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 border border-amber-500/40 shadow-2xl">
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
              <div className="text-left">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Savol tahlil qilinmoqda · {elapsedSeconds}s
                </p>
                <p className="text-[11px] text-indigo-300">Natija tayyor bo‘lishi bilan shu yerda ko‘rinadi.</p>
              </div>
            </div>
          </div>
        )}

        {/* IN SCREEN SHARE: Direct Answer HUD Overlay */}
        {isSharing && currentResult && !isLoading && (
          <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-auto">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/92 backdrop-blur-xl border border-emerald-500/50 shadow-2xl text-left animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {currentResult.isUnclear ? (
                    <span className="px-2.5 py-0.5 rounded-lg font-black text-xs bg-amber-400 text-slate-950 shadow">
                      CHECK QUESTION BOUNDARY
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-lg font-black text-xs bg-emerald-500 text-slate-950 shadow">
                      CHOICE {currentResult.correctAnswerLabel}
                    </span>
                  )}
                  <span className={`text-xs font-bold ${currentResult.isUnclear ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {currentResult.isUnclear ? 'Need a clearer question view' : t.correctAnswer}
                  </span>
                </div>
                {currentResult.durationMs && (
                  <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {(currentResult.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>

              {/* Exact answer text */}
              <p className="text-sm sm:text-base font-extrabold text-white leading-snug line-clamp-2">
                {currentResult.correctAnswerText}
              </p>

              {/* Summary snippet */}
              {currentResult.summaryExplanation && (
                <p className="text-xs text-slate-300/90 mt-1 line-clamp-2 leading-relaxed">
                  {currentResult.summaryExplanation}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Inactive Placeholder view */}
        {!isSharing && (
          <div className="p-6 sm:p-10 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Monitor className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                {t.startScreenShare}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Avval testni alohida Chrome tabida oching. Share oynasida aynan test tabini tanlang — shunda bu yerga qaytsangiz ham test tasviri kuzatishda qoladi. Keyin <strong className="text-slate-200">Solve Page</strong> tugmasini bosing.
              </p>
            </div>

            <button
              onClick={startScreenShare}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-indigo-600/30 active:scale-[0.98] cursor-pointer"
            >
              <Video className="w-5 h-5" />
              <span>{t.startScreenShare}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/20">
                <Zap className="inline w-3 h-3 mr-1" /> Tez rejim
              </span>
            </button>

            <div className="pt-2 flex items-center justify-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-indigo-400" /> Desktop
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Mobile Screen
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Control bar when sharing is active */}
      {isSharing && (
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-indigo-500/40 shadow-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-left">
              <p className="text-sm font-bold text-white">Ekran tayyor</p>
              <p className="text-xs text-slate-400">Eng yaxshisi: faqat test Chrome tabini ulashing, butun monitorni emas.</p>
            </div>
            {/* Solve Page: scan the current visible question, then detect changed questions. */}
          <button
            onClick={() => {
              if (autoSolveActive) {
                setAutoSolveActive(false);
                baselineSignatureRef.current = null;
                setErrorMessage(null);
                return;
              }
              baselineSignatureRef.current = captureVisualSignature(videoRef.current);
              autoAnalysisInFlightRef.current = true;
              setAutoQuestionCount(0);
              setAutoSolveActive(true);
              handleCaptureAndAnalyze(true);
            }}
            disabled={isLoading && !autoSolveActive}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-extrabold transition-all cursor-pointer ${
              autoSolveActive
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/50 shadow-md'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400/50 shadow-lg shadow-emerald-600/20 hover:from-emerald-400 hover:to-teal-400'
            }`}
          >
            {autoSolveActive ? (
              <>
                <Pause className="w-4 h-4 fill-rose-300 text-rose-300" />
                <span>Stop Solve Page</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Solve Page</span>
              </>
            )}
          </button>

          </div>
          {autoSolveActive && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3.5 py-3 text-xs text-emerald-100/90">
              <p className="font-bold">Solve Page is watching · {autoQuestionCount} scan{autoQuestionCount === 1 ? '' : 's'} started</p>
              <p className="mt-1 text-emerald-100/70">
                It checks the current question first, then analyzes only after the shared screen changes and settles. Scroll to the next question yourself; a screen-share website cannot click or scroll the other tab.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-stretch gap-2.5">
            {/* Stop button */}
            <button
              onClick={stopScreenShare}
              className="order-2 sm:order-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>Ulashishni to‘xtatish</span>
            </button>

            {/* Main action: analyze the currently shared frame */}
            <button
              onClick={handleCaptureAndAnalyze}
              disabled={isLoading}
              className="order-1 sm:order-2 w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-indigo-600 to-violet-600 hover:from-amber-300 hover:via-indigo-500 hover:to-violet-500 text-white text-base font-extrabold transition-all shadow-xl shadow-indigo-600/30 active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-wait min-h-[54px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Tahlil qilinmoqda · {elapsedSeconds}s</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>Tahlil qilish</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
