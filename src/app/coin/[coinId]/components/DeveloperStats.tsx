/**
 * DeveloperStats Component - GitHub and community statistics
 */

'use client';

import { motion } from 'framer-motion';
import type { DeveloperData, CommunityData } from '@/lib/market-data';

interface DeveloperStatsProps {
  developerData: DeveloperData | null;
  communityData: CommunityData | null;
  coinName: string;
}

function formatNumber(num: number | null | undefined): string {
  if (num == null) return '-';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
}

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subLabel?: string;
  color?: string;
}

function StatBox({ icon, label, value, subLabel, color = 'text-gray-400' }: StatBoxProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900/50 rounded-xl p-4 text-center border border-gray-700/30"
    >
      <div className={`inline-flex p-2 rounded-lg bg-gray-800 ${color} mb-2`}>
        {icon}
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {subLabel && (
        <div className="text-xs text-gray-600 mt-1">{subLabel}</div>
      )}
    </motion.div>
  );
}

export default function DeveloperStats({
  developerData,
  communityData,
  coinName,
}: DeveloperStatsProps) {
  const hasDevData = developerData && (
    developerData.stars > 0 ||
    developerData.forks > 0 ||
    developerData.commit_count_4_weeks > 0
  );

  const hasCommunityData = communityData && (
    (communityData.twitter_followers ?? 0) > 0 ||
    (communityData.reddit_subscribers ?? 0) > 0 ||
    (communityData.telegram_channel_user_count ?? 0) > 0
  );

  if (!hasDevData && !hasCommunityData) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Developer & Community Stats
      </h3>

      <div className="space-y-6">
        {/* GitHub Stats */}
        {hasDevData && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub Activity
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .25a.75.75 0 01.673.418l3.058 6.197 6.839.994a.75.75 0 01.415 1.279l-4.948 4.823 1.168 6.811a.75.75 0 01-1.088.791L12 18.347l-6.117 3.216a.75.75 0 01-1.088-.79l1.168-6.812-4.948-4.823a.75.75 0 01.416-1.28l6.838-.993L11.328.668A.75.75 0 0112 .25z" />
                  </svg>
                }
                label="Stars"
                value={formatNumber(developerData!.stars)}
                color="text-yellow-500"
              />
              <StatBox
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                }
                label="Forks"
                value={formatNumber(developerData!.forks)}
                color="text-blue-500"
              />
              <StatBox
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                label="Commits (4w)"
                value={formatNumber(developerData!.commit_count_4_weeks)}
                color="text-green-500"
              />
              <StatBox
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
                label="Watchers"
                value={formatNumber(developerData!.subscribers)}
                color="text-purple-500"
              />
            </div>

            {/* Commit Activity Chart */}
            {developerData!.last_4_weeks_commit_activity_series?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <span className="text-xs text-gray-500 mb-2 block">Commit Activity (Last 4 weeks)</span>
                <div className="flex items-end gap-1 h-12">
                  {developerData!.last_4_weeks_commit_activity_series.slice(-28).map((commits, i) => {
                    const max = Math.max(...developerData!.last_4_weeks_commit_activity_series);
                    const height = max > 0 ? (commits / max) * 100 : 0;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-green-500/30 rounded-t transition-all hover:bg-green-500/50"
                        style={{ height: `${Math.max(4, height)}%` }}
                        title={`${commits} commits`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* PR & Issues */}
            {(developerData!.pull_requests_merged > 0 || developerData!.closed_issues > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-2 md:grid-cols-4 gap-4">
                {developerData!.pull_requests_merged > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">PRs Merged</span>
                    <p className="text-sm font-medium text-white">
                      {formatNumber(developerData!.pull_requests_merged)}
                    </p>
                  </div>
                )}
                {developerData!.pull_request_contributors > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">Contributors</span>
                    <p className="text-sm font-medium text-white">
                      {formatNumber(developerData!.pull_request_contributors)}
                    </p>
                  </div>
                )}
                {developerData!.closed_issues > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">Closed Issues</span>
                    <p className="text-sm font-medium text-white">
                      {formatNumber(developerData!.closed_issues)}
                    </p>
                  </div>
                )}
                {developerData!.total_issues > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">Total Issues</span>
                    <p className="text-sm font-medium text-white">
                      {formatNumber(developerData!.total_issues)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Community Stats */}
        {hasCommunityData && (
          <div className={hasDevData ? 'pt-6 border-t border-gray-700/50' : ''}>
            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Community
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(communityData!.twitter_followers ?? 0) > 0 && (
                <StatBox
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  }
                  label="Twitter"
                  value={formatNumber(communityData!.twitter_followers)}
                  color="text-sky-500"
                />
              )}
              {(communityData!.reddit_subscribers ?? 0) > 0 && (
                <StatBox
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm6.67-10a1.46 1.46 0 00-2.47-1 7.12 7.12 0 00-3.85-1.23l.65-3.07 2.12.44a1 1 0 101.81-.45l-2.83-.6a.69.69 0 00-.82.55l-.73 3.43a7.14 7.14 0 00-3.89 1.23 1.46 1.46 0 10-1.61 2.39 2.87 2.87 0 000 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 000-.44 1.46 1.46 0 00.9-1.37z" />
                    </svg>
                  }
                  label="Reddit"
                  value={formatNumber(communityData!.reddit_subscribers)}
                  subLabel={communityData!.reddit_accounts_active_48h > 0 
                    ? `${formatNumber(communityData!.reddit_accounts_active_48h)} active` 
                    : undefined
                  }
                  color="text-orange-500"
                />
              )}
              {(communityData!.telegram_channel_user_count ?? 0) > 0 && (
                <StatBox
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 1 0 24 12 12.013 12.013 0 0 0 11.944 0Zm5.59 8.47-1.72 8.09c-.13.58-.47.72-.96.45l-2.65-1.95-1.28 1.23a.67.67 0 0 1-.53.26l.19-2.7 4.94-4.46c.22-.19-.05-.3-.34-.11l-6.11 3.85-2.63-.82c-.57-.18-.58-.57.12-.85l10.29-3.97c.48-.17.9.12.74.85v-.01Z" />
                    </svg>
                  }
                  label="Telegram"
                  value={formatNumber(communityData!.telegram_channel_user_count)}
                  color="text-blue-400"
                />
              )}
              {(communityData!.facebook_likes ?? 0) > 0 && (
                <StatBox
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  }
                  label="Facebook"
                  value={formatNumber(communityData!.facebook_likes)}
                  color="text-blue-600"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
