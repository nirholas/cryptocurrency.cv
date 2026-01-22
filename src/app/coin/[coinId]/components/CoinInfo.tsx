/**
 * CoinInfo Component - Links and description section
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinInfoProps {
  coin: {
    name: string;
    symbol: string;
    description?: { en?: string };
    links?: {
      homepage?: string[];
      blockchain_site?: string[];
      official_forum_url?: string[];
      chat_url?: string[];
      announcement_url?: string[];
      twitter_screen_name?: string;
      facebook_username?: string;
      telegram_channel_identifier?: string;
      subreddit_url?: string;
      repos_url?: {
        github?: string[];
        bitbucket?: string[];
      };
    };
    genesis_date?: string;
    hashing_algorithm?: string;
    block_time_in_minutes?: number;
  };
}

interface LinkItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}

function LinkItem({ href, icon, label, external = true }: LinkItemProps) {
  if (!href) return null;
  
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 hover:bg-gray-700/50 rounded-lg text-gray-300 hover:text-white text-sm transition-colors"
    >
      {icon}
      <span>{label}</span>
      {external && (
        <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      )}
    </a>
  );
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function CoinInfo({ coin }: CoinInfoProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const description = coin.description?.en || '';
  const cleanDescription = description.replace(/<[^>]*>/g, ''); // Strip HTML
  const shortDescription = cleanDescription.slice(0, 300);
  const hasMore = cleanDescription.length > 300;

  const links = coin.links || {};
  const homepage = links.homepage?.filter(Boolean)[0];
  const explorer = links.blockchain_site?.filter(Boolean)[0];
  const whitepaper = links.announcement_url?.filter(Boolean)[0];
  const github = links.repos_url?.github?.filter(Boolean)[0];
  const twitter = links.twitter_screen_name;
  const reddit = links.subreddit_url;
  const telegram = links.telegram_channel_identifier;
  const forum = links.official_forum_url?.filter(Boolean)[0];
  const discord = links.chat_url?.find((url: string) => url?.includes('discord'));

  return (
    <div className="space-y-6">
      {/* Info & Links */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Info & Links</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {homepage && (
            <LinkItem
              href={homepage}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              }
              label={getHostname(homepage)}
            />
          )}
          
          {explorer && (
            <LinkItem
              href={explorer}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              }
              label="Explorer"
            />
          )}

          {github && (
            <LinkItem
              href={github}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              }
              label="Source Code"
            />
          )}

          {whitepaper && (
            <LinkItem
              href={whitepaper}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              label="Whitepaper"
            />
          )}

          {twitter && (
            <LinkItem
              href={`https://twitter.com/${twitter}`}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              }
              label={`@${twitter}`}
            />
          )}

          {reddit && (
            <LinkItem
              href={reddit}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm6.67-10a1.46 1.46 0 00-2.47-1 7.12 7.12 0 00-3.85-1.23l.65-3.07 2.12.44a1 1 0 101.81-.45l-2.83-.6a.69.69 0 00-.82.55l-.73 3.43a7.14 7.14 0 00-3.89 1.23 1.46 1.46 0 10-1.61 2.39 2.87 2.87 0 000 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 000-.44 1.46 1.46 0 00.9-1.37zM9.17 13.72a1 1 0 111-1 1 1 0 01-1 1zm5.66 2.55a3.75 3.75 0 01-2.83.88 3.75 3.75 0 01-2.83-.88.36.36 0 01.52-.52 3 3 0 002.31.66 3 3 0 002.31-.66.36.36 0 01.52.52zm-.16-1.55a1 1 0 111-1 1 1 0 01-1 1z" />
                </svg>
              }
              label="Reddit"
            />
          )}

          {telegram && (
            <LinkItem
              href={`https://t.me/${telegram}`}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 1 0 24 12 12.013 12.013 0 0 0 11.944 0Zm5.59 8.47-1.72 8.09c-.13.58-.47.72-.96.45l-2.65-1.95-1.28 1.23a.67.67 0 0 1-.53.26l.19-2.7 4.94-4.46c.22-.19-.05-.3-.34-.11l-6.11 3.85-2.63-.82c-.57-.18-.58-.57.12-.85l10.29-3.97c.48-.17.9.12.74.85v-.01Z" />
                </svg>
              }
              label="Telegram"
            />
          )}

          {discord && (
            <LinkItem
              href={discord}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              }
              label="Discord"
            />
          )}

          {forum && (
            <LinkItem
              href={forum}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              }
              label="Forum"
            />
          )}
        </div>

        {/* Technical Info */}
        {(coin.genesis_date || coin.hashing_algorithm || coin.block_time_in_minutes) && (
          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {coin.genesis_date && (
                <div>
                  <span className="text-xs text-gray-500">Genesis Date</span>
                  <p className="text-sm text-gray-300">
                    {new Date(coin.genesis_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {coin.hashing_algorithm && (
                <div>
                  <span className="text-xs text-gray-500">Algorithm</span>
                  <p className="text-sm text-gray-300">{coin.hashing_algorithm}</p>
                </div>
              )}
              {coin.block_time_in_minutes && (
                <div>
                  <span className="text-xs text-gray-500">Block Time</span>
                  <p className="text-sm text-gray-300">{coin.block_time_in_minutes} min</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* About */}
      {cleanDescription && (
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">About {coin.name}</h3>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={showFullDescription ? 'full' : 'short'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-400 text-sm leading-relaxed"
            >
              {showFullDescription ? cleanDescription : shortDescription}
              {hasMore && !showFullDescription && '...'}
            </motion.div>
          </AnimatePresence>

          {hasMore && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="mt-3 text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors"
            >
              {showFullDescription ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
