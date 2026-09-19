import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";


/**
 * LES ACTIFS — what is actually in the bottles, said once.
 *
 * The catalogue carries `key_actives` as free text, written product by
 * product, the way a supplier writes it: "Panthénol", "Panthénol B5" and
 * "Panthénol 5 %" are three rows for one thing, "Glycérine", "Glycérine
 * végétale" and "Glycérine d'origine végétale" three more. Left alone, a
 * glossary built on that column looks careless — and a customer looking for
 * niacinamide finds one product out of four.
 *
 * So the variants are folded onto a canonical name here, in one table, with
 * the sentence the counter would say about each. Folding is not inventing:
 * every canonical active below appears verbatim on a real product in the
 * catalogue, and the note describes what it is used for in this shop — not
 * what it claims to cure.
 */

export type Family =
  | "Hydratation"
  | "Barrière & nutrition"
  | "Apaisement"
  | "Imperfections"
  | "Solaire"
  | "Cheveu"
  | "Sommeil & tonus"
  | "Nettoyage"
  | "Antioxydant";

export type Active = {
  slug: string;
  label: string;
  family: Family;
  /** One sentence, the counter's voice. Never a promise. */
  note: string;
};

const ACTIVES: Active[] = [
  { slug: "niacinamide", label: "Niacinamide", family: "Imperfections", note: "Régule le sébum et resserre le grain de peau ; se tolère mieux que les acides." },
  { slug: "zinc", label: "Zinc", family: "Imperfections", note: "Assèche un bouton sans décaper la zone autour." },
  { slug: "procerad", label: "Procerad", family: "Imperfections", note: "Céramide breveté : limite les marques laissées par les boutons." },
  { slug: "acide-hyaluronique", label: "Acide hyaluronique", family: "Hydratation", note: "Retient l'eau dans la peau ; deux poids moléculaires valent mieux qu'un." },
  { slug: "glycerine", label: "Glycérine", family: "Hydratation", note: "Le plus vieil humectant qui soit, et toujours le plus sûr." },
  { slug: "xylitol", label: "Xylitol", family: "Hydratation", note: "Sucre végétal qui aide la peau à garder son eau." },
  { slug: "ceramides", label: "Céramides", family: "Barrière & nutrition", note: "Le mortier entre les cellules : on les remplace quand la peau tiraille." },
  { slug: "beurre-de-karite", label: "Beurre de karité", family: "Barrière & nutrition", note: "Nourrit les zones sèches, coudes, talons, mollets." },
  { slug: "perseose-d-avocat", label: "Perséose d'avocat", family: "Barrière & nutrition", note: "Actif de croissance utilisé depuis la première enfance." },
  { slug: "huile-de-colza", label: "Huile de colza", family: "Barrière & nutrition", note: "Source locale d'oméga : elle relipide sans parfum." },
  { slug: "esters-d-acides-gras", label: "Esters d'acides gras", family: "Barrière & nutrition", note: "Donne le fondant d'un baume sans le rendre gras." },
  { slug: "eau-thermale", label: "Eau thermale", family: "Apaisement", note: "Apaise une peau qui chauffe ; on la garde au réfrigérateur en été." },
  { slug: "eau-volcanique", label: "Eau volcanique", family: "Apaisement", note: "Minéralisante, elle fortifie une peau fatiguée." },
  { slug: "avoine", label: "Avoine", family: "Apaisement", note: "Le recours des cuirs chevelus et des peaux qui grattent." },
  { slug: "camomille", label: "Camomille", family: "Apaisement", note: "Calme les rougeurs diffuses, chez l'enfant comme chez l'adulte." },
  { slug: "plantain", label: "Plantain", family: "Apaisement", note: "Plante de peau atopique : elle calme la démangeaison." },
  { slug: "madecassoside", label: "Madécassoside", family: "Apaisement", note: "Extrait de centella : répare une peau abîmée, sans parfum." },
  { slug: "aqua-posae-filiformis", label: "Aqua Posae Filiformis", family: "Apaisement", note: "Ferment propre aux peaux à imperfections : il rééquilibre la flore." },
  { slug: "prebiotiques", label: "Prébiotiques", family: "Apaisement", note: "Nourrissent la flore de la peau plutôt que de la stériliser." },
  { slug: "complexe-biomimetique", label: "Complexe biomimétique", family: "Apaisement", note: "Copie les lipides de la peau pour qu'elle les reconnaisse." },
  { slug: "mexoryl", label: "Mexoryl", family: "Solaire", note: "Filtre large spectre : c'est lui qui tient à midi en juillet." },
  { slug: "filtres-photostables", label: "Filtres photostables", family: "Solaire", note: "Ne se dégradent pas sous le soleil — la crème protège jusqu'au soir." },
  { slug: "airlicium", label: "Airlicium", family: "Solaire", note: "Absorbe le sébum sous le solaire : le fini reste mat." },
  { slug: "panthenol", label: "Panthénol (B5)", family: "Barrière & nutrition", note: "Répare et adoucit ; on le retrouve partout, et pour cause." },
  { slug: "sucralfate", label: "Sucralfate", family: "Barrière & nutrition", note: "Pansement cutané : il protège une peau irritée." },
  { slug: "mannitol", label: "Mannitol", family: "Apaisement", note: "Sucre apaisant qui limite l'inconfort après le nettoyage." },
  { slug: "piroctone-olamine", label: "Piroctone olamine", family: "Cheveu", note: "Antifongique des pellicules : en cure, pas en continu." },
  { slug: "oxetholine", label: "Oxétholine", family: "Cheveu", note: "Stimule le cuir chevelu dans les cures anti-chute." },
  { slug: "vitamine-b6", label: "Vitamine B6", family: "Cheveu", note: "Freine le sébum du cuir chevelu." },
  { slug: "melatonine", label: "Mélatonine", family: "Sommeil & tonus", note: "À libération prolongée : pour les endormissements difficiles." },
  { slug: "passiflore", label: "Passiflore", family: "Sommeil & tonus", note: "Plante du soir, sans accoutumance." },
  { slug: "verveine", label: "Verveine", family: "Sommeil & tonus", note: "Tisane du soir en gélule : calme sans endormir." },
  { slug: "magnesium", label: "Magnésium", family: "Sommeil & tonus", note: "Marin : utile quand les paupières sautent de fatigue." },
  { slug: "ginseng", label: "Ginseng", family: "Sommeil & tonus", note: "Tonique de fond, sur trois semaines, jamais ponctuellement." },
  { slug: "vitamine-d3", label: "Vitamine D3", family: "Sommeil & tonus", note: "La supplémentation la plus souvent utile sous nos latitudes." },
  { slug: "vitamine-e", label: "Vitamine E", family: "Antioxydant", note: "Antioxydant de confort ; il protège surtout la formule." },
  { slug: "base-lavante-sans-savon", label: "Base lavante sans savon", family: "Nettoyage", note: "Nettoie sans décaper : la base des peaux qui ne supportent rien." },
];

/** Every spelling the catalogue uses, folded onto its canonical name. */
const ALIASES: Record<string, string> = {
  niacinamide: "niacinamide",
  zinc: "zinc",
  "gluconate de zinc": "zinc",
  "cuivre-zinc": "zinc",
  procerad: "procerad",
  "acide hyaluronique (2 poids moléculaires)": "acide-hyaluronique",
  glycérine: "glycerine",
  "glycérine végétale": "glycerine",
  "glycérine d'origine végétale": "glycerine",
  xylitol: "xylitol",
  céramides: "ceramides",
  "beurre de karité": "beurre-de-karite",
  "perséose d'avocat": "perseose-d-avocat",
  "huile de colza": "huile-de-colza",
  "ester d'acides gras": "esters-d-acides-gras",
  "eau thermale": "eau-thermale",
  "eau thermale d'avène": "eau-thermale",
  "eau volcanique de vichy 89 %": "eau-volcanique",
  "extrait d'avoine": "avoine",
  "extraits de camomille": "camomille",
  "extrait de plantain": "plantain",
  madécassoside: "madecassoside",
  "aqua posae filiformis": "aqua-posae-filiformis",
  prébiotiques: "prebiotiques",
  "complexe biomimétique": "complexe-biomimetique",
  "mexoryl 400": "mexoryl",
  "filtres photostables": "filtres-photostables",
  airlicium: "airlicium",
  panthénol: "panthenol",
  "panthénol b5": "panthenol",
  "panthénol 5 %": "panthenol",
  pantothonate: "panthenol",
  sucralfate: "sucralfate",
  mannitol: "mannitol",
  "piroctone olamine": "piroctone-olamine",
  oxétholine: "oxetholine",
  "vitamine b6": "vitamine-b6",
  "mélatonine lp": "melatonine",
  passiflore: "passiflore",
  verveine: "verveine",
  "oxyde de magnésium marin": "magnesium",
  "panax ginseng bio (racine)": "ginseng",
  "cholécalciférol d3": "vitamine-d3",
  "vitamine e": "vitamine-e",
  "base lavante sans savon": "base-lavante-sans-savon",
};

/** The same folding, done by PostgreSQL so both sides are compared alike. */
const ACC = "àáâäãåçéèêëíìîïñóòôöõúùûüý";
const REP = "aaaaaac" + "eeee" + "iiii" + "n" + "ooooo" + "uuuu" + "y";
const folded = (column: string) => sql.raw(
  `translate(lower(btrim(${column})), '${ACC}', '${REP}')`,
);

const fold = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const KEY = new Map(ACTIVES.map((a) => [a.slug, a]));
const LOOKUP = new Map(Object.entries(ALIASES).map(([variant, slug]) => [fold(variant), slug]));

/** The canonical active behind a free-text name, or null if we don't know it. */
export function canonise(raw: string): Active | null {
  const slug = LOOKUP.get(fold(raw));
  return slug ? KEY.get(slug) ?? null : null;
}

export function activeBySlug(slug: string): Active | null {
  return KEY.get(slug) ?? null;
}

export type ActiveCount = Active & { n: number };

/** Every active present on the shelf, with its real reference count. */
export async function listActives(): Promise<ActiveCount[]> {
  const res = await db.execute(sql`
    select a.active, count(distinct p.id)::int as n
    from ${products} p, jsonb_array_elements_text(coalesce(p.key_actives, '[]'::jsonb)) a(active)
    where p.status = 'active'
    group by 1
  `);
  const rows = (res as unknown as { rows: { active: string; n: number }[] }).rows ?? [];

  const counts = new Map<string, number>();
  for (const row of rows) {
    const canon = canonise(row.active);
    if (!canon) continue;
    counts.set(canon.slug, (counts.get(canon.slug) ?? 0) + Number(row.n));
  }
  return ACTIVES.filter((a) => counts.has(a.slug))
    .map((a) => ({ ...a, n: counts.get(a.slug) ?? 0 }))
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, "fr"));
}

/**
 * The ids of the products carrying an active — matched on any of its
 * spellings, best-sellers first. Ids only: `getByIds` turns them into real
 * cards, so a glossary page and the shelf never disagree about a price.
 */
export async function productIdsForActive(slug: string): Promise<number[]> {
  if (!KEY.has(slug)) return [];
  // Folded, because the column says "Niacinamide" and the table says
  // "niacinamide": an accent- and case-blind compare is the whole point.
  const variants = Object.entries(ALIASES)
    .filter(([, s]) => s === slug)
    .map(([variant]) => fold(variant));

  const match = sql.join(
    variants.map((v) => sql`${folded("a.active")} = ${v}`),
    sql` or `,
  );

  const res = await db.execute(sql`
    select p.id
    from ${products} p
    where p.status = 'active'
      and exists (
        select 1 from jsonb_array_elements_text(coalesce(p.key_actives, '[]'::jsonb)) a(active)
        where ${match}
      )
    order by p.sales_count desc, p.name
  `);
  const rows = (res as unknown as { rows: { id: number }[] }).rows ?? [];
  return rows.map((r) => Number(r.id));
}

export const ACTIVE_FAMILIES: Family[] = [
  "Hydratation",
  "Barrière & nutrition",
  "Apaisement",
  "Imperfections",
  "Solaire",
  "Cheveu",
  "Sommeil & tonus",
  "Nettoyage",
  "Antioxydant",
];
