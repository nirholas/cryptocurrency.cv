/**
 * Category Navigation
 * Navigation bar for different news categories
 */

'use client';

import Link from 'next/link';

interface CategoryNavProps {
  activeCategory?: string;
}

const categories = [
  { slug: '', label: 'All News', icon: '📰' },
  { slug: 'bitcoin', label: 'Bitcoin', icon: '₿' },
  { slug: 'ethereum', label: 'Ethereum', icon: 'Ξ' },
  { slug: 'defi', label: 'DeFi', icon: '🏦' },
  { slug: 'nft', label: 'NFTs', icon: '🎨' },
  { slug: 'regulation', label: 'Regulation', icon: '⚖️' },
  { slug: 'markets', label: 'Markets', icon: '📈' },
];

export default function CategoryNav({ activeCategory = '' }: CategoryNavProps) {
  return (
    <nav className="border-b bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const href = cat.slug ? `/category/${cat.slug}` : '/';
            
            return (
              <Link
                key={cat.slug}
                href={href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition
                  ${isActive 
                    ? 'bg-black text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
