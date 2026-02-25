/**
 * AIPodcastPlayer — AI-Generated Crypto News Audio Player
 *
 * Plays AI-generated podcast episodes with a sleek audio player UI.
 * Supports script view, segment navigation, and playback controls.
 *
 * @module components/AIPodcastPlayer
 */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PodcastFormat = 'flash' | 'deep-dive' | 'market-open' | 'weekly-recap';

interface PodcastSegment {
  type: 'intro' | 'headline' | 'analysis' | 'market-data' | 'transition' | 'outro';
  text: string;
  speaker: string;
  durationEstimate: number;
}

interface PodcastScript {
  title: string;
  description: string;
  format: PodcastFormat;
  segments: PodcastSegment[];
  totalDuration: number;
  generatedAt: string;
}

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  format: PodcastFormat;
  script: PodcastScript;
  audioUrl?: string;
  duration: number;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const formatConfig: Record<PodcastFormat, { label: string; icon: string; color: string }> = {
  flash: { label: 'Flash Brief', icon: '⚡', color: 'from-amber-500 to-orange-500' },
  'deep-dive': { label: 'Deep Dive', icon: '🔬', color: 'from-blue-500 to-indigo-500' },
  'market-open': { label: 'Market Open', icon: '🔔', color: 'from-emerald-500 to-teal-500' },
  'weekly-recap': { label: 'Weekly Recap', icon: '📅', color: 'from-purple-500 to-pink-500' },
};

const segmentIcons: Record<string, string> = {
  intro: '🎙️',
  headline: '📰',
  analysis: '🔍',
  'market-data': '📊',
  transition: '→',
  outro: '👋',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AIPodcastPlayerProps {
  defaultFormat?: PodcastFormat;
}

export function AIPodcastPlayer({ defaultFormat = 'flash' }: AIPodcastPlayerProps) {
  const [format, setFormat] = useState<PodcastFormat>(defaultFormat);
  const [episode, setEpisode] = useState<PodcastEpisode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showScript, setShowScript] = useState(false);
  const [activeSegment, setActiveSegment] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const generateEpisode = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEpisode(null);

    try {
      // First try with audio
      const audioRes = await fetch(`/api/podcast?format=${format}&audio=true`);

      if (audioRes.ok) {
        const contentType = audioRes.headers.get('content-type') || '';

        if (contentType.includes('audio')) {
          // Got audio — create blob URL
          const blob = await audioRes.blob();
          const audioUrl = URL.createObjectURL(blob);

          // Also fetch script for transcript
          const scriptRes = await fetch(`/api/podcast?format=${format}&audio=false`);
          const scriptData = await scriptRes.json();

          setEpisode({
            ...scriptData.episode,
            audioUrl,
          });
        } else {
          // Got JSON (no TTS available)
          const data = await audioRes.json();
          setEpisode(data.episode);
        }
      } else {
        throw new Error(`API error: ${audioRes.status}`);
      }
    } catch (err) {
      console.error('[Podcast Player] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate episode');
    } finally {
      setLoading(false);
    }
  }, [format]);

  // Audio playback tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Update active segment based on time
      if (episode?.script?.segments) {
        let elapsed = 0;
        for (let i = 0; i < episode.script.segments.length; i++) {
          elapsed += episode.script.segments[i].durationEstimate;
          if (audio.currentTime < elapsed) {
            setActiveSegment(i);
            break;
          }
        }
      }
    };

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [episode]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (pct: number) => {
    if (!audioRef.current || !duration) return;
    audioRef.current.currentTime = pct * duration;
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`px-5 py-4 bg-gradient-to-r ${formatConfig[format].color} bg-opacity-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 dark:bg-black/20 backdrop-blur flex items-center justify-center text-2xl">
              🎧
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Crypto Pulse</h3>
              <p className="text-white/70 text-sm">AI-Powered News Podcast</p>
            </div>
          </div>
        </div>
      </div>

      {/* Format Selector */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex gap-2 overflow-x-auto">
        {(Object.entries(formatConfig) as [PodcastFormat, typeof formatConfig[PodcastFormat]][]).map(
          ([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFormat(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                format === key
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {cfg.icon} {cfg.label}
            </button>
          )
        )}
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Generate Button */}
        {!episode && !loading && (
          <button
            onClick={generateEpisode}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">🎙️</span>
            Generate {formatConfig[format].label}
          </button>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-8 flex flex-col items-center gap-3">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-800" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl">🎵</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
              AI is writing your podcast script...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="py-4 px-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 dark:text-red-400">
            {error}
            <button
              onClick={generateEpisode}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Episode Player */}
        {episode && (
          <div className="space-y-4">
            {/* Episode Info */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                {episode.title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {episode.description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>{formatConfig[episode.format].icon} {formatConfig[episode.format].label}</span>
                <span>~{formatDuration(episode.duration)}</span>
                <span>{new Date(episode.generatedAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Audio Player */}
            {episode.audioUrl && (
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                <audio ref={audioRef} src={episode.audioUrl} preload="metadata">
                  <track kind="captions" />
                </audio>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg"
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>

                  <div className="flex-1">
                    {/* Progress Bar */}
                    <div
                      role="slider"
                      tabIndex={0}
                      aria-label="Seek"
                      aria-valuenow={Math.round(currentTime)}
                      aria-valuemin={0}
                      aria-valuemax={Math.round(duration)}
                      className="h-2 bg-gray-200 dark:bg-slate-600 rounded-full cursor-pointer overflow-hidden"
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        seekTo((e.clientX - rect.left) / rect.width);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'ArrowRight') seekTo(Math.min(1, (currentTime + 5) / duration));
                        if (e.key === 'ArrowLeft') seekTo(Math.max(0, (currentTime - 5) / duration));
                      }}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] font-mono text-gray-400">
                        {formatDuration(currentTime)}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {formatDuration(duration || episode.duration)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Audio Message */}
            {!episode.audioUrl && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-300">
                🔇 Audio not available — set GOOGLE_CLOUD_TTS_API_KEY for voice synthesis. Script is shown below.
              </div>
            )}

            {/* Toggle Script */}
            <button
              onClick={() => setShowScript(!showScript)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              {showScript ? '▼ Hide' : '▶ Show'} Transcript ({episode.script?.segments?.length || 0} segments)
            </button>

            {/* Script View */}
            {showScript && episode.script?.segments && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {episode.script.segments.map((seg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border transition-all ${
                      i === activeSegment
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                        : 'bg-gray-50 dark:bg-slate-700/30 border-gray-100 dark:border-slate-600/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs">{segmentIcons[seg.type] || '📝'}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {seg.type}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        ~{seg.durationEstimate}s
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {seg.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* New Episode Button */}
            <button
              onClick={generateEpisode}
              disabled={loading}
              className="w-full py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all text-sm"
            >
              🔄 Generate New Episode
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30">
        <span className="text-[10px] text-gray-400">
          ⚠️ AI-generated content. Not financial advice. Powered by multi-provider AI + Google Cloud TTS.
        </span>
      </div>
    </div>
  );
}

export default AIPodcastPlayer;
