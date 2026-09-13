/** The serialisable shapes the coupe homepage passes to its islands. */
export type CoupeUniverse = {
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  children: { name: string; slug: string }[];
};

export type CoupeStore = {
  slug: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  mapsUrl: string | null;
};

export type CoupeArticle = {
  slug: string;
  title: string;
  tag: string;
  excerpt: string;
  image: string | null;
  readMinutes: number;
  publishedAt: Date | string | null;
};

export type CoupePromo = {
  code: string;
  label: string;
  minSubtotalMillimes: number;
  endsAt: Date | string | null;
};
