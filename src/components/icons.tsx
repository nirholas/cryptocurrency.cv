/**
 * @fileoverview Professional Icon Components
 * 
 * Centralized icon components using Lucide React for a consistent,
 * professional look throughout the application.
 * 
 * @module components/icons
 */

import {
  Home,
  TrendingUp,
  TrendingDown,
  Landmark,
  Flame,
  Rocket,
  Search,
  Newspaper,
  Star,
  Bell,
  BellRing,
  BarChart3,
  BarChart2,
  PieChart,
  Scale,
  Coins,
  Bot,
  Lock,
  Globe,
  Image,
  Gamepad2,
  Link2,
  Package,
  Dog,
  ArrowLeftRight,
  DollarSign,
  HardDrive,
  Eye,
  Lightbulb,
  Code,
  Info,
  Tag,
  Folder,
  Briefcase,
  Bookmark,
  FileText,
  Zap,
  Settings,
  MapPin,
  Moon,
  Share2,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Brain,
  Fish,
  Sparkles,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

// Icon size presets
export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
  '3xl': 'w-12 h-12',
} as const;

export type IconSize = keyof typeof ICON_SIZES;

interface IconProps {
  className?: string;
  size?: IconSize;
}

// Helper to create icon components with consistent styling
function createIcon(Icon: LucideIcon) {
  return function IconComponent({ className = '', size = 'md' }: IconProps) {
    return <Icon className={`${ICON_SIZES[size]} ${className}`} />;
  };
}

// Navigation Icons
export const HomeIcon = createIcon(Home);
export const MarketsIcon = createIcon(TrendingUp);
export const DeFiIcon = createIcon(Landmark);
export const TrendingIcon = createIcon(Flame);
export const MoversIcon = createIcon(Rocket);
export const SearchIcon = createIcon(Search);
export const NewsIcon = createIcon(Newspaper);
export const TopicsIcon = createIcon(Tag);
export const SourcesIcon = createIcon(Folder);
export const AboutIcon = createIcon(Info);
export const CodeExamplesIcon = createIcon(Code);
export const GlobeIcon = createIcon(Globe);

// Category Icons
export const BitcoinIcon = ({ className = '', size = 'md' }: IconProps) => (
  <span className={`${ICON_SIZES[size]} inline-flex items-center justify-center font-bold ${className}`}>₿</span>
);

export const EthereumIcon = ({ className = '', size = 'md' }: IconProps) => (
  <span className={`${ICON_SIZES[size]} inline-flex items-center justify-center font-bold ${className}`}>Ξ</span>
);

export const NFTIcon = createIcon(Image);
export const GamingIcon = createIcon(Gamepad2);
export const Layer1Icon = createIcon(Link2);
export const Layer2Icon = createIcon(Package);
export const MemeIcon = createIcon(Dog);
export const AIIcon = createIcon(Bot);
export const ExchangeIcon = createIcon(ArrowLeftRight);
export const StablecoinIcon = createIcon(DollarSign);
export const PrivacyIcon = createIcon(Lock);
export const StorageIcon = createIcon(HardDrive);
export const OracleIcon = createIcon(Eye);
export const AltcoinsIcon = createIcon(Coins);
export const RegulationIcon = createIcon(Scale);
export const TechnologyIcon = createIcon(Settings);

// Action Icons
export const StarIcon = createIcon(Star);
export const BellIcon = createIcon(Bell);
export const BellRingIcon = createIcon(BellRing);
export const ChartIcon = createIcon(BarChart3);
export const BarChartIcon = createIcon(BarChart2);
export const PieChartIcon = createIcon(PieChart);
export const LightbulbIcon = createIcon(Lightbulb);
export const BookmarkIcon = createIcon(Bookmark);
export const PortfolioIcon = createIcon(Briefcase);
export const DocumentIcon = createIcon(FileText);
export const ZapIcon = createIcon(Zap);
export const SettingsIcon = createIcon(Settings);
export const NavigationIcon = createIcon(MapPin);
export const ThemeIcon = createIcon(Moon);
export const ShareIcon = createIcon(Share2);
export const DocsIcon = createIcon(BookOpen);
export const RocketIcon = createIcon(Rocket);

// Market Indicators
export const BullishIcon = createIcon(TrendingUp);
export const BearishIcon = createIcon(TrendingDown);
export const UpIcon = createIcon(ChevronUp);
export const DownIcon = createIcon(ChevronDown);

// Premium/X402 Icons
export const BrainIcon = createIcon(Brain);
export const WhaleIcon = createIcon(Fish);
export const ScreenerIcon = createIcon(Search);
export const DataIcon = createIcon(BarChart3);
export const RealtimeIcon = createIcon(Zap);
export const AlertsIcon = createIcon(Bell);
export const PassIcon = createIcon(Ticket);

// Icon Map for dynamic usage
export const ICON_MAP: Record<string, ComponentType<IconProps>> = {
  // Navigation
  home: HomeIcon,
  markets: MarketsIcon,
  defi: DeFiIcon,
  trending: TrendingIcon,
  movers: MoversIcon,
  search: SearchIcon,
  news: NewsIcon,
  topics: TopicsIcon,
  sources: SourcesIcon,
  about: AboutIcon,
  examples: CodeExamplesIcon,
  
  // Categories
  bitcoin: BitcoinIcon,
  ethereum: EthereumIcon,
  nft: NFTIcon,
  gaming: GamingIcon,
  'layer-1': Layer1Icon,
  'layer-2': Layer2Icon,
  meme: MemeIcon,
  ai: AIIcon,
  exchange: ExchangeIcon,
  stablecoin: StablecoinIcon,
  privacy: PrivacyIcon,
  storage: StorageIcon,
  oracle: OracleIcon,
  altcoins: AltcoinsIcon,
  regulation: RegulationIcon,
  technology: TechnologyIcon,
  
  // Actions
  star: StarIcon,
  bell: BellIcon,
  chart: ChartIcon,
  lightbulb: LightbulbIcon,
  bookmark: BookmarkIcon,
  portfolio: PortfolioIcon,
  zap: ZapIcon,
  settings: SettingsIcon,
  theme: ThemeIcon,
  share: ShareIcon,
  docs: DocsIcon,
  rocket: RocketIcon,
  globe: GlobeIcon,
  
  // Market
  bullish: BullishIcon,
  bearish: BearishIcon,
  
  // Premium
  brain: BrainIcon,
  whale: WhaleIcon,
  screener: ScreenerIcon,
  data: DataIcon,
  realtime: RealtimeIcon,
  alerts: AlertsIcon,
  pass: PassIcon,
};

// Get icon by key (useful for dynamic lookups)
export function getIcon(key: string): ComponentType<IconProps> | null {
  return ICON_MAP[key.toLowerCase()] || null;
}

// Render icon by key with fallback
export function renderIcon(key: string, props: IconProps = {}): React.ReactNode {
  const IconComponent = getIcon(key);
  if (IconComponent) {
    return <IconComponent {...props} />;
  }
  return null;
}
