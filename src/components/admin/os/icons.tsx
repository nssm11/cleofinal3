import type { SVGProps, ReactNode } from "react";

export type GlyphProps = SVGProps<SVGSVGElement> & { size?: number; title?: string; strokeWidth?: number };

function G({ size = 18, title, children, strokeWidth = 1.2, ...rest }: GlyphProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" aria-hidden={title ? undefined : true} role={title ? "img" : undefined} focusable="false" {...rest}>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

const mk = (d: string) => (p: GlyphProps) => <G {...p}><path d={d} /></G>;
const mk2 = (paths: string[]) => (p: GlyphProps) => <G {...p}>{paths.map((d, i) => <path key={i} d={d} />)}</G>;

export const SearchIcon = mk("M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-3.5-3.5");
export const CloseIcon = mk("M6 6l12 12M18 6L6 18");
export const MenuIcon = mk("M4 7h16M4 12h16M4 17h16");
export const ChevronRightIcon = mk("M9 6l6 6-6 6");
export const ChevronDownIcon = mk("M6 9l6 6 6-6");
export const PlusIcon = mk("M12 5v14M5 12h14");
export const MinusIcon = mk("M5 12h14");
export const CheckIcon = mk("M5 12l5 5L20 7");
export const InfoIcon = mk("M12 8h.01M11 12h1v4h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z");
export const AlertIcon = mk("M12 3L3 20h18L12 3zM12 10v4M12 17h.01");
export const RefreshIcon = mk("M20 12a8 8 0 1 1-2.3-5.7M20 3v5h-5M4 12a8 8 0 0 1 2.3-5.7M4 21v-5h5");
export const TrashIcon = mk("M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6");
export const ExternalIcon = mk("M14 4h6v6M20 4l-9 9M18 14v6H4V6h6");
export const LockIcon = mk("M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3");
export const UsersIcon = mk("M9 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM2 20a7 7 0 0 1 14 0M16 8a3 3 0 1 1 0 6M18 15a7 7 0 0 1 4 5");
export const BagIcon = mk("M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2");
export const TagIcon = mk("M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01");
export const StarIcon = mk("M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8z");
export const BookOpenIcon = mk("M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM8 3v16");
export const ClockIcon = mk("M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z");
export const FilterLinesIcon = mk("M4 6h16M7 12h10M10 18h4");
export const DownloadSmallIcon = mk("M12 4v11M7 11l5 5 5-5M4 20h16");
export const SparkIcon2 = mk("M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5L9 9M15 15l2.5 2.5M6.5 17.5L9 15M15 9l2.5-2.5");
export const ArrowRightIcon = mk("M4 12h16M14 6l6 6-6 6");
export const ArrowUpRightIcon = mk("M7 17L17 7M8 7h9v9");
export const LinkIcon = mk("M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7");
export const CubeIcon = mk("M12 3l8 4v10l-8 4-8-4V7l8-4zM4 7l8 4 8-4M12 11v10");
export const LayersIcon = mk("M3 12l9-5 9 5-9 5-9-5zM3 17l9 5 9-5");
export const NoteIcon = mk("M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z");
export const StoreIcon = mk("M4 10L5.5 4h13L20 10M4 10v10h16V10M10 20v-5h4v5");
export const CommandIcon = mk("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v8M8 12h8");
export const BellIcon = mk("M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5zM10 20a2 2 0 0 0 4 0");
export const GaugeIcon = mk("M4 17a8 8 0 1 1 16 0M12 17l4-4M12 17a1 1 0 1 0 0 2 1 1 0 0 0 0-2z");
export const FlowIcon = mk("M6 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM18 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM9 9h6v6H9z");
export const CompassIcon = mk("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15 9l-2 5-4 1 2-5 4-1z");
export const FlameIcon = mk("M12 3s5 4 5 8.5a5 5 0 0 1-10 0C7 9 8 8 8 8s1 1.4 2.5 1.4S12 3 12 3z");
export const PinIcon = mk("M12 3v7M8 11h8l1 3H7l1-3zM12 14v8");
export const FocusIcon = mk("M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4");
export const DensityIcon = mk("M5 7h14M5 12h10M5 17h7");
export const ArrowDownRightIcon = mk("M7 7l10 10M17 9v8H9");
export const DeltaIcon = mk("M12 5l6.5 11h-13L12 5z");
export const SigmaIcon = mk("M17 5H7.5L12 12l-4.5 6.5H17");
export const LedgerIcon = mk("M4 4h16v16H4zM4 9h16M9 9v11M13 13h4M13 16h4");
export const RouteIcon = mk("M6 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM18 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 18h4a4 4 0 0 0 0-8H8a4 4 0 0 1 0-8h8");
export const BeakerIcon = mk("M8 3h8M10 3v5l-4 8h12l-4-8V3M7 14h10");
export const StampIcon = mk("M5 20h14M7 17v-1a3 3 0 0 1 2-2.7 1 1 0 0 0 1-1v-1a2 2 0 0 1 4 0v1a1 1 0 0 0 1 1 3 3 0 0 1 2 2.7v1H7z");
export const ClapperIcon = mk("M4 10h16v9H4zM4 10l2-4h4L8 10M11 10l2-4h4l-2 4");
export const ScaleIcon = mk("M12 4v16M7 20h10M5 8h14M8 8l-2 5a2 2 0 0 0 4 0L8 8zM16 8l-2 5a2 2 0 0 0 4 0L16 8z");
export const PlugIcon = mk("M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8zM12 16v4");
export const ServerIcon = mk("M3 4h18v6H3zM3 14h18v6H3zM7 7h.01M7 17h.01");
export const SkullIcon = mk("M12 3a7 7 0 0 0-7 7c0 2 .7 3.3 1.7 4.3V17h10.6v-2.7A7 7 0 0 0 19 10a7 7 0 0 0-7-7zM9 11h.01M15 11h.01");
export const ClockArrowIcon = mk("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2");
export const ColumnsIcon = mk("M3 4h18v16H3zM9 4v16M15 4v16");
export const UploadIcon = mk("M12 16V5M8 8l4-4 4 4M5 20h14");
export const UndoIcon = mk("M9 8L5 12l4 4M5 12h9a5 5 0 0 1 0 10h-3");
export const EyeIcon = mk("M2 12s4-5.5 10-5.5S22 12 22 12s-4 5.5-10 5.5S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z");
export const PercentIcon = mk("M6 18l12-12M7 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM17 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z");
export const TicketIcon = mk("M4 8h16v3a2 2 0 0 1 0 4v3H4v-3a2 2 0 0 0 0-4V8zM12 9v6");
export const SearchSparkIcon = mk("M11 11a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM20 20l-4-4M11 8v5M8 11h5");
export const CartPulseIcon = mk("M5 8h13l-1 11h-11L5 8zM9 8V7a3 3 0 0 1 6 0v1M14 13h4M16 11v4");
export const ActivityIcon = mk("M3 12h3l2-4 3 8 2-5 1 1h7");
export const ChevronLeftIcon = mk("M15 6l-6 6 6 6");
export const ExpandIcon = mk("M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4M9 14L5 18M15 10l4-4");
export const CollapseIcon = mk("M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4M5 5l4 4M19 5l-4 4M5 19l4-4M19 19l-4-4");
export const PlayIcon = mk("M7 5l11 7-11 7V5z");
export const PauseIcon = mk("M9 5v14M15 5v14");
export const EditIcon = mk("M4 20h4l11-11-4-4L4 16v4zM13 6l4 4");
export const CalendarIcon = mk("M4 5h16v16H4zM4 10h16M9 3v4M15 3v4");
export const MailIcon = mk("M3 5h18v14H3zM4 7l8 6 8-6");
export const CopyIcon = mk("M9 9h11v11H9zM5 15V5h10v4");
export const GridIcon = mk("M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z");
export const ImageIcon = mk("M3 5h18v14H3zM9 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM5 18l4-4 3 3 2-2 5 3");
export const LogoMark = ({ size = 22, ...rest }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" {...rest}>
    <path d="M12 2L22 12L12 22L2 12L12 2z" stroke="currentColor" strokeWidth="1" />
    <path d="M12 7L17 12L12 17L7 12L12 7z" fill="currentColor" />
  </svg>
);

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
} as const;

export type IconKey = keyof typeof ICONS;

export function Glyph({ name, ...rest }: { name: IconKey } & GlyphProps) {
  const C = ICONS[name];
  return <C {...rest} />;
}
