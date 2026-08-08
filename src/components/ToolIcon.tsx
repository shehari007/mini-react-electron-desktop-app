import {
  Binary,
  BookOpen,
  Braces,
  Brain,
  Cake,
  Calculator,
  CalendarClock,
  CalendarDays,
  CloudSun,
  Coins,
  Droplets,
  FileCode,
  Fingerprint,
  Flame,
  GitCompare,
  Globe,
  Hash,
  Image as ImageIcon,
  KeyRound,
  Landmark,
  Link as LinkIcon,
  ListChecks,
  NotebookPen,
  Palette,
  Percent,
  Pilcrow,
  QrCode,
  Receipt,
  Regex,
  Ruler,
  Scale,
  ShieldCheck,
  Table,
  Timer,
  TrendingUp,
  Type,
  type LucideIcon,
} from 'lucide-react';

import type { IconName } from '@/lib/tools';
import { cn } from '@/lib/utils';

/**
 * Resolves the registry's icon *names* to components.
 *
 * The registry stays free of JSX so server code (sitemap, metadata) can import
 * it. This map is the one place that pays the cost of naming all 36 icons —
 * which is cheap, since `optimizePackageImports` in next.config rewrites these
 * to per-icon modules and each is well under a kilobyte.
 */
const ICONS: Record<IconName, LucideIcon> = {
  calculator: Calculator,
  percent: Percent,
  receipt: Receipt,
  ruler: Ruler,
  coins: Coins,
  binary: Binary,
  timer: Timer,
  globe: Globe,
  brain: Brain,
  'calendar-days': CalendarDays,
  cake: Cake,
  braces: Braces,
  'file-code': FileCode,
  'key-round': KeyRound,
  link: LinkIcon,
  fingerprint: Fingerprint,
  hash: Hash,
  regex: Regex,
  'git-compare': GitCompare,
  table: Table,
  'calendar-clock': CalendarClock,
  type: Type,
  'book-open': BookOpen,
  pilcrow: Pilcrow,
  'list-checks': ListChecks,
  'notebook-pen': NotebookPen,
  'shield-check': ShieldCheck,
  'qr-code': QrCode,
  palette: Palette,
  image: ImageIcon,
  landmark: Landmark,
  'trending-up': TrendingUp,
  scale: Scale,
  flame: Flame,
  droplets: Droplets,
  'cloud-sun': CloudSun,
};

export interface ToolIconProps {
  name: IconName;
  className?: string;
}

export function ToolIcon({ name, className }: ToolIconProps) {
  const Icon = ICONS[name];
  return <Icon className={cn('size-[18px]', className)} aria-hidden="true" strokeWidth={1.9} />;
}

/** The icon inside its accent-tinted rounded tile — the recurring visual motif
 *  across the sidebar, home grid, palette and page headers. */
export function ToolIconTile({
  name,
  size = 'md',
  className,
}: ToolIconProps & { size?: 'sm' | 'md' | 'lg' }) {
  const tile = {
    sm: 'size-8 rounded-lg [&_svg]:size-4',
    md: 'size-11 rounded-xl [&_svg]:size-[20px]',
    lg: 'size-14 rounded-2xl [&_svg]:size-6',
  }[size];

  return (
    <span
      className={cn('grid shrink-0 place-items-center bg-accent-soft text-accent-text', tile, className)}
    >
      <ToolIcon name={name} className="size-auto" />
    </span>
  );
}
