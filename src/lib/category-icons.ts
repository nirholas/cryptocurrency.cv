/**
 * @fileoverview Category Icons Configuration
 *
 * Maps category slugs to their corresponding Lucide icons
 * for consistent icon usage across the application.
 *
 * @module lib/category-icons
 */

import {
  TrendingUp,
  Landmark,
  Image,
  Gamepad2,
  Link2,
  Package,
  Dog,
  Bot,
  ArrowLeftRight,
  DollarSign,
  Lock,
  HardDrive,
  Eye,
  Coins,
  Scale,
  Settings,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icon mapping for cryptocurrency categories
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Cryptocurrencies
  bitcoin: TrendingUp,
  ethereum: TrendingUp,

  // Categories
  defi: Landmark,
  nft: Image,
  gaming: Gamepad2,
  'layer-1': Link2,
  'layer-2': Package,
  meme: Dog,
  ai: Bot,
  exchange: ArrowLeftRight,
  stablecoin: DollarSign,
  privacy: Lock,
  storage: HardDrive,
  oracle: Eye,
  altcoins: Coins,
  regulation: Scale,
  trading: TrendingUp,
  technology: Settings,
  all: TrendingUp,
};

/**
 * Get the icon component for a category
 * @param slug - Category slug
 * @returns Lucide icon component or default
 */
export function getCategoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug.toLowerCase()] || TrendingUp;
}
