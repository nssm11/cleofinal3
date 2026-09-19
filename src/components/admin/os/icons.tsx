import type { ReactElement, ReactNode, SVGProps } from "react";
import * as FE from "@/components/icons";

/* ══════════════════════════════════════════════════════════════════════════
   L'INSTRUMENT — la famille d'icônes de la maison
   ──────────────────────────────────────────────────────────────────────────
   One family only, the same family the shop wears: twenty-four-point grid,
   a single 1.5 stroke, rounded ends. Where the maison already draws the
   mark (search, bag, star, clock, filter…), the instrument borrows it — the
   back office must read as the same house, not a template. The marks the
   maison does not yet carry are drawn here in the same hand, so a screen
   never mixes two alphabets.
   ══════════════════════════════════════════════════════════════════════════ */

export type GlyphProps = SVGProps<SVGSVGElement> & { size?: number; title?: string; strokeWidth?: number };

function G({ size = 18, title, children, strokeWidth = 1.5, ...rest }: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={title ? undefined : true} role={title ? "img" : undefined} focusable="false" {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* ── La main de la maison — marks borrowed from the storefront ──────────── */

type FeIcon = (p: FE.IconProps) => React.ReactElement;

/** Adopt a maison icon as an instrument glyph (the grid and stroke already match). */
const from = (C: FeIcon) => {
  const W = (p: GlyphProps) => <C {...p} size={p.size ?? 18} />;
  return W;
};

export const SearchIcon = from(FE.SearchIcon);
export const CloseIcon = from(FE.CloseIcon);
export const MenuIcon = from(FE.MenuIcon);
export const ChevronRightIcon = from(FE.ChevronRightIcon);
export const ChevronDownIcon = from(FE.ChevronDownIcon);
export const PlusIcon = from(FE.PlusIcon);
export const MinusIcon = from(FE.MinusIcon);
export const CheckIcon = from(FE.CheckIcon);
export const InfoIcon = from(FE.InfoIcon);
export const AlertIcon = from(FE.WarningIcon);
export const RefreshIcon = from(FE.RefreshIcon);
export const TrashIcon = from(FE.TrashIcon);
export const ExternalIcon = from(FE.ExternalIcon);
export const LockIcon = from(FE.LockIcon);
export const UsersIcon = from(FE.UsersIcon);
export const BagIcon = from(FE.BagIcon);
export const TagIcon = from(FE.TagIcon);
export const StarIcon = from(FE.StarIcon);
export const BookOpenIcon = from(FE.BookIcon);
export const ClockIcon = from(FE.ClockIcon);
export const FilterLinesIcon = from(FE.FilterIcon);
export const DownloadSmallIcon = from(FE.DownloadIcon);
export const SparkIcon2 = from(FE.SparkIcon);
export const ArrowRightIcon = from(FE.ArrowRightIcon);
export const ArrowUpRightIcon = from(FE.ArrowUpRightIcon);
export const LinkIcon = from(FE.LinkIcon);
export const CubeIcon = from(FE.PackageIcon);
export const LayersIcon = from(FE.BoxesIcon);
export const NoteIcon = from(FE.MessageIcon);
export const StoreIcon = from(FE.StoreIcon);

/* ── The instrument's own marks — drawn in the maison's hand ────────────── */

/** The command dial: the maison at a glance. */
export const CommandIcon = (p: GlyphProps) => (
  <G {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5v2.4M12 18.1v2.4M3.5 12h2.4M18.1 12h2.4" />
    <circle cx="12" cy="12" r="1.6" />
  </G>
);

export const BellIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M12 4a5.5 5.5 0 0 1 5.5 5.5c0 3.2.8 4.6 1.7 5.7H4.8c.9-1.1 1.7-2.5 1.7-5.7A5.5 5.5 0 0 1 12 4z" />
    <path d="M10 18.5a2 2 0 0 0 4 0" />
  </G>
);

export const GaugeIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M4 17.5a8 8 0 1 1 16 0" />
    <path d="m12 17.5 3.8-4.6" />
    <circle cx="12" cy="17.5" r="1.4" />
  </G>
);

export const FlowIcon = (p: GlyphProps) => (
  <G {...p}>
    <circle cx="6" cy="6" r="2.4" />
    <circle cx="18" cy="18" r="2.4" />
    <rect x="9.2" y="9.2" width="5.6" height="5.6" rx="1" />
    <path d="m8.3 8.3 1.2 1.2M14.5 14.5l1.2 1.2" />
  </G>
);

export const CompassIcon = (p: GlyphProps) => (
  <G {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15 9-2 5-4 1 2-5z" />
  </G>
);

export const FlameIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M12 3.5s5 4 5 8.5a5 5 0 0 1-10 0c0-2 1-3.2 1-3.2s1 1.4 2.5 1.4c0 0-1-4.2 1.5-6.7z" />
  </G>
);

export const PinIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M12 3.5v7.5" />
    <path d="M8.5 11h7l1.2 3.2H7.3z" />
    <path d="M12 14.2v6" />
  </G>
);

export const FocusIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M20 9V5.5A1.5 1.5 0 0 0 18.5 4H15M4 15v3.5A1.5 1.5 0 0 0 5.5 20H9M20 15v3.5A1.5 1.5 0 0 1 18.5 20H15" />
  </G>
);

export const DensityIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M5 7h14M5 12h10M5 17h7" />
  </G>
);

export const ArrowDownRightIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="m7 7 10 10M17 9v8H9" />
  </G>
);

export const DeltaIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M12 5.5 18.5 16.5h-13z" />
  </G>
);

export const SigmaIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M17 5.5H7.5L12 12l-4.5 6.5H17" />
  </G>
);

export const LedgerIcon = (p: GlyphProps) => (
  <G {...p}>
    <rect x="4" y="4" width="16" height="16" rx="1.5" />
    <path d="M4 9h16M9 9v11M13.5 13H17M13.5 16.5H17" />
  </G>
);

export const RouteIcon = (p: GlyphProps) => (
  <G {...p}>
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="6" r="2" />
    <path d="M8 18h4.5a4 4 0 0 0 0-8H8.5a4 4 0 0 1 0-8H16" />
  </G>
);

export const BeakerIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M8.5 3.5h7M10 3.5v5.5L5.8 16.8a2.4 2.4 0 0 0 2.2 3.4h8a2.4 2.4 0 0 0 2.2-3.4L14 9V3.5" />
    <path d="M7.5 14h9" />
  </G>
);

export const StampIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M5.5 19.5h13" />
    <path d="M7.5 16.5h9v-1.4a3 3 0 0 0-1.9-2.7l-.6-.2c-.7-.3-1-.9-1-1.6v-1.1a1.9 1.9 0 0 0-3.8 0v1.1c0 .7-.3 1.3-1 1.6l-.6.2a3 3 0 0 0-1.9 2.7z" />
  </G>
);

export const ClapperIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M4.5 9.5h15V19h-15z" />
    <path d="m4.5 9.5 1.8-3.7h4.6l-1.8 3.7M10.9 9.5l1.8-3.7h4.6l-1.8 3.7" />
  </G>
);

export const ScaleIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M12 4.5v15M7.5 19.5h9M5.5 7.5h13" />
    <path d="m8 7.5-2.4 5a2.4 2.4 0 0 0 4.8 0zM16 7.5l-2.4 5a2.4 2.4 0 0 0 4.8 0z" />
  </G>
);

export const PlugIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M9 3.5v5M15 3.5v5" />
    <path d="M6.5 8.5h11v2.7a5.5 5.5 0 0 1-11 0z" />
    <path d="M12 16.7v3.8" />
  </G>
);

export const ServerIcon = (p: GlyphProps) => (
  <G {...p}>
    <rect x="3.5" y="4" width="17" height="6.2" rx="1.5" />
    <rect x="3.5" y="13.8" width="17" height="6.2" rx="1.5" />
    <path d="M7 7.1h.01M7 16.9h.01" />
  </G>
);

export const SkullIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M12 3.5a7.3 7.3 0 0 0-7.3 7.3c0 1.9.7 3.3 1.7 4.3v2.4A1.5 1.5 0 0 0 7.9 19h8.2a1.5 1.5 0 0 0 1.5-1.5v-2.4c1-1 1.7-2.4 1.7-4.3A7.3 7.3 0 0 0 12 3.5z" />
    <circle cx="9.4" cy="11.4" r="1.3" />
    <circle cx="14.6" cy="11.4" r="1.3" />
  </G>
);

export const ClockArrowIcon = (p: GlyphProps) => (
  <G {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </G>
);

export const ColumnsIcon = (p: GlyphProps) => (
  <G {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M9.5 4.5v15M15 4.5v15" />
  </G>
);

export const UploadIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M12 15.5V5M8 8.5l4-4 4 4" />
    <path d="M5 19.5h14" />
  </G>
);

export const UndoIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M9 8 5 12l4 4" />
    <path d="M5 12h9a5 5 0 0 1 0 10H11" />
  </G>
);

export const EyeIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.6" />
  </G>
);

export const PercentIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="m6 18 12-12" />
    <circle cx="7.5" cy="7.5" r="2" />
    <circle cx="16.5" cy="16.5" r="2" />
  </G>
);

export const TicketIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v1a2.5 2.5 0 0 0 0 5v1a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 15.5v-1a2.5 2.5 0 0 0 0-5z" />
    <path d="M12 9v6" />
  </G>
);

export const SearchSparkIcon = (p: GlyphProps) => (
  <G {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
    <path d="M11 8.5v5M8.5 11h5" />
  </G>
);

/** A bag being added to — a live basket. */
export const CartPulseIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M5.5 8.5h13L17.5 19h-11z" />
    <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    <path d="M14.3 13.2h3.4M16 11.5v3.4" />
  </G>
);

/** The live pulse — a heartbeat across the wire. */
export const ActivityIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M3.5 12.5h3.2l1.9-4.3 3 8.6 2.4-5.8 1.4 1.5h5.1" />
  </G>
);

export const ChevronLeftIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="m15 6-6 6 6 6" />
  </G>
);

export const ExpandIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M20 9V5.5A1.5 1.5 0 0 0 18.5 4H15M4 15v3.5A1.5 1.5 0 0 0 5.5 20H9M20 15v3.5A1.5 1.5 0 0 1 18.5 20H15" />
    <path d="M9.5 14.5 5 19M14.5 9.5 19 5" />
  </G>
);

export const CollapseIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M20 9V5.5A1.5 1.5 0 0 0 18.5 4H15M4 15v3.5A1.5 1.5 0 0 0 5.5 20H9M20 15v3.5A1.5 1.5 0 0 1 18.5 20H15" />
    <path d="m5 5 4.5 4.5M19 5l-4.5 4.5M5 19l4.5-4.5M19 19l-4.5-4.5" />
  </G>
);

export const PlayIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M7.5 5 18.5 12l-11 7z" />
  </G>
);

export const PauseIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M9 5.5v13M15 5.5v13" />
  </G>
);

export const EditIcon = (p: GlyphProps) => (
  <G {...p}>
    <path d="M4 19.5h4.2L19.5 8.2 15.8 4.5 4 16.3z" />
    <path d="m13.8 6.5 3.7 3.7" />
  </G>
);

export const CalendarIcon = (p: GlyphProps) => (
  <G {...p}>
    <rect x="4" y="5.5" width="16" height="15" rx="1.5" />
    <path d="M4 10h16M9 3.5v4M15 3.5v4" />
  </G>
);

export const MailIcon = (p: GlyphProps) => (
  <G {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
    <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
  </G>
);

export const CopyIcon = (p: GlyphProps) => (
  <G {...p}>
    <rect x="9" y="9" width="11" height="11" rx="1.5" />
    <path d="M5.5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v1" />
  </G>
);

export const GridIcon = (p: GlyphProps) => (
  <G {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1" />
    <rect x="13" y="4" width="7" height="7" rx="1" />
    <rect x="4" y="13" width="7" height="7" rx="1" />
    <rect x="13" y="13" width="7" height="7" rx="1" />
  </G>
);

export const ImageIcon = (p: GlyphProps) => (
  <G {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m5.5 17.5 4-4 3 3 2.5-2.5 3.5 3" />
  </G>
);

/** The maison's mark — a lozenge of light. */
export const LogoMark = ({ size = 22, ...rest }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" {...rest}>
    <path d="M12 1.5 22 12 12 22.5 2 12z" stroke="currentColor" strokeWidth="1.1" />
    <path d="M12 6.8 17.2 12 12 17.2 6.8 12z" fill="currentColor" opacity="0.9" />
  </svg>
);

/* ── Index ─────────────────────────────────────────────────────────────── */

export const ICONS = {
  command: CommandIcon,
  bell: BellIcon,
  gauge: GaugeIcon,
  layers: LayersIcon,
  flow: FlowIcon,
  compass: CompassIcon,
  flame: FlameIcon,
  pin: PinIcon,
  focus: FocusIcon,
  density: DensityIcon,
  upRight: ArrowUpRightIcon,
  downRight: ArrowDownRightIcon,
  delta: DeltaIcon,
  sigma: SigmaIcon,
  ledger: LedgerIcon,
  route: RouteIcon,
  beaker: BeakerIcon,
  stamp: StampIcon,
  book: BookOpenIcon,
  clapper: ClapperIcon,
  note: NoteIcon,
  scale: ScaleIcon,
  plug: PlugIcon,
  server: ServerIcon,
  skull: SkullIcon,
  spark: SparkIcon2,
  clock: ClockIcon,
  clockArrow: ClockArrowIcon,
  filter: FilterLinesIcon,
  columns: ColumnsIcon,
  download: DownloadSmallIcon,
  upload: UploadIcon,
  undo: UndoIcon,
  eye: EyeIcon,
  cube: CubeIcon,
  percent: PercentIcon,
  ticket: TicketIcon,
  searchSpark: SearchSparkIcon,
  pulse: ActivityIcon,
  search: SearchIcon,
  close: CloseIcon,
  expand: ExpandIcon,
  collapse: CollapseIcon,
  chevronRight: ChevronRightIcon,
  chevronLeft: ChevronLeftIcon,
  chevronDown: ChevronDownIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  check: CheckIcon,
  alert: AlertIcon,
  info: InfoIcon,
  play: PlayIcon,
  pause: PauseIcon,
  refresh: RefreshIcon,
  trash: TrashIcon,
  edit: EditIcon,
  external: ExternalIcon,
  calendar: CalendarIcon,
  arrowRight: ArrowRightIcon,
  mail: MailIcon,
  users: UsersIcon,
  bag: BagIcon,
  tag: TagIcon,
  star: StarIcon,
  copy: CopyIcon,
  link: LinkIcon,
  grid: GridIcon,
  image: ImageIcon,
  lock: LockIcon,
  store: StoreIcon,
  logout: FE.LogoutIcon,
} as const;

export type IconKey = keyof typeof ICONS;

export function Glyph({ name, ...rest }: { name: IconKey } & GlyphProps) {
  const C = ICONS[name];
  return <C {...rest} />;
}
