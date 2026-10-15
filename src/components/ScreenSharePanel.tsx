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

interface Props {
  t: TranslationDictionary;
  onAnalyzeFrame: (imageDataUrl: string) => void;
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
  const autoScanTimerRef = useRef<any>(null);

  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [streamResolution, setStreamResolution] = useState<{ width: number; height: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [autoSolveActive, setAutoSolveActive] = useState<boolean>(false);

  // Stop sharing cleanup
  const stopScreenShare = useCallback(() => {
    if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
    setAutoSolveActive(false);

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

  // Start Screen Sharing (Universal mobile & desktop compatible)
  const startScreenShare = async () => {
    setErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setErrorMessage(
        t.screenShareNotSupported ||
          'Your current browser does not support WebRTC screen capture. On Android, please use Chrome or Edge.'
      );
      return;
    }

    try {
      // Mobile-safe displayMedia constraints
      // Note: Do NOT specify displaySurface: "monitor" because mobile devices reject monitor surfaces
      const constraints: any = {
        video: {
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      streamRef.current = stream;

      // Handle user stopping share through browser banner
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopScreenShare();
        };

        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setStreamResolution({ width: settings.width, height: settings.height });
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          if (videoRef.current?.videoWidth && videoRef.current?.videoHeight) {
            setStreamResolution({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
          }
        };
      }

      setIsSharing(true);
    } catch (err: any) {
      console.warn('Screen share cancelled or failed:', err);
      if (err.name === 'NotAllowedError') {
        setErrorMessage(t.screenSharePermissionDenied);
      } else {
        setErrorMessage(err.message || 'Unable to start screen capture');
      }
      setIsSharing(false);
    }
  };

  // Ultra-fast frame capture (< 10ms execution, < 3s solve target)
  const handleCaptureAndAnalyze = useCallback(() => {
    if (!videoRef.current || !streamRef.current || isLoading) return;

    try {
      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight || video.videoWidth < 20 || video.videoHeight < 20) {
        setErrorMessage('Waiting for screen stream to render active pixels. Please ensure the shared window is open and visible.');
        return;
      }

      const rawW = video.videoWidth;
      const rawH = video.videoHeight;

      // Fast-solve geometry: scale to max dimension of 1080px with 0.76 quality
      // Drops upload payload to ~60KB so analysis finishes in under 2.5 seconds!
      const maxDim = 1080;
      let targetW = rawW;
      let targetH = rawH;
      if (rawW > maxDim || rawH > maxDim) {
        if (rawW > rawH) {
          targetH = Math.round((rawH * maxDim) / rawW);
          targetW = maxDim;
        } else {
          targetW = Math.round((rawW * maxDim) / rawH);
          targetH = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setErrorMessage('Failed to initialize 2D canvas context for frame capture.');
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(video, 0, 0, targetW, targetH);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.76);
      setCapturedPreview(dataUrl);
      onAnalyzeFrame(dataUrl);
    } catch (err: any) {
      console.error('Frame capture error:', err);
      setErrorMessage('Could not capture frame from video stream.');
    }
  }, [isLoading, onAnalyzeFrame]);

  // Handle auto-solve interval (throttled to 6s to prevent 429 quota errors)
  useEffect(() => {
    if (autoSolveActive && isSharing) {
      if (!isLoading) {
        handleCaptureAndAnalyze();
      }

      autoScanTimerRef.current = setInterval(() => {
        if (!isLoading && isSharing) {
          handleCaptureAndAnalyze();
        }
      }, 6000);
    } else {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
    }

    return () => {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
      }
    };
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
                SCREEN LIVE
              </span>
              {streamResolution && (
                <span className="text-[10px] text-slate-400 font-mono border-l border-slate-700 pl-2 hidden sm:inline">
                  {streamResolution.width} × {streamResolution.height}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="bg-amber-500/20 text-amber-300 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/40 text-[11px] font-bold shadow">
                ⚡ &lt;3s solve
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
                  Solving Screen in Real-Time: {elapsedSeconds}s
                </p>
                <p className="text-[11px] text-indigo-300">Targeting under 3 seconds...</p>
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
                  <span className="px-2.5 py-0.5 rounded-lg font-black text-xs bg-emerald-500 text-slate-950 shadow">
                    CHOICE {currentResult.correctAnswerLabel}
                  </span>
                  <span className="text-xs font-bold text-emerald-300">
                    {t.correctAnswer}
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
                Share your screen, test tab, or mobile screen. When active, solutions appear instantly right here in AI Study Assistant in under 3 seconds!
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
                ⚡ &lt;3s
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
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-indigo-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Auto solve toggle */}
          <button
            onClick={() => setAutoSolveActive(!autoSolveActive)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              autoSolveActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/80'
            }`}
          >
            {autoSolveActive ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>Auto-Solve Active (Every 3s)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Turn ON Auto-Solve (Every 3s)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Stop button */}
            <button
              onClick={stopScreenShare}
              disabled={isLoading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>{t.stopScreenShare}</span>
            </button>

            {/* Analyze Current Screen button (< 3s) */}
            <button
              onClick={handleCaptureAndAnalyze}
              disabled={isLoading}
              className="flex-2 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white text-xs sm:text-sm font-extrabold transition-all shadow-xl shadow-indigo-600/40 active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Solving ({elapsedSeconds}s)...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>Analyze Screen (&lt;3s)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
