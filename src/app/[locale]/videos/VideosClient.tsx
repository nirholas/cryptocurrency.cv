'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import VideoCard from '@/components/VideoCard';
import VideoPlayer from '@/components/VideoPlayer';
import { Skeleton } from '@/components/ui/Skeleton';
import { VIDEO_CATEGORIES, type Video, type VideoCategory } from '@/lib/video-sources';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

interface VideosResponse {
  videos: Video[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const PAGE_SIZE = 21;

export default function VideosClient({ initialSource }: { initialSource?: string }) {
  const t = useTranslations('videos');
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [activeCategory, setActiveCategory] = useState<VideoCategory | 'all'>('all');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  const fetchVideos = useCallback(
    async (reset: boolean) => {
      const newOffset = reset ? 0 : offset;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(newOffset),
        });
        if (initialSource) params.set('source', initialSource);
        if (activeCategory !== 'all') params.set('category', activeCategory);

        const res = await fetch(`/api/videos?${params}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data: VideosResponse = await res.json();

        if (reset) {
          setVideos(data.videos);
        } else {
          setVideos((prev) => [...prev, ...data.videos]);
        }
        setTotal(data.total);
        setHasMore(data.hasMore);
        setOffset(newOffset + data.limit);
      } catch {
        // Keep existing videos on error
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [offset, activeCategory, initialSource],
  );

  // Fetch on mount and when category changes
  useEffect(() => {
    fetchVideos(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, initialSource]);

  const featured = videos[0] ?? null;
  const grid = videos.slice(1);

  return (
    <>
      {/* Category tabs (hidden on per-source pages) */}
      {!initialSource && (
        <div className="scrollbar-hide mb-8 flex gap-2 overflow-x-auto pb-1">
          {VIDEO_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeCategory === cat.value
                  ? 'bg-accent text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary',
              )}
            >
              {t(`category.${cat.value}`)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-8">
          {/* Featured skeleton */}
          <div className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          {/* Grid skeleton */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ) : videos.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-text-secondary">{t('noVideos')}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Featured video */}
          {featured && (
            <section>
              <VideoCard video={featured} onPlay={setActiveVideo} featured />
            </section>
          )}

          {/* Video grid */}
          {grid.length > 0 && (
            <section>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {grid.map((video) => (
                  <VideoCard key={video.id} video={video} onPlay={setActiveVideo} />
                ))}
              </div>
            </section>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchVideos(false)}
                disabled={loadingMore}
                className="rounded-lg bg-surface-secondary px-6 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-tertiary disabled:opacity-50"
              >
                {loadingMore ? t('loading') : t('loadMore')}
              </button>
            </div>
          )}

          {/* Total count */}
          <p className="text-center text-xs text-text-tertiary">
            {t('showingCount', { shown: videos.length, total })}
          </p>
        </div>
      )}

      {/* Video player modal */}
      {activeVideo && <VideoPlayer video={activeVideo} onClose={() => setActiveVideo(null)} />}
    </>
  );
}
