'use client';

import { cn } from '@/lib/utils';
import type { Video } from '@/lib/video-sources';
import { Play } from 'lucide-react';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface VideoCardProps {
  video: Video;
  onPlay: (video: Video) => void;
  featured?: boolean;
}

export default function VideoCard({ video, onPlay, featured }: VideoCardProps) {
  if (featured) {
    return (
      <article
        className="group grid cursor-pointer items-center gap-6 md:grid-cols-2 md:gap-10"
        onClick={() => onPlay(video)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPlay(video);
          }
        }}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-tertiary">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="eager"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm">
              <Play className="ml-0.5 h-7 w-7 fill-black text-black" />
            </div>
          </div>
          {/* Source badge */}
          <span className="absolute top-3 left-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {video.source.name}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3">
          <h2 className="font-serif text-2xl leading-[1.15] font-bold tracking-tight transition-colors group-hover:text-accent md:text-3xl">
            {video.title}
          </h2>
          {video.description && (
            <p className="line-clamp-3 text-base leading-relaxed text-text-secondary">
              {video.description}
            </p>
          )}
          <span className="text-xs text-text-tertiary">
            {video.source.name} &middot; {timeAgo(video.publishedAt)}
          </span>
        </div>
      </article>
    );
  }

  return (
    <article
      className="group flex cursor-pointer flex-col gap-3"
      onClick={() => onPlay(video)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(video);
        }
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-tertiary">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm">
            <Play className="ml-0.5 h-5 w-5 fill-black text-black" />
          </div>
        </div>
        {/* Source badge */}
        <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {video.source.name}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5">
        <h3 className="line-clamp-2 font-serif text-base leading-snug font-bold transition-colors group-hover:text-accent">
          {video.title}
        </h3>
        <span className="text-xs text-text-tertiary">
          {video.source.name} &middot; {timeAgo(video.publishedAt)}
        </span>
      </div>
    </article>
  );
}
