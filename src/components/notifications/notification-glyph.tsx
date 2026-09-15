"use client";

import {
  BellIcon,
  CardIcon,
  ChatIcon,
  GiftIcon,
  HeartIcon,
  PackageIcon,
  RefreshIcon,
  SparkIcon,
  StarIcon,
  SwapIcon,
  TruckIcon,
  UserIcon,
} from "@/components/icons";

/** The shelf's mark — every notification icon belongs to the house family. */
const GLYPHS: Record<string, typeof BellIcon> = {
  bell: BellIcon,
  package: PackageIcon,
  card: CardIcon,
  truck: TruckIcon,
  star: StarIcon,
  refresh: RefreshIcon,
  heart: HeartIcon,
  user: UserIcon,
  chat: ChatIcon,
  spark: SparkIcon,
  gift: GiftIcon,
  swap: SwapIcon,
};

export function NotificationGlyph({ icon, size = 16 }: { icon: string; size?: number }) {
  const G = GLYPHS[icon] ?? BellIcon;
  return <G size={size} strokeWidth={1.5} />;
}
