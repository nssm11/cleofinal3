import type { SVGProps } from "react";

export type GlyphProps = SVGProps<SVGSVGElement> & { size?: number; title?: string; strokeWidth?: number };

function G({ size = 18, title, children, strokeWidth = 1.5, ...rest }: GlyphProps & { children: React.ReactNode }) {
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

export const CommandIcon = (p: GlyphProps) => (<G {...p}><path d="M9 6a2.5 2.5 0 1 0-2.5 2.5H9zM15 6a2.5 2.5 0 1 1 2.5 2.5H15zM9 18a2.5 2.5 0 1 1-2.5-2.5H9zM15 18a2.5 2.5 0 1 0 2.5-2.5H15z" /><rect x="9" y="8.5" width="6" height="7" rx="1" /></G>);
export const BellIcon = (p: GlyphProps) => (<G {...p}><path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9z" /><path d="M10 18a2 2 0 0 0 4 0" /></G>);
export const GaugeIcon = (p: GlyphProps) => (<G {...p}><path d="M3.5 18a9 9 0 1 1 17 0" /><path d="M12 13.5 15.5 9" /><circle cx="12" cy="15" r="1.4" /></G>);
export const LayersIcon = (p: GlyphProps) => (<G {...p}><path d="M12 3 3 8l9 5 9-5-9-5z" /><path d="m3 13 9 5 9-5" /></G>);
export const FlowIcon = (p: GlyphProps) => (<G {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><rect x="9" y="9.5" width="6" height="5" rx="1" /><path d="M8.5 8.5 10 10M15.5 13.5 17 15" /></G>);
export const CompassIcon = (p: GlyphProps) => (<G {...p}><circle cx="12" cy="12" r="9" /><path d="m15 9-2 5-4 1 2-5z" /></G>);
export const FlameIcon = (p: GlyphProps) => (<G {...p}><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s1 1.5 2.5 1.5S11 6 12 3z" /></G>);
export const PinIcon = (p: GlyphProps) => (<G {...p}><path d="M12 3v8" /><path d="M8 11h8l1 3H7z" /><path d="M12 14v7" /></G>);
export const FocusIcon = (p: GlyphProps) => (<G {...p}><path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M20 9V5.5A1.5 1.5 0 0 0 18.5 4H15M4 15v3.5A1.5 1.5 0 0 0 5.5 20H9M20 15v3.5A1.5 1.5 0 0 1 18.5 20H15" /></G>);
export const DensityIcon = (p: GlyphProps) => (<G {...p}><path d="M4 6h16M4 11h16M4 16h16M4 20h16" /></G>);
export const ArrowUpRightIcon = (p: GlyphProps) => (<G {...p}><path d="M7 17 17 7M9 7h8v8" /></G>);
export const ArrowDownRightIcon = (p: GlyphProps) => (<G {...p}><path d="M7 7l10 10M17 9v8H9" /></G>);
export const DeltaIcon = (p: GlyphProps) => (<G {...p}><path d="M5 8h14l-7 8-7-8z" /></G>);
export const SigmaIcon = (p: GlyphProps) => (<G {...p}><path d="M17 5H7l5 7-5 7h10" /></G>);
export const LedgerIcon = (p: GlyphProps) => (<G {...p}><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M4 9h16M9 9v11M13.5 13h3.5M13.5 16.5h3.5" /></G>);
export const RouteIcon = (p: GlyphProps) => (<G {...p}><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h5a4 4 0 0 0 0-8H8a4 4 0 0 1 0-8h3" /></G>);
export const BeakerIcon = (p: GlyphProps) => (<G {...p}><path d="M8 3h8M10 3v6L5.5 17A2.5 2.5 0 0 0 7.8 20.5h8.4A2.5 2.5 0 0 0 18.5 17L14 9V3" /><path d="M7.5 14h9" /></G>);
export const StampIcon = (p: GlyphProps) => (<G {...p}><path d="M5 20h14" /><path d="M7 17h10v-1.5a3 3 0 0 0-2-2.8l-.6-.2c-.7-.3-1-1-1-1.8v-1.2a2 2 0 1 0-4 0v1.2c0 .8-.3 1.5-1 1.8l-.6.2a3 3 0 0 0-2 2.8z" /></G>);
export const BookOpenIcon = (p: GlyphProps) => (<G {...p}><path d="M12 6.5S10 4.5 6 4.5H4v13h2c4 0 6 2 6 2s2-2 6-2h2v-13h-2c-4 0-6 2-6 2z" /><path d="M12 6.5v13" /></G>);
export const ClapperIcon = (p: GlyphProps) => (<G {...p}><path d="M4 9h16v10.5H4z" /><path d="m4 9 2-4h5l-2 4M11 9l2-4h5l-2 4" /></G>);
export const NoteIcon = (p: GlyphProps) => (<G {...p}><path d="M6 3.5h9L19 8v12.5H6z" /><path d="M14.5 3.5V8H19" /><path d="M9 12h7M9 15.5h5" /></G>);
export const ScaleIcon = (p: GlyphProps) => (<G {...p}><path d="M12 4v16M7 20h10M5 8h14M8 8l-2.5 5a2.5 2.5 0 0 0 5 0zM16 8l-2.5 5a2.5 2.5 0 0 0 5 0z" /></G>);
export const PlugIcon = (p: GlyphProps) => (<G {...p}><path d="M9 3v6M15 3v6" /><path d="M6 9h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6z" /><path d="M12 18v3" /></G>);
export const ServerIcon = (p: GlyphProps) => (<G {...p}><rect x="3.5" y="4" width="17" height="6" rx="1.5" /><rect x="3.5" y="14" width="17" height="6" rx="1.5" /><path d="M7 7h.01M7 17h.01" /></G>);
export const SkullIcon = (p: GlyphProps) => (<G {...p}><path d="M12 3a7 7 0 0 0-7 7v3l1.5 2V19h3l1-1.5h3l1 1.5h3v-4L19 13v-3a7 7 0 0 0-7-7z" /><circle cx="9.5" cy="11" r="1.2" /><circle cx="14.5" cy="11" r="1.2" /></G>);
export const SparkIcon2 = (p: GlyphProps) => (<G {...p}><path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9z" /><path d="M18 16.5l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z" /></G>);
export const ClockArrowIcon = (p: GlyphProps) => (<G {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></G>);
export const FilterLinesIcon = (p: GlyphProps) => (<G {...p}><path d="M3 6h18M6 12h12M9 18h6" /></G>);
export const ColumnsIcon = (p: GlyphProps) => (<G {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><path d="M9.5 4.5v15M15 4.5v15" /></G>);
export const DownloadSmallIcon = (p: GlyphProps) => (<G {...p}><path d="M12 4v10M8 10.5l4 4 4-4" /><path d="M5 19h14" /></G>);
export const UploadIcon = (p: GlyphProps) => (<G {...p}><path d="M12 16V5M8 9l4-4 4 4" /><path d="M5 19h14" /></G>);
export const UndoIcon = (p: GlyphProps) => (<G {...p}><path d="M9 8 5 12l4 4" /><path d="M5 12h9a5 5 0 0 1 0 10h-3" /></G>);
export const EyeIcon = (p: GlyphProps) => (<G {...p}><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.6" /></G>);
export const CubeIcon = (p: GlyphProps) => (<G {...p}><path d="M12 3 4 7v10l8 4 8-4V7z" /><path d="M4 7l8 4 8-4M12 11v10" /></G>);
export const PercentIcon = (p: GlyphProps) => (<G {...p}><path d="m6 18 12-12" /><circle cx="7.5" cy="7.5" r="2" /><circle cx="16.5" cy="16.5" r="2" /></G>);
export const TicketIcon = (p: GlyphProps) => (<G {...p}><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v1a2.5 2.5 0 0 0 0 5v1A1.5 1.5 0 0 1 18.5 17h-13A1.5 1.5 0 0 1 4 15.5v-1a2.5 2.5 0 0 0 0-5z" /><path d="M12 9v6" /></G>);
export const SearchSparkIcon = (p: GlyphProps) => (<G {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /><path d="M11 8.5v5M8.5 11h5" /></G>);
export const CartPulseIcon = (p: GlyphProps) => (<G {...p}><path d="M4 5h2l2 10h10l2-7H7" /><path d="M9 19.5h.01M17 19.5h.01" /><path d="M13 9.5h4M15 7.5v4" /></G>);

/* ── Glyphes d'interface ────────────────────────────────────────────────── */

export const SearchIcon = (p: GlyphProps) => (<G {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></G>);
export const CloseIcon = (p: GlyphProps) => (<G {...p}><path d="M6 6l12 12M18 6 6 18" /></G>);
export const ExpandIcon = (p: GlyphProps) => (<G {...p}><path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M20 9V5.5A1.5 1.5 0 0 0 18.5 4H15M4 15v3.5A1.5 1.5 0 0 0 5.5 20H9M20 15v3.5A1.5 1.5 0 0 1 18.5 20H15" /><path d="M9.5 14.5 5 19M14.5 9.5 19 5" /></G>);
export const CollapseIcon = (p: GlyphProps) => (<G {...p}><path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M20 9V5.5A1.5 1.5 0 0 0 18.5 4H15M4 15v3.5A1.5 1.5 0 0 0 5.5 20H9M20 15v3.5A1.5 1.5 0 0 1 18.5 20H15" /><path d="M5 5l4.5 4.5M19 5l-4.5 4.5M5 19l4.5-4.5M19 19l-4.5-4.5" /></G>);
export const ChevronRightIcon = (p: GlyphProps) => (<G {...p}><path d="m9 5 7 7-7 7" /></G>);
export const ChevronLeftIcon = (p: GlyphProps) => (<G {...p}><path d="m15 5-7 7 7 7" /></G>);
export const ChevronDownIcon = (p: GlyphProps) => (<G {...p}><path d="m5 9 7 7 7-7" /></G>);
export const PlusIcon = (p: GlyphProps) => (<G {...p}><path d="M12 5v14M5 12h14" /></G>);
export const MinusIcon = (p: GlyphProps) => (<G {...p}><path d="M5 12h14" /></G>);
export const CheckIcon = (p: GlyphProps) => (<G {...p}><path d="m5 12.5 4.5 4.5L19 7" /></G>);
export const AlertIcon = (p: GlyphProps) => (<G {...p}><path d="M12 4 2.5 20h19z" /><path d="M12 10v4.5M12 17.5h.01" /></G>);
export const InfoIcon = (p: GlyphProps) => (<G {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.8h.01" /></G>);
export const PlayIcon = (p: GlyphProps) => (<G {...p}><path d="M7 4.5 19 12 7 19.5z" /></G>);
export const PauseIcon = (p: GlyphProps) => (<G {...p}><path d="M9 5v14M15 5v14" /></G>);
export const RefreshIcon = (p: GlyphProps) => (<G {...p}><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20 4v4.5h-4.5" /></G>);
export const TrashIcon = (p: GlyphProps) => (<G {...p}><path d="M4 7h16M9.5 7V5h5v2M6.5 7l1 13h9l1-13" /><path d="M10.5 11v5.5M13.5 11v5.5" /></G>);
export const EditIcon = (p: GlyphProps) => (<G {...p}><path d="M4 20h4l11-11-4-4L4 16z" /><path d="M14.5 5.5 18.5 9.5" /></G>);
export const ExternalIcon = (p: GlyphProps) => (<G {...p}><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 14.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.5" /></G>);
export const CalendarIcon = (p: GlyphProps) => (<G {...p}><rect x="4" y="5.5" width="16" height="15" rx="1.5" /><path d="M4 10h16M9 3.5v4M15 3.5v4" /></G>);
export const ArrowRightIcon = (p: GlyphProps) => (<G {...p}><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></G>);
export const MailIcon = (p: GlyphProps) => (<G {...p}><rect x="3" y="5.5" width="18" height="13" rx="1.5" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></G>);
export const UsersIcon = (p: GlyphProps) => (<G {...p}><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.6a3 3 0 0 1 0 5.8M17 14.5a5.5 5.5 0 0 1 3.5 5" /></G>);
export const BagIcon = (p: GlyphProps) => (<G {...p}><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></G>);
export const TagIcon = (p: GlyphProps) => (<G {...p}><path d="M11 3.5H4.5V10L14 19.5l6.5-6.5z" /><path d="M8 7.5h.01" /></G>);
export const StarIcon = (p: GlyphProps) => (<G {...p}><path d="m12 4 2.4 5.2 5.6.6-4.2 3.8 1.2 5.4L12 16.2 7 19l1.2-5.4L4 9.8l5.6-.6z" /></G>);
export const CopyIcon = (p: GlyphProps) => (<G {...p}><rect x="9" y="9" width="11" height="11" rx="1.5" /><path d="M15 6.5V5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15h1" /></G>);
export const LinkIcon = (p: GlyphProps) => (<G {...p}><path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" /><path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" /></G>);
export const GridIcon = (p: GlyphProps) => (<G {...p}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></G>);
export const ImageIcon = (p: GlyphProps) => (<G {...p}><rect x="3.5" y="5" width="17" height="14" rx="1.5" /><path d="m6 16 4-4 3.5 3.5L16 13l3 3" /><circle cx="9" cy="9.5" r="1.4" /></G>);
export const ClockIcon = (p: GlyphProps) => (<G {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3.5 2" /></G>);
export const LockIcon = (p: GlyphProps) => (<G {...p}><rect x="5" y="10.5" width="14" height="9.5" rx="1.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></G>);
export const LogoMark = ({ size = 22, ...rest }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" {...rest}>
    <path d="M12 1.5 22 12 12 22.5 2 12z" stroke="currentColor" strokeWidth="1.1" />
    <path d="M12 6.8 17.2 12 12 17.2 6.8 12z" fill="currentColor" opacity="0.9" />
  </svg>
);

/* ── Index ──────────────────────────────────────────────────────────────── */

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
  pulse: CartPulseIcon,
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
} as const;

export type IconKey = keyof typeof ICONS;

export function Glyph({ name, ...rest }: { name: IconKey } & GlyphProps) {
  const C = ICONS[name];
  return <C {...rest} />;
}
