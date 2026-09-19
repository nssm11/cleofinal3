import "dotenv/config";
import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";
import { inArray, sql } from "drizzle-orm";
import { db, pool } from "./index";
import {lotEvents, productLots, type ProductDataClaim, addresses, articleProducts, articles, brands, categories, concerns, diagnostics, emailOutbox, inventoryMovements, orderEvents, orderItems, orders, passwordResets, productConcerns, products, promotions, restockAlerts, reviews, rituals, stores, subscriptionEvents, subscriptionItems, subscriptions, supportTickets, ticketMessages, users, wishlistItems, wishlistShares, shelves, duos, routineSteps, productSubstitutes, productPairs, queryLandings} from "./schema";
import { PRODUCT_IMAGES } from "./productImages";
import { allergensIn, activesIn, isFragranceFree, readFormula } from "@/lib/inci";
import { ean13 } from "@/lib/barcode";
import { seedHistory } from "./seed-history";

const scrypt = promisify(_scrypt) as (p: string, s: string, n: number) => Promise<Buffer>;
async function hash(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${(await scrypt(pw, salt, 64)).toString("hex")}`;
}
const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * Seed script: wipes the database and loads demo data.
 * Production runs require ALLOW_DESTRUCTIVE_SEED=1 and real passwords via env vars.
 */
const IS_PROD_SEED = (process.env.NODE_ENV ?? "development") === "production";
const FORCED = process.env.ALLOW_DESTRUCTIVE_SEED === "1";

function assertSafeToSeed() {
  if (IS_PROD_SEED && !FORCED) {
    console.error("\n✖ Seed aborted — NODE_ENV=production.");
    console.error("  This script runs TRUNCATE … CASCADE on every table and would destroy live data.");
    console.error("  If you truly intend this, re-run with ALLOW_DESTRUCTIVE_SEED=1.\n");
    process.exit(1);
  }
  if (IS_PROD_SEED) {
    console.warn("⚠ ALLOW_DESTRUCTIVE_SEED=1 — wiping a production database.");
    for (const v of ["SEED_ADMIN_PASSWORD", "SEED_SUPPORT_PASSWORD"]) {
      if (!process.env[v]) {
        console.error(`✖ ${v} must be set: demo passwords are never used for production accounts.`);
        process.exit(1);
      }
    }
  } else {
    console.warn("⚠ Development seed — about to TRUNCATE all tables.");
  }
}

const demoPassword = (name: string, fallback: string) => {
  const v = process.env[name];
  if (v) return v;
  if (IS_PROD_SEED) {
    console.error(`✖ ${name} is required when seeding production.`);
    process.exit(1);
  }
  return fallback;
};

async function main() {
  assertSafeToSeed();
  console.log("→ Reset");
  await db.execute(sql`TRUNCATE TABLE
    article_products, ticket_messages, support_tickets, email_outbox, password_resets,
    restock_alerts, subscriptions, subscription_items, subscription_events, rituals, diagnostics, wishlist_shares,
    loyalty_transactions, audit_logs, analytics_events, search_events, query_landings, newsletter_subscribers,
    wishlist_items, order_events, order_items, orders, promotions, inventory_movements, reviews, product_concerns,
    shelves, duos, routine_steps, product_substitutes, product_pairs,
    products, concerns, categories, brands, articles, stores, addresses, sessions, users
    RESTART IDENTITY CASCADE`);

  console.log("→ Users");
  const ADMIN_PW = demoPassword("SEED_ADMIN_PASSWORD", "Admin123!");
  const SUPPORT_PW = demoPassword("SEED_SUPPORT_PASSWORD", "Support123!");
  const CLIENT_PW = demoPassword("SEED_CLIENT_PASSWORD", "Client123!");
  const [admin, support, customer] = await db.insert(users).values([
    { email: "admin@cleopatre.tn", passwordHash: await hash(ADMIN_PW), firstName: "Nour", lastName: "Ben Salah", role: "admin", phone: "71430500", emailVerifiedAt: new Date() },
    { email: "support@cleopatre.tn", passwordHash: await hash(SUPPORT_PW), firstName: "Sami", lastName: "Trabelsi", role: "support", phone: "71430501", emailVerifiedAt: new Date() },
    { email: "client@cleopatre.tn", passwordHash: await hash(CLIENT_PW), firstName: "Ines", lastName: "Mansour", role: "customer", phone: "22345678", loyaltyPoints: 42, locale: "fr", emailVerifiedAt: new Date() },
    { email: "client.tn@cleopatre.tn", passwordHash: await hash(CLIENT_PW), firstName: "Rania", lastName: "Jaziri", role: "customer", phone: "55123456", loyaltyPoints: 1_240, locale: "tn", emailVerifiedAt: new Date() },
  ]).returning();
  await db.insert(addresses).values({
    userId: customer.id, label: "Domicile", fullName: "Ines Mansour", phone: "22345678", line1: "12 rue des Jasmins", city: "Ezzahra", governorate: "Ben Arous", postalCode: "2034", isDefault: true,
  });

  console.log("→ Brands");
  const brandRows = await db.insert(brands).values([
    { slug: "la-roche-posay", name: "La Roche-Posay", country: "France", isFeatured: true, story: "Tout commence par une eau : celle de la source thermale de La Roche-Posay, riche en sélénium, apaisante et antioxydante. Le laboratoire construit depuis 1905 une dermatologie de la douceur, testée sur peaux sensibles et réactives avant d'être commercialisée. Ses formules sont courtes, leurs actifs ciblés — barres de tolérance strictes, parfum réduit au minimum, packaging pensés pour la contamination zéro. En officine, c’est la maison vers laquelle on renvoie une peau qui ne supporte plus grand-chose : elle ne promet pas la lune, elle rend le quotidien possible." },
    { slug: "avene", name: "Avène", country: "France", isFeatured: true, story: "L’Eau thermale d’Avène jaillit dans les Cévennes depuis 1743 — et c’est encore elle qui entre dans chaque formule, stérile, isotonique, reconnue apaisante contre les irritations. Le laboratoire n’ajoute que le strict nécessaire et retire tout ce qui peut piquer : la gamme Sterile Cosmetics va jusqu’à supprimer conservateurs et émulsifiants superflus. Les peaux atopiques, réactives ou post-actiques trouvent ici un terrain neutre. Nous la recommandons quand la peau demande la paix avant les résultats." },
    { slug: "vichy", name: "Vichy", country: "France", isFeatured: true, story: "Forts de l’eau volcanique d’Auvergne — vingt-deux minéraux rares, un pH doux — les laboratoires Vichy relient cosmétologie et physiologie cutanée depuis 1931. Le renforcement de la barrière est leur obsession, visible dans Minéral 89 comme dans les soins anti-âge à la vitamine C. Leur discours est net, jamais anxiogène : la peau se défend mieux quand elle est bien hydratée. En Tunisie, c’est souvent le premier « vrai soin » que les peaux sensibles osent." },
    { slug: "bioderma", name: "Bioderma", country: "France", isFeatured: true, story: "Bioderma observe la peau comme un écosystème : chaque soin doit nourrir la peau sans dérégler son microbiote, idée qu’ils nomment écobiologie et qu’ils déclinent depuis 1977. Sensibio H2O, leur eau micellaire née en 1995, a changé la démaquillage du monde entier — y compris le nôtre, où elle sort du comptoir plusieurs fois par jour. Sébium régule le sébum sans le brider, Photoderm protège avec des filtres stables même à 45 degrés. Une maison de biologie plus que de marketing : c’est exactement ce qu’on cherche en pharmacie." },
    { slug: "nuxe", name: "Nuxe", country: "France", isFeatured: true, story: "Nuxe a prouvé qu’un soin pouvait être efficace et un plaisir : l’Huile Prodigieuse, mélanges d’huiles précieuses né en 1991, doit son succès à sa sensorialité franche plutôt qu’à une promesse exagérée. Le reste de la maison suit : textures qui sentent bon la Méditerranée, compositions à 90 % d’origine naturelle, emballage soigné sans excès. Pour les peaux qui refusent la « pharmacie blanche », c’est la porte d’entrée la plus douce vers une routine qui tient." },
    { slug: "caudalie", name: "Caudalie", country: "France", isFeatured: true, story: "Née dans les chais de Bordeaux, Caudalie a transformé les pépins de raisin en science : les polyphénols stabilisés et le resvératrol de vigne sont ses signatures antioxydantes, publiées et déposées. Le laboratoire filtre les ingrédients selon une charte « propre » stricte — huiles minérales, PEG et parfums de synthèse restent dehors — et reverse 1 % du chiffre au climat. Vinoperfect est la réponse honnête aux taches pour celles et ceux que l’acide azélaïque agace. Des soins lents, efficaces, sans esbroufe." },
    { slug: "uriage", name: "Uriage", country: "France", story: "L’eau thermale d’Uriage, à quarante-huit minutes d’ascension alpine, est la seule grande eau isotonique de dermo-cosmétique : elle respecte la physiologie cellulaire et hydrate sans effet d’évaporation. La maison en fait la base de crèmes barrières solides, d’une ligne solaire robuste et d’hygiène intime au pH juste. Bariéderm répare les éraflures du quotidien. Un laboratoire alpin, discret, que les pharmaciens gardent sous le coude pour les histoires de barrière cutanée." },
    { slug: "svr", name: "SVR", country: "France", story: "Chez SVR, on parle en sur-dosages : des actifs à des concentrations dermatologiques utiles, dans des formules sans parfum de complaisance et des textures modernisées chaque année. Laboratoire indépendant fondé en 1962, il reste à l’écart des grands groupes — ce qui se sent dans l’audace de certaines formules, comme le Sebiaclear ou les ampoules de vitamine C stabilisée. C’est la marque que l’on propose quand on veut un résultat visible sans ordonnance." },
    { slug: "mustela", name: "Mustela", country: "France", story: "Depuis 1950, Mustela accompagne les premières années : pédiatrie et obstétrique dans l’ADN, engagement « 100 % premier âge », ingrédients d’origine naturelle majoritaire et tests sous contrôle pédiatrique. Le change, le bain, la vergeture des neufs mois — rien de spectaculaire, mais une constance que les mamans remboursent en confiance. En Tunisie comme ailleurs, la gamme traverse les générations." },
    { slug: "ducray", name: "Ducray", country: "France", story: "Depuis 1930, Ducray ne quitte pas le cuir chevelu : chute, pellicules, séborrhée — chaque gamme répond à une indication précise, pensée comme un traitement d’accompagnement. L’expertise est dermatologique française, les cures sont courtes et cadrées (le shampoing ne se choisit pas comme un parfum). Anaphase et Kelual DS sont les deux piliers que nous ressaisissons chaque rentrée." },
    { slug: "eucerin", name: "Eucerin", country: "Allemagne", story: "Cent ans de recherche à Hambourg : Eucerin a inventé l’hydratation par urée, et sa philosophie tient dans la démonstration clinique plutôt que dans l’ingrédient vedette. Les gammes DermoPure, AtopiControl et Photo Aging sont testées in vivo, et cela se voit sur les textures, parfois austères mais franches. Le baume Aquaphor, lui, est dans nos placards familiaux depuis toujours." },
    { slug: "filorga", name: "Filorga", country: "France", isFeatured: true, story: "Filorga vient des cabinets de médecine esthétique — ses fondateurs ont fabriqué les premiers produits de comblement européens — et transpose cette rigueur aux cosmétiques : le NCEF, cocktail de vitamines, acides aminés et coenzymes, est leur signature cellulaire. Les textures sont luxueuses sans être futiles, les promesses bornées par ce que la cosmétique peut vraiment faire. Cadeau de fête par excellence, aussi, ce qui ne gâche rien." },
    { slug: "isdin", name: "ISDIN", country: "Espagne", story: "Barcelone, la mer, et une obsession méditerranéenne du phototype : ISDIN conçoit des solaires qui supportent 38 degrés à l’ombre, avec des textures invisibles là où d’autres laissent un masque blanc. Le Fotoprotector Fusion Water est le format « je remets toutes les deux heures » par excellence. La maison propose aussi la silice des cicatrices et la prévention des vergetures — deux demandes que nous voyons tous les jours à Ezzahra." },
    { slug: "arkopharma", name: "Arkopharma", country: "France", story: "Leader français de la phytothérapie, Arkopharma a construit sa réputation sur la traçabilité de la plante : extraits titrés, gélules végétales, contrôles à chaque lot. Ses cures saisonnières — immunité, sommeil, énergie — sont le premier réflexe quand l’alimentation ne suffit plus, et notre comptoir les vend en conseillant l’heure plutôt que l’espoir. Vitamine D incluse, si nécessaire en Tunisie." },
    { slug: "klorane", name: "Klorane", country: "France", story: "Chaque shampooing Klorane commence par une plante : avoine pour les cuirs chevelus réactifs, papyrus pour les cheveux qui regraissent, quinine pour la chute. La botanique est une méthode, pas un décor — les extraits sont sélectionnés pour leur tolérance et leurs textures douces, sans silicones lourdes. Les familles tunisiennes adoptent l’avoine en été et le baume mangue après la mer." },
    { slug: "cerave", name: "CeraVe", country: "États-Unis", story: "Développée avec des dermatologues, CeraVe a fait entrer la science des céramides dans le pot du quotidien : trois céramides identiques à ceux de la peau, acide hyaluronique et technologie MVE qui diffuse l’hydratation sur vingt-quatre heures. Le parfum est quasi nul et le prix honnête, ce qui en fait la crème que l’on garde dans la salle de bain familiale. Nous la conseillons dès que la barrière cutanée baille." },
  ]).returning();
  const B = Object.fromEntries(brandRows.map((b) => [b.slug, b.id]));

  console.log("→ Universes & categories");
  const universeDefs = [
    { slug: "visage", name: "Visage", image: "/images/u-visage.jpg", description: "Nettoyants, sérums, hydratants et soins ciblés.", story: "Le visage se soigne avec patience. Nous avons sélectionné des formules précises, dosées avec justesse, pour une peau équilibrée saison après saison.", children: ["Nettoyants & démaquillants", "Sérums", "Hydratants", "Anti-âge", "Contour des yeux", "Peaux à imperfections"] },
    { slug: "corps", name: "Corps", image: "/images/u-corps.jpg", description: "Hydratation, douche, mains et soins spécifiques.", story: "Un rituel corps quotidien, pensé pour la peau du bassin méditerranéen : hydratation profonde, textures fondantes, parfums discrets.", children: ["Hydratants corps", "Douche & bain", "Mains & pieds", "Vergetures & fermeté"] },
    { slug: "cheveux", name: "Cheveux", image: "/images/u-cheveux.jpg", description: "Shampooings, soins, chute et cuir chevelu.", story: "Des cheveux sains commencent par un cuir chevelu apaisé. Notre sélection privilégie la botanique et la dermatologie.", children: ["Shampooings", "Après-shampooings & masques", "Anti-chute", "Cuir chevelu sensible"] },
    { slug: "solaire", name: "Solaire", image: "/images/u-solaire.jpg", description: "Protection très haute, après-soleil et autobronzants.", story: "Sous le soleil tunisien, la protection n'est pas une option. Des textures invisibles, résistantes à l'eau, pour toute la famille.", children: ["Protection visage", "Protection corps", "Après-soleil", "Enfants"] },
    { slug: "bebe-maman", name: "Bébé & Maman", image: "/images/u-bebe.jpg", description: "Toilette, change, hydratation et grossesse.", story: "La douceur comme seule exigence. Des formules sûres, d'origine naturelle, pour les premières années et la maternité.", children: ["Toilette bébé", "Change", "Soins maman"] },
    { slug: "complements", name: "Compléments", image: "/images/u-complements.jpg", description: "Vitalité, immunité, sommeil, beauté de l'intérieur.", story: "Compléter sans excès. Des actifs d'origine contrôlée, aux dosages utiles, conseillés par nos pharmaciens.", children: ["Vitalité & immunité", "Sommeil & stress", "Beauté in & out", "Digestion"] },
    { slug: "hygiene", name: "Hygiène & Bien-être", image: "/images/u-hygiene.jpg", description: "Bucco-dentaire, intime, déodorants et essentiels.", story: "Les essentiels du quotidien, choisis pour leur tolérance et leur efficacité, sans superflu.", children: ["Bucco-dentaire", "Hygiène intime", "Déodorants", "Premiers soins"] },
  ];
  const U: Record<string, number> = {};
  const C: Record<string, number> = {};
  let order = 0;
  for (const u of universeDefs) {
    const [row] = await db.insert(categories).values({ slug: u.slug, name: u.name, description: u.description, story: u.story, image: u.image, isUniverse: true, sortOrder: order++ }).returning();
    U[u.slug] = row.id;
    let i = 0;
    for (const c of u.children) {
      const s = slug(c);
      const [cr] = await db.insert(categories).values({ slug: s, name: c, parentId: row.id, image: u.image, sortOrder: i++, description: `${c} — sélection ${u.name.toLowerCase()} Cléopâtre.` }).returning();
      C[s] = cr.id;
    }
  }

  console.log("→ Concerns");
  const concernRows = await db.insert(concerns).values([
    { slug: "peau-sensible", name: "Peau sensible", intro: "Une peau sensible réagit vite : rougeurs, tiraillements, inconfort. La règle : moins d'ingrédients, plus de tolérance." },
    { slug: "peau-seche", name: "Peau sèche", intro: "La peau sèche manque de lipides. On restaure la barrière avec des céramides, du beurre de karité et de la glycérine." },
    { slug: "acne", name: "Imperfections & acné", intro: "Régulation du sébum, exfoliation douce et hydratation non comédogène : les trois piliers d'une peau nette." },
    { slug: "anti-age", name: "Anti-âge", intro: "Rétinol, vitamine C, acide hyaluronique et protection solaire quotidienne : l'essentiel, sans promesses excessives." },
    { slug: "taches", name: "Taches pigmentaires", intro: "Les taches se préviennent d'abord avec un SPF 50+. Les actifs éclaircissants font le reste, avec régularité." },
    { slug: "hydratation", name: "Hydratation", intro: "Une peau hydratée est une peau confortable, lumineuse et mieux protégée." },
    { slug: "chute-de-cheveux", name: "Chute de cheveux", intro: "Saisonnière ou réactionnelle, la chute se traite par cures : compléments ciblés et soins stimulants." },
    { slug: "pellicules", name: "Pellicules", intro: "Apaiser le cuir chevelu et réguler la flore : la clé d'un cuir chevelu net durablement." },
    { slug: "protection-solaire", name: "Protection solaire", intro: "Un SPF 50+ chaque matin est le geste anti-âge et anti-taches le plus efficace qui soit." },
    { slug: "immunite", name: "Immunité & vitalité", intro: "Vitamine C, D, zinc et probiotiques soutiennent les défenses naturelles en période de fatigue." },
    { slug: "sommeil", name: "Sommeil & stress", intro: "Mélatonine, magnésium et plantes apaisantes accompagnent un sommeil réparateur." },
  ]).returning();
  const K = Object.fromEntries(concernRows.map((c) => [c.slug, c.id]));

  console.log("→ Products");
  type P = [name: string, brand: string, universe: string, cat: string, price: number, compare: number | null, vol: string, concerns: string[], short: string, opts?: { featured?: boolean; isNew?: boolean; stock?: number }];
  const P: P[] = [
    // Visage
    ["Effaclar Gel Moussant Purifiant", "la-roche-posay", "visage", "nettoyants-demaquillants", 42_900, 47_500, "400 ml", ["acne", "peau-sensible"], "Nettoie en douceur les peaux grasses à tendance acnéique.", { featured: true }],
    ["Toleriane Dermo-Nettoyant", "la-roche-posay", "visage", "nettoyants-demaquillants", 49_900, null, "400 ml", ["peau-sensible"], "Démaquille et nettoie sans frotter les peaux intolérantes."],
    ["Sensibio H2O Eau Micellaire", "bioderma", "visage", "nettoyants-demaquillants", 38_500, 44_900, "500 ml", ["peau-sensible"], "L'originale. Démaquille et apaise en un seul geste.", { featured: true }],
    ["Sébium Gel Moussant", "bioderma", "visage", "nettoyants-demaquillants", 34_900, null, "500 ml", ["acne"], "Purifie sans dessécher les peaux mixtes à grasses."],
    ["Vinoclean Mousse Nettoyante", "caudalie", "visage", "nettoyants-demaquillants", 52_000, null, "150 ml", ["hydratation"], "Mousse onctueuse à la sève de vigne, pour un teint frais."],
    ["Hyalu B5 Sérum", "la-roche-posay", "visage", "serums", 129_000, 145_000, "30 ml", ["anti-age", "hydratation"], "Repulpe et répare avec deux acides hyaluroniques et vitamine B5.", { featured: true }],
    ["Minéral 89 Booster Quotidien", "vichy", "visage", "serums", 89_900, null, "50 ml", ["hydratation"], "89 % d'eau volcanique et acide hyaluronique pour fortifier la peau.", { featured: true }],
    ["Vinoperfect Sérum Éclat", "caudalie", "visage", "serums", 158_000, null, "30 ml", ["taches", "anti-age"], "62 fois plus efficace que la vitamine C sur les taches. Sans parfum."],
    ["Pure Vitamin C10 Sérum", "la-roche-posay", "visage", "serums", 119_000, null, "30 ml", ["anti-age", "taches"], "Vitamine C pure à 10 % pour un éclat renouvelé et des rides lissées."],
    ["Ampoules Concentrées C+", "svr", "visage", "serums", 98_000, 112_000, "30 ml", ["anti-age"], "Vitamine C stabilisée pour illuminer et protéger la peau."],
    ["NCEF-Reverse Crème Suprême", "filorga", "visage", "anti-age", 249_000, null, "50 ml", ["anti-age"], "Régénération cellulaire multi-corrective inspirée de la médecine esthétique.", { featured: true }],
    ["Time-Filler Crème Anti-rides", "filorga", "visage", "anti-age", 189_000, 215_000, "50 ml", ["anti-age"], "Corrige tous les types de rides, même celles d'expression."],
    ["Liftactiv Collagen Specialist", "vichy", "visage", "anti-age", 135_000, null, "50 ml", ["anti-age"], "Peptides et vitamine C pour relancer la production de collagène."],
    ["Resveratrol-Lift Crème Cachemire", "caudalie", "visage", "anti-age", 149_000, null, "50 ml", ["anti-age"], "Texture cachemire, resvératrol de vigne et acide hyaluronique."],
    ["Hydrance Aqua-Gel", "avene", "visage", "hydratants", 69_900, null, "50 ml", ["hydratation", "peau-sensible"], "Hydratation légère 3-en-1 : crème, masque de nuit et base éclat."],
    ["Toleriane Sensitive Crème", "la-roche-posay", "visage", "hydratants", 59_900, null, "40 ml", ["peau-sensible", "hydratation"], "Hydratant prébiotique pour peaux sensibles, sans parfum."],
    ["Crème Hydratante Visage", "cerave", "visage", "hydratants", 47_900, 54_000, "52 ml", ["peau-seche", "hydratation"], "Trois céramides essentiels et acide hyaluronique. Non comédogène.", { isNew: true }],
    ["Crème Prodigieuse Boost Gel-Baume", "nuxe", "visage", "hydratants", 84_000, null, "40 ml", ["hydratation"], "Repulpe et lisse avec la fleur de jasmin, parfum délicat."],
    ["Aquaphor Baume Réparateur", "eucerin", "visage", "hydratants", 39_900, null, "45 ml", ["peau-seche"], "Répare les peaux très sèches, gercées ou irritées."],
    ["Physiolift Yeux", "avene", "visage", "contour-des-yeux", 79_000, null, "15 ml", ["anti-age"], "Défroisse, décongestionne et illumine le regard."],
    ["Hyalu B5 Yeux", "la-roche-posay", "visage", "contour-des-yeux", 92_000, null, "15 ml", ["anti-age", "hydratation"], "Repulpe le contour des yeux et atténue les cernes."],
    ["Effaclar Duo+ M", "la-roche-posay", "visage", "peaux-a-imperfections", 62_900, 69_900, "40 ml", ["acne"], "Soin anti-imperfections corrigeant, désincrustant et anti-marques.", { featured: true }],
    ["Sébium Global", "bioderma", "visage", "peaux-a-imperfections", 58_000, null, "30 ml", ["acne"], "Soin intensif purifiant pour peaux à imperfections sévères."],
    ["Cleanance Comedomed", "avene", "visage", "peaux-a-imperfections", 61_000, null, "30 ml", ["acne", "peau-sensible"], "Concentré anti-imperfections au Comedoclastin™."],
    ["Normaderm Phytosolution", "vichy", "visage", "peaux-a-imperfections", 64_900, null, "50 ml", ["acne", "hydratation"], "Double correction : imperfections et barrière cutanée."],
    ["Sebiaclear Sérum", "svr", "visage", "peaux-a-imperfections", 71_000, null, "30 ml", ["acne", "taches"], "Réduit les imperfections et les marques en 7 jours."],
    // Corps
    ["Lipikar Baume AP+M", "la-roche-posay", "corps", "hydratants-corps", 79_900, 89_000, "400 ml", ["peau-seche", "peau-sensible"], "Baume relipidant triple action pour peaux très sèches, à tendance atopique.", { featured: true }],
    ["XeraCalm A.D Crème Relipidante", "avene", "corps", "hydratants-corps", 74_000, null, "400 ml", ["peau-seche"], "Apaise les démangeaisons et nourrit durablement."],
    ["Atoderm Intensive Baume", "bioderma", "corps", "hydratants-corps", 69_500, null, "500 ml", ["peau-seche"], "Anti-démangeaisons, ultra-apaisant, 24 h de confort."],
    ["Huile Prodigieuse", "nuxe", "corps", "hydratants-corps", 92_000, null, "100 ml", ["hydratation"], "L'huile sèche culte, multi-usages visage, corps et cheveux.", { featured: true }],
    ["Lotion Hydratante Corps", "cerave", "corps", "hydratants-corps", 49_900, null, "473 ml", ["peau-seche"], "Texture légère, céramides et acide hyaluronique, 24 h."],
    ["Bariéderm Cica-Crème", "uriage", "corps", "hydratants-corps", 32_000, null, "100 ml", ["peau-sensible"], "Répare, assainit et apaise les peaux abîmées."],
    ["Lipikar Syndet AP+", "la-roche-posay", "corps", "douche-bain", 44_900, null, "400 ml", ["peau-seche", "peau-sensible"], "Crème lavante relipidante anti-irritations."],
    ["Atoderm Huile de Douche", "bioderma", "corps", "douche-bain", 52_000, 58_000, "1 L", ["peau-seche"], "Huile ultra-nourrissante, mousse fine, sans savon."],
    ["Rêve de Miel Gel Douche Ultra-Riche", "nuxe", "corps", "douche-bain", 38_000, null, "400 ml", ["hydratation"], "Nettoie en douceur, parfum miel et fleurs délicat."],
    ["Crème Mains Cicaplast", "la-roche-posay", "corps", "mains-pieds", 22_900, null, "100 ml", ["peau-seche"], "Barrière réparatrice mains abîmées. Tenue jusqu'à 6 lavages."],
    ["Crème Mains Rêve de Miel", "nuxe", "corps", "mains-pieds", 24_500, null, "50 ml", ["peau-seche"], "Nourrit et répare les mains et ongles fragilisés."],
    ["Crème Pieds Réparatrice Urea 10%", "eucerin", "corps", "mains-pieds", 34_000, null, "100 ml", ["peau-seche"], "Hydratation intense pour pieds secs et calleux."],
    ["Huile Vergetures Bio", "mustela", "corps", "vergetures-fermete", 64_000, null, "105 ml", ["hydratation"], "Prévient l'apparition des vergetures, 99 % d'origine naturelle."],
    // Cheveux
    ["Shampooing à l'Avoine", "klorane", "cheveux", "shampooings", 29_900, null, "400 ml", ["peau-sensible"], "Ultra-doux, usage fréquent, toute la famille.", { featured: true }],
    ["Anaphase+ Shampooing", "ducray", "cheveux", "shampooings", 41_000, 45_500, "400 ml", ["chute-de-cheveux"], "Shampooing complément anti-chute, redonne force et volume."],
    ["Dercos Anti-Pelliculaire DS", "vichy", "cheveux", "shampooings", 44_900, null, "390 ml", ["pellicules"], "Élimine les pellicules et apaise le cuir chevelu."],
    ["Kelual DS Shampooing", "ducray", "cheveux", "shampooings", 39_000, null, "100 ml", ["pellicules"], "Traitant états pelliculaires sévères et démangeaisons."],
    ["Shampooing au Lait de Papyrus", "klorane", "cheveux", "shampooings", 31_500, null, "400 ml", ["hydratation"], "Nourrit et discipline les cheveux secs et ondulés."],
    ["Baume Après-Shampooing à la Mangue", "klorane", "cheveux", "apres-shampooings-masques", 34_900, null, "200 ml", ["hydratation"], "Nourrit et démêle les cheveux secs sans alourdir."],
    ["Masque Nutri-Réparateur", "nuxe", "cheveux", "apres-shampooings-masques", 58_000, 64_000, "125 ml", ["hydratation"], "Répare et sublime les cheveux abîmés, parfum floral."],
    ["Dercos Aminexil Clinical 5 Femme", "vichy", "cheveux", "anti-chute", 189_000, 210_000, "21 monodoses", ["chute-de-cheveux"], "Traitement anti-chute cliniquement prouvé en 6 semaines.", { featured: true }],
    ["Neoptide Expert Sérum", "ducray", "cheveux", "anti-chute", 165_000, null, "2 × 50 ml", ["chute-de-cheveux"], "Sérum densifiant anti-chute, résultats visibles en 3 mois."],
    ["Forcapil Cheveux & Ongles", "arkopharma", "cheveux", "anti-chute", 59_000, null, "180 gélules", ["chute-de-cheveux"], "Vitamines B, zinc et biotine pour des cheveux fortifiés."],
    ["Sensinol Shampooing Physioprotecteur", "ducray", "cheveux", "cuir-chevelu-sensible", 36_000, null, "200 ml", ["peau-sensible"], "Apaise immédiatement les démangeaisons du cuir chevelu."],
    // Solaire
    ["Anthelios UVMune 400 Fluide Invisible SPF50+", "la-roche-posay", "solaire", "protection-visage", 68_900, 76_000, "50 ml", ["protection-solaire", "taches"], "Protection ultra-large contre les UV ultra-longs. Fini invisible.", { featured: true }],
    ["Fotoprotector Fusion Water SPF50", "isdin", "solaire", "protection-visage", 74_000, null, "50 ml", ["protection-solaire"], "Texture ultra-légère, absorption immédiate, sans traces.", { isNew: true }],
    ["Photoderm Nude Touch SPF50+", "bioderma", "solaire", "protection-visage", 62_000, null, "40 ml", ["protection-solaire", "acne"], "Effet peau nue, matifiant, teinte universelle."],
    ["Capital Soleil UV-Age Daily SPF50+", "vichy", "solaire", "protection-visage", 66_500, null, "40 ml", ["protection-solaire", "anti-age"], "Fluide anti-photovieillissement, hydratant et léger."],
    ["Vinosun Crème Protectrice SPF50", "caudalie", "solaire", "protection-visage", 79_000, null, "50 ml", ["protection-solaire", "anti-age"], "Filtres résistants à l'eau, antioxydante, respectueuse des océans."],
    ["Anthelios Lait Hydratant SPF50+", "la-roche-posay", "solaire", "protection-corps", 82_000, 92_000, "250 ml", ["protection-solaire"], "Très haute protection corps, résistant à l'eau et au sable."],
    ["Fluide Minéral Corps SPF50+", "avene", "solaire", "protection-corps", 76_000, null, "100 ml", ["protection-solaire", "peau-sensible"], "100 % filtres minéraux pour peaux intolérantes."],
    ["Photoderm Spray SPF50+", "bioderma", "solaire", "protection-corps", 69_000, null, "200 ml", ["protection-solaire"], "Spray invisible, application facile, toute la famille."],
    ["Posthelios Gel-Crème Après-Soleil", "la-roche-posay", "solaire", "apres-soleil", 42_000, null, "200 ml", ["hydratation"], "Répare, apaise et prolonge le bronzage."],
    ["Lait Après-Soleil Réparateur", "avene", "solaire", "apres-soleil", 39_900, null, "200 ml", ["peau-sensible"], "Apaise immédiatement les peaux échauffées."],
    ["Anthelios Dermo-Pediatrics Lait SPF50+", "la-roche-posay", "solaire", "enfants", 84_000, null, "250 ml", ["protection-solaire"], "Très haute protection dès 3 ans, hypoallergénique."],
    ["Pediatrics Fusion Water SPF50", "isdin", "solaire", "enfants", 72_000, null, "50 ml", ["protection-solaire"], "Formule pédiatrique testée sous contrôle, sans picotements."],
    // Bébé
    ["Gel Lavant Doux", "mustela", "bebe-maman", "toilette-bebe", 31_900, 35_500, "500 ml", ["peau-sensible"], "Corps et cheveux, dès la naissance, 90 % d'origine naturelle.", { featured: true }],
    ["Eau Nettoyante Sans Rinçage", "mustela", "bebe-maman", "toilette-bebe", 28_500, null, "300 ml", ["peau-sensible"], "Nettoie et adoucit visage, corps et siège sans rinçage."],
    ["ABCDerm Moussant", "bioderma", "bebe-maman", "toilette-bebe", 33_000, null, "1 L", ["peau-sensible"], "Nettoyant ultra-doux corps et cheveux, sans savon."],
    ["Crème Change 1-2-3", "mustela", "bebe-maman", "change", 24_900, null, "100 ml", ["peau-sensible"], "Prévient, apaise et répare les rougeurs du siège."],
    ["Cicalfate+ Crème Réparatrice", "avene", "bebe-maman", "change", 27_000, null, "100 ml", ["peau-sensible"], "Répare et assainit les irritations. Toute la famille."],
    ["Baume Corps Maternité", "mustela", "bebe-maman", "soins-maman", 58_000, null, "200 ml", ["hydratation"], "Nourrit intensément, améliore élasticité et confort."],
    // Compléments
    ["Arkovital Pure Energy", "arkopharma", "complements", "vitalite-immunite", 38_000, null, "30 comprimés", ["immunite"], "Multivitamines 100 % d'origine végétale."],
    ["Vitamine D3 2000 UI", "arkopharma", "complements", "vitalite-immunite", 27_500, null, "60 capsules", ["immunite"], "Soutient l'immunité et le capital osseux."],
    ["Arkogélules Ginseng Bio", "arkopharma", "complements", "vitalite-immunite", 32_000, 36_000, "45 gélules", ["immunite"], "Tonus physique et intellectuel en période de fatigue."],
    ["Arkorelax Sommeil Fort 8h", "arkopharma", "complements", "sommeil-stress", 44_000, null, "15 comprimés", ["sommeil"], "Mélatonine à libération prolongée pour une nuit complète.", { isNew: true }],
    ["Arkogélules Magnésium Marin", "arkopharma", "complements", "sommeil-stress", 29_900, null, "60 gélules", ["sommeil", "immunite"], "Réduit la fatigue et soutient le système nerveux."],
    ["Skin Booster Collagène", "filorga", "complements", "beaute-in-out", 79_000, null, "30 sticks", ["anti-age"], "Collagène marin et acide hyaluronique pour une peau repulpée."],
    ["Arkogélules Charbon Végétal", "arkopharma", "complements", "digestion", 24_000, null, "45 gélules", ["immunite"], "Confort digestif et ventre plat."],
    // Hygiène
    ["Dentifrice Sensibilité", "eucerin", "hygiene", "bucco-dentaire", 14_900, null, "75 ml", ["peau-sensible"], "Protection des dents sensibles au quotidien."],
    ["Gyn-Phy Gel Intime", "uriage", "hygiene", "hygiene-intime", 26_000, null, "500 ml", ["peau-sensible"], "Toilette intime quotidienne, pH physiologique."],
    ["Déodorant 48h Anti-Traces", "vichy", "hygiene", "deodorants", 31_500, 34_900, "50 ml", ["peau-sensible"], "Anti-transpirant efficace, sans traces blanches."],
    ["Déodorant Roll-on Douceur", "avene", "hygiene", "deodorants", 27_900, null, "50 ml", ["peau-sensible"], "Sans sels d'aluminium, pour peaux sensibles."],
    ["Cicaplast Baume B5+", "la-roche-posay", "hygiene", "premiers-soins", 32_900, null, "100 ml", ["peau-sensible", "peau-seche"], "Baume réparateur apaisant multi-usages, toute la famille.", { featured: true }],
    ["Bariéderm Cica Spray", "uriage", "hygiene", "premiers-soins", 29_000, null, "100 ml", ["peau-sensible"], "Assainit et répare les zones abîmées, sans contact."],
  ];

  const imgFor: Record<string, string> = { visage: "/images/u-visage.jpg", corps: "/images/u-corps.jpg", cheveux: "/images/u-cheveux.jpg", solaire: "/images/u-solaire.jpg", "bebe-maman": "/images/u-bebe.jpg", complements: "/images/u-complements.jpg", hygiene: "/images/u-hygiene.jpg" };
  const productIds: number[] = [];
  const ID_BY_NAME: Record<string, number> = {};
  let n = 1;
  for (const [name, brand, universe, cat, price, compare, vol, ks, short, opts] of P) {
    const stock = opts?.stock ?? (n % 11 === 0 ? 0 : n % 7 === 0 ? 3 : 12 + (n * 7) % 40);
    const ratingCount = 4 + (n * 13) % 90;
    const ratingAvg = 400 + (n * 37) % 95;
    const [p] = await db.insert(products).values({
      slug: slug(`${brand}-${name}`), sku: `CL-${String(n).padStart(4, "0")}`, name, shortDescription: short,
      description: `${short} Formulé avec une exigence pharmaceutique, ce soin ${brand === "arkopharma" ? "complément" : "dermo-cosmétique"} s'intègre dans une routine simple et efficace. Sélectionné et conseillé par les pharmaciens Cléopâtre.`,
      ingredients: universe === "complements" ? "Actifs d'origine contrôlée, gélule végétale (HPMC), sans OGM, sans gluten." : "Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Panthenol, Ceramide NP, Tocopherol, Allantoin. Sans parabènes.",
      howToUse: universe === "complements" ? "1 à 2 gélules par jour au cours d'un repas avec un grand verre d'eau. Cure de 1 à 3 mois." : universe === "solaire" ? "Appliquer généreusement 15 minutes avant l'exposition. Renouveler toutes les 2 heures et après chaque baignade." : "Appliquer matin et/ou soir sur peau propre et sèche, en massant délicatement jusqu'à absorption.",
      brandId: B[brand], categoryId: C[cat], universeId: U[universe], priceMillimes: price, compareAtMillimes: compare, stock, lowStockThreshold: 5,
      image: PRODUCT_IMAGES[name] ?? imgFor[universe], images: [PRODUCT_IMAGES[name] ?? imgFor[universe]], volume: vol, status: "active", isFeatured: !!opts?.featured, isNew: !!opts?.isNew || n % 9 === 0,
      ratingAvg, ratingCount, salesCount: (n * 17) % 220,
    }).returning({ id: products.id });
    productIds.push(p.id);
    ID_BY_NAME[name] = p.id;
    await db.insert(productConcerns).values(ks.map((k) => ({ productId: p.id, concernId: K[k] })));
    await db.insert(inventoryMovements).values({ productId: p.id, type: "in", quantity: stock, stockAfter: stock, reason: "Stock initial" });
    n++;
  }

  console.log("→ Merchandising (comptoir, tolérances, textures)");
  /* [name, counterPick, texture, forWhom, verified tolerances (sansParfum/grossesse/atopique/yeuxSensibles)] */
  type Merch = [pick?: boolean, texture?: string, forWhom?: string, tol?: ("sansParfum" | "grossesse" | "peauAtopique" | "yeuxSensibles")[]];
  const MERCH: Record<string, Merch> = {
    "Effaclar Gel Moussant Purifiant": [true, "Gel moussant purifiant", "Peaux grasses à tendance acnéique", ["sansParfum"]],
    "Toleriane Dermo-Nettoyant": [true, "Lait nettoyant doux", "Peaux intolérantes, réactives", ["sansParfum", "grossesse", "yeuxSensibles"]],
    "Sensibio H2O Eau Micellaire": [true, "Eau micellaire apaisante", "Peaux sensibles, démaquillage yeux", ["sansParfum", "grossesse", "peauAtopique", "yeuxSensibles"]],
    "Sébium Gel Moussant": [false, "Gel moussant régulant", "Peaux mixtes à grasses", ["sansParfum"]],
    "Hyalu B5 Sérum": [true, "Sérum repulpant", "Peaux déshydratées, premières rides", ["sansParfum"]],
    "Minéral 89 Booster Quotidien": [true, "Booster hydratant", "Toutes peaux, barrière fragilisée", ["sansParfum", "grossesse", "yeuxSensibles"]],
    "Vinoperfect Sérum Éclat": [false, "Sérum anti-taches", "Teint terne, hyperpigmentation", ["sansParfum"]],
    "Pure Vitamin C10 Sérum": [false, "Sérum antioxydant", "Éclat et fermeté, sans rétinol", ["grossesse"]],
    "Toleriane Sensitive Crème": [true, "Crème prébiotique", "Peaux sensibles, réactives", ["sansParfum", "grossesse", "peauAtopique"]],
    "Crème Hydratante Visage": [false, "Crème céramides légère", "Peaux normales à sèches", ["sansParfum", "grossesse", "peauAtopique"]],
    "Physiolift Yeux": [false, "Soin contour des yeux", "Rides et poches du regard", ["yeuxSensibles"]],
    "Hyalu B5 Yeux": [false, "Baume contour des yeux", "Cernes creusés, déshydratation", ["yeuxSensibles"]],
    "Effaclar Duo+ M": [true, "Soin anti-imperfections", "Boutons et marques, peaux grasses", ["sansParfum"]],
    "Sebiaclear Sérum": [false, "Sérum purifiant", "Imperfections et marques", ["sansParfum"]],
    "Lipikar Baume AP+M": [true, "Baume relipidant", "Peaux très sèches et atopiques", ["sansParfum", "grossesse", "peauAtopique"]],
    "XeraCalm A.D Crème Relipidante": [true, "Crème apaisante anti-démangeaison", "Peaux à tendance atopique", ["sansParfum", "peauAtopique"]],
    "Atoderm Intensive Baume": [true, "Baume anti-grattage", "Peaux atopiques, poussées sèches", ["sansParfum", "peauAtopique"]],
    "Lipikar Syndet AP+": [false, "Crème lavante sans savon", "Douche peaux atopiques", ["sansParfum", "peauAtopique"]],
    "Atoderm Huile de Douche": [false, "Huile lavante relipidante", "Peaux très sèches sous la douche", ["sansParfum", "peauAtopique"]],
    "Cicaplast Baume B5+": [true, "Baume réparateur", "Zones irritées, gerçures, tout âge", ["sansParfum", "grossesse", "peauAtopique", "yeuxSensibles"]],
    "Cicalfate+ Crème Réparatrice": [true, "Crème assainissante réparatrice", "Épiderme abîmé, change, tatouages", ["sansParfum", "grossesse"]],
    "Anthelios UVMune 400 Fluide Invisible SPF50+": [true, "Fluide solaire invisible", "Toutes peaux, hyperpigmentation", ["sansParfum", "grossesse"]],
    "Photoderm Nude Touch SPF50+": [false, "Solaire teinté matifiant", "Peaux mixtes à grasses au soleil", ["sansParfum"]],
    "Posthelios Gel-Crème Après-Soleil": [false, "Gel-crème after-sun", "Réparation post-exposition", ["sansParfum"]],
    "Shampooing à l'Avoine": [false, "Shampooing surgras doux", "Cuirs chevelus sensibles, usage fréquent", ["sansParfum"]],
    "Gel Lavant Doux": [true, "Gel lavant bébé sans savon", "Bébés, corps et cheveux", ["sansParfum", "grossesse"]],
    "Crème Change 1-2-3": [false, "Crème de change barrière", "Fesses rouges du nourrisson", ["sansParfum", "grossesse"]],
    "Vitamine D3 2000 UI": [true, "Complément vitaminé", "Carence d’ensoleillement, toute l’année", ["grossesse"]],
    "Gyn-Phy Gel Intime": [false, "Gel intime pH physiologique", "Hygiène intime quotidienne", ["sansParfum"]],
    "NCEF-Reverse Crème Suprême": [false, "Crème régénérante riche", "Signes de l’âge marqués", []],
  };
  for (const [name, [pick, texture, forWhom, tol]] of Object.entries(MERCH)) {
    const id = ID_BY_NAME[name];
    if (!id) continue;
    const tolerances = Object.fromEntries((tol ?? []).map((t) => [t, true]));
    await db.update(products).set({
      isCounterPick: !!pick,
      texture: texture ?? null,
      forWhom: forWhom ?? null,
      tolerances: Object.keys(tolerances).length ? tolerances : null,
    }).where(sql`${products.id} = ${id}`);
  }

  /* Nouveautés rail (P01): only what genuinely landed in the last 14 days.
     Older files get a launch date beyond the window so freshly-inserted
     createdAt values never masquerade as arrivals. */
  await db.execute(sql`UPDATE products SET launched_at = now() - interval '40 days'`);
  const JUST_IN: Record<string, number> = {
    "Sebiaclear Sérum": 3,
    "Crème Hydratante Visage": 6,
    "Minéral 89 Booster Quotidien": 9,
    "Baume Après-Shampooing à la Mangue": 12,
    "Photoderm Nude Touch SPF50+": 1,
  };
  for (const [name, days] of Object.entries(JUST_IN)) {
    const id = ID_BY_NAME[name];
    if (id) await db.update(products).set({ launchedAt: new Date(Date.now() - days * 86_400_000), isNew: true }).where(sql`${products.id} = ${id}`);
  }

  console.log("→ Pharmacist copy (P02 — pour qui, précautions, mode d'emploi)");
  /* Curated, office-typed, FR first (TN copy follows in translation passes):
     [audience, precautions, useWhen, useAmount, useOrder, keyActives] */
  type PdpCopy = [audience: string, precautions: string, useWhen?: string, useAmount?: string, useOrder?: string, actives?: string[]];
  const PDP: Record<string, PdpCopy> = {
    "Effaclar Gel Moussant Purifiant": [
      "Peaux grasses et à imperfections qui supportent mal les nettoyants décapants — ado comme adulte.",
      "Éviter le contour des yeux. Sous traitement anti-acné (isotrétinoïne, rétinoïdes locaux), la routine doit rester courte : demandez conseil.",
      "Matin et soir", "Noisette de la taille d'une pièce", "Premier geste, avant tout soin ciblé", ["Piroctone olamine", "Zinc", "Base lavante sans savon"]],
    "Effaclar Duo+ M": [
      "Boutons, marques et imperfections persistantes sur peau grasse. Convient dès l'adolescence.",
      "Actif, donc : un léger picotement les premiers jours est habituel. En cas de grossesse, préférez un soin plus doux — demandez conseil.",
      "Matin et/ou soir", "Un petit pois pour tout le visage — pas en touche locale", "Après le nettoyage, avant l'hydratation ; le SPF reste obligatoire de jour", ["Niacinamide", "Procerad", "Aqua Posae Filiformis"]],
    "Sensibio H2O Eau Micellaire": [
      "Peaux sensibles et intolérantes, démaquillage complet visage et yeux sans rinçage.",
      "Le coton doit glisser, pas frotter. Toute peau qui picote durablement après usage mérite un avis, pas un produit de plus.",
      "Le soir", "2 à 3 cotons imbibés", "Avant le soin de nuit ; suffisant comme seul nettoyage les jours où tout le reste pique", ["Ester d'acides gras", "Mannitol", "Xylitol"]],
    "Toleriane Dermo-Nettoyant": [
      "Peaux intolérantes et réactives, qui ne supportent ni eau calcaire ni mousse.",
      "Formule volontairement minimale : si la peau réagit encore ici, parlez-en en comptoir plutôt que d'insister.",
      "Matin et soir", "Deux pressions", "Premier geste — et parfois le seul utile", ["Niacinamide", "Céramides", "Eau thermale"]],
    "Toleriane Sensitive Crème": [
      "Hydratation quotidienne des peaux sensibles et réactives, seule ou en relais d'un traitement.",
      "Sur poussée d'eczéma ou lésion à vif, on consulte avant d'appliquer quoi que ce soit.",
      "Matin et soir", "Une noisette", "Dernier soin du visage le soir ; avant le SPF le matin", ["Prébiotiques", "Céramides", "Niacinamide"]],
    "Hyalu B5 Sérum": [
      "Peaux déshydratées, premières rides, teint terne — l'adulte à partir de la trentaine.",
      "Sans crème par-dessus, l'hydratation s'évapore : le sérum attire l'eau, une crème la retient.",
      "Matin et soir", "3 à 4 gouttes", "Après le nettoyage, avant la crème", ["Acide hyaluronique (2 poids moléculaires)", "Panthénol B5"]],
    "Minéral 89 Booster Quotidien": [
      "Toutes peaux, y compris réactives : renforcer la barrière face au stress, au climat ou aux traitements desséchants.",
      "Peut se porter seul les jours de peau en grève. En cas d'irritation qui persiste une semaine, consulter.",
      "Matin et soir", "2 à 3 gouttes", "Après le nettoyage, avant sérum ou crème", ["Eau volcanique de Vichy 89 %", "Glycérine"]],
    "Lipikar Baume AP+M": [
      "Peaux très sèches à atopiques, démangeaisons nocturnes. Nourrisson dès la naissance (hors prématuré).",
      "Sur croûtes jaunes ou suintement, une surinfection se traite d'abord : le baume ne suffit pas, consultez.",
      "1 à 2 fois par jour", "Généreuse : la peau doit rester souple une heure après", "Dans les 3 minutes après la douche, sur peau tiède séchée sans frotter", ["Aqua Posae Filiformis", "Beurre de karité", "Niacinamide"]],
    "Atoderm Intensive Baume": [
      "Poussées sèches avec grattage, visage et corps, toute la famille.",
      "Sur lésion ouverte, on demande d'abord conseil. Couper le cercle grattage-sécheresse passe aussi par des ongles courts.",
      "2 fois par jour", "Noisette par zone", "Sur peau propre, en insistant plis et mollets", ["Extrait de plantain", "Complexe biomimétique", "Glycérine végétale"]],
    "Cicaplast Baume B5+": [
      "Zones irritées, gerçures, rougeurs du change, peaux abîmées — pour toute la famille, du nourrisson à l'adulte.",
      "Usage externe uniquement. Sur brûlure étendue ou plaie, l'avis médical passe avant le baume.",
      "2 fois par jour", "Couche fine visible", "En dernier, par-dessus les soins, pour laisser réparer à l'abri", ["Panthénol 5 %", "Madécassoside", "Beurre de karité", "Zinc"]],
    "Cicalfate+ Crème Réparatrice": [
      "Épiderme abîmé qui a besoin d'être assaini : change, rasage, tatouage, gerçures.",
      "Sur plaie profonde ou zone chaude et douloureuse, le médecin passe avant la crème.",
      "2 fois par jour", "Couche fine", "Sur peau propre et sèche", ["Sucralfate", "Cuivre-zinc", "Eau thermale d'Avène"]],
    "Anthelios UVMune 400 Fluide Invisible SPF50+": [
      "Toutes les peaux, y compris à taches et sensibles — le filtre UVA très long change vraiment la donne contre le photovieillissement.",
      "Aucun écran ne protège douze heures : renouveler compte autant que l'indice. Ne pas laisser la boîte en voiture l'été.",
      "Chaque matin, toute l'année", "Deux doigts pour le visage", "Dernier geste du visage le matin", ["Mexoryl 400", "Airlicium"]],
    "Photoderm Nude Touch SPF50+": [
      "Peaux mixtes à grasses qui refusent le film blanc : solaire teinté matifiant, très bonne tenue sous masque.",
      "La teinte unifie mais ne couvre pas les yeux ; le soir, un démaquillage complet est indispensable.",
      "Le matin, en dernier soin", "Deux doigts", "Après le sérum hydratant, avant le maquillage", ["Filtres photostables", "Vitamine E", "Gluconate de zinc"]],
    "Gel Lavant Doux": [
      "Dès la naissance, corps et cheveux — le bain tout doux que les parents gardent toute l'année.",
      "Éviter les yeux. Croûtes de lait ou plis rouges persistants : on en parle au pharmacien ou au médecin.",
      "Chaque bain", "Une noisette dans la main", "Sur peau mouillée, rincer puis sécher sans frotter ; le change vient après", ["Perséose d'avocat", "Glycérine d'origine végétale"]],
    "Crème Change 1-2-3": [
      "Rougeurs du siège du nourrisson : en prévention à chaque change, en cure courte dès les premières marques.",
      "Éruption à satellites ou fièvre ? Possible infection : le médecin d'abord, la crème ensuite.",
      "À chaque change", "Couche épaisse qui reste visible", "Nettoyer, sécher soigneusement, appliquer à la main", ["Extrait d'avoine", "Oxétholine", "Pantothonate"]],
    "Arkogélules Magnésium Marin": [
      "Fatigue, contractures, sommeil agité de l'adulte — cures d'un à trois mois.",
      "Insuffisance rénale ou antibiotiques (tétracyclines, fluoroquinolones) : espacer de deux heures et demander conseil.",
      "Le soir au dîner", "3 gélules (adulte)", "Pendant le repas, avec un grand verre d'eau", ["Oxyde de magnésium marin", "Vitamine B6"]],
    "Arkorelax Sommeil Fort 8h": [
      "Endormissement difficile et réveils nocturnes de l'adulte — mélatonine à libération prolongée.",
      "Ne pas conduire moins de 8 h après la prise. Sédatifs, grossesse, allaitement : avis médical d'abord.",
      "Au coucher", "1 comprimé", "30 minutes avant le coucher, écran en veille", ["Mélatonine LP", "Passiflore", "Verveine"]],
    "Vitamine D3 2000 UI": [
      "L'adulte, y compris sous notre soleil : carence fréquente malgré l'ensoleillement (écran total, intérieur).",
      "2 000 UI/j est la dose usuelle. Si un bilan a déjà lancé une dose plus forte, ne pas cumuler sans avis médical. Enfant : dose pédiatrique spécifique.",
      "Le matin", "1 capsule", "Pendant le petit-déjeuner, avec un corps gras", ["Cholécalciférol D3", "Huile de colza"]],
    "Arkogélules Ginseng Bio": [
      "Coups de barre et fatigue passagère de l'adulte actif — cures courtes de 10 à 20 jours.",
      "Hypertension, troubles du rythme, grossesse, allaitement, diabète traité : déconseillé sans avis. Jamais après 16 h.",
      "Le matin", "2 gélules", "Au petit-déjeuner", ["Panax ginseng bio (racine)"]],
    "Gyn-Phy Gel Intime": [
      "Toilette intime quotidienne, pH respecté — périodes de règles, après le sport, voyages.",
      "Uniquement externe. Démangeaisons ou pertes inhabituelles : un gel ne traite pas une infection, consultez.",
      "Une fois par jour", "Un bouchon", "À la douche, rincé à l'eau claire puis séché soigneusement", ["Extraits de camomille", "Panthénol"]],
  };
  for (const [name, [audience, precautions, useWhen, useAmount, useOrder, actives]] of Object.entries(PDP)) {
    const id = ID_BY_NAME[name];
    if (!id) continue;
    await db.update(products).set({
      audience, precautions, useWhen: useWhen ?? null, useAmount: useAmount ?? null, useOrder: useOrder ?? null,
      keyActives: actives ?? [],
    }).where(sql`${products.id} = ${id}`);
  }
  /* Any supplement without curated precautions still deserves the honest one —
     it is true of the whole family of products. */
  await db.update(products).set({ precautions: "Complément alimentaire : il ne remplace pas une alimentation variée. Grossesse, allaitement ou traitement en cours — demandez conseil avant d'ouvrir la boîte." })
    .where(sql`universe_id = ${U.complements} and precautions is null`);

  /* Per-location stock, split from the real figure — only for counter-flagship
     products the office can actually check. Rows always sum to products.stock. */
  const LOCATED = ["Sensibio H2O Eau Micellaire", "Effaclar Gel Moussant Purifiant", "Effaclar Duo+ M", "Toleriane Sensitive Crème", "Hyalu B5 Sérum", "Lipikar Baume AP+M", "Cicaplast Baume B5+", "Anthelios UVMune 400 Fluide Invisible SPF50+", "Gel Lavant Doux", "Vitamine D3 2000 UI", "Cicalfate+ Crème Réparatrice", "Gyn-Phy Gel Intime"];
  await db.execute(sql`
    UPDATE products SET location_stock = jsonb_build_object(
      'ezzahra', GREATEST(floor(stock * 0.6)::int, 0),
      'hammamLif', GREATEST(floor(stock * 0.25)::int, 0),
      'entrepot', GREATEST(stock - floor(stock * 0.6) - floor(stock * 0.25), 0))
    WHERE stock > 0 AND ${inArray(products.name, LOCATED)}`);

  console.log("→ Souvent associé (P02 pairs)");
  const PAIRS: [string, string, string][] = [
    ["Sensibio H2O Eau Micellaire", "Toleriane Sensitive Crème", "Après l'eau micellaire, la crème prébiotique qui referme la soirée des peaux sensibles."],
    ["Effaclar Gel Moussant Purifiant", "Effaclar Duo+ M", "Nettoyage puis soin ciblé : la routine anti-imperfections complète, validée au comptoir."],
    ["Hyalu B5 Sérum", "Cicaplast Baume B5+", "Le sérum repulpe, le baume scelle — l'hiver, les deux marchent ensemble."],
    ["Minéral 89 Booster Quotidien", "Anthelios UVMune 400 Fluide Invisible SPF50+", "Renforcer la barrière le matin, la protéger juste après."],
    ["Lipikar Syndet AP+", "Lipikar Baume AP+M", "La douche ne décape plus, le baume prolonge : le rituel atopique complet."],
    ["Atoderm Intensive Baume", "Atoderm Huile de Douche", "L'huile lave sans tirer, le baume coupe le cercle du grattage."],
    ["Gel Lavant Doux", "Crème Change 1-2-3", "Le bain du soir, puis la barrière de la nuit : le duo sans rougeurs."],
    ["Arkogélules Magnésium Marin", "Arkorelax Sommeil Fort 8h", "Le magnésium détend le corps, la mélatonine cale l'heure du sommeil."],
    ["Anthelios UVMune 400 Fluide Invisible SPF50+", "Posthelios Gel-Crème Après-Soleil", "L'écran le matin, la réparation le soir — la Méditerranée se respecte."],
    ["Toleriane Dermo-Nettoyant", "Toleriane Sensitive Crème", "Nettoyage sans eau calcaire puis crème apaisée : la routine en deux gestes."],
  ];
  for (const [a, b, reason] of PAIRS) {
    const ida = ID_BY_NAME[a], idb = ID_BY_NAME[b];
    if (!ida || !idb) continue;
    await db.insert(productPairs).values([
      { productId: ida, pairProductId: idb, reason, position: 1 },
      { productId: idb, pairProductId: ida, reason, position: 1 },
    ]).onConflictDoNothing();
  }

  console.log("→ Seasonal shelves (vitrines de saison)");
  const shelfRows = await db.insert(shelves).values([
    {
      title: { fr: "Le bon réflexe solaire", tn: "El-wajeb es-solaire", tna: "الواقي الشمسي" },
      subtitle: { fr: "En Tunisie, le SPF 50 est un geste quotidien d’avril à septembre — pas une réservation de plage.", tn: "Fi Touns, SPF 50 3adi youmî men avril l’setmbre.", tna: "في تونس، واقي الشمس عادة يومية من أفريل لسبتمبر." },
      startMonth: 4, endMonth: 9,
      productIds: ["Anthelios UVMune 400 Fluide Invisible SPF50+", "Photoderm Nude Touch SPF50+", "Capital Soleil UV-Age Daily SPF50+", "Posthelios Gel-Crème Après-Soleil"].map((nm) => ID_BY_NAME[nm]).filter(Boolean),
      isActive: true,
    },
    {
      title: { fr: "Peaux sèches, hiver qui tire", tn: "Ejled yabes wech-chta", tna: "جلد ناشف والشتا" },
      subtitle: { fr: "Octobre à mars, on remonte la teneur en lipides : baumes relipidants et huiles de douche.", tn: "Men octobre l’mars, nzidou fi ej-lipides: baum w-zeît ed-douch.", tna: "من أكتوبر للمارص، نزيدو في الدهون: بلسم وزيت الدوش." },
      startMonth: 10, endMonth: 3,
      productIds: ["Lipikar Baume AP+M", "XeraCalm A.D Crème Relipidante", "Atoderm Intensive Baume", "Atoderm Huile de Douche"].map((nm) => ID_BY_NAME[nm]).filter(Boolean),
      isActive: true,
    },
  ]).returning();
  void shelfRows;

  console.log("→ Brand hero SKUs");
  const HERO: Record<string, string[]> = {
    "la-roche-posay": ["Anthelios UVMune 400 Fluide Invisible SPF50+", "Hyalu B5 Sérum", "Effaclar Duo+ M"],
    "avene": ["XeraCalm A.D Crème Relipidante", "Cicalfate+ Crème Réparatrice", "Hydrance Aqua-Gel"],
    "bioderma": ["Sensibio H2O Eau Micellaire", "Atoderm Intensive Baume", "Sébium Gel Moussant"],
    "vichy": ["Minéral 89 Booster Quotidien", "Capital Soleil UV-Age Daily SPF50+", "Dercos Aminexil Clinical 5 Femme"],
    "mustela": ["Gel Lavant Doux", "Crème Change 1-2-3", "Huile Vergetures Bio"],
  };
  for (const [brandSlug, names] of Object.entries(HERO)) {
    const bid = B[brandSlug];
    if (!bid) continue;
    const ids = names.map((nm) => ID_BY_NAME[nm]).filter(Boolean).slice(0, 3);
    if (ids.length) await db.update(brands).set({ heroProductIds: ids }).where(sql`${brands.slug} = ${brandSlug}`);
  }

  console.log("→ Routine strips (besoin → rituel)");
  const ROUTINES: Record<string, { pos: number; name: string; label: { fr: string; tn: string; tna: string }; reason: { fr: string; tn: string; tna: string } }[]> = {
    "peau-sensible": [
      { pos: 1, name: "Toleriane Dermo-Nettoyant", label: { fr: "Nettoyer", tn: "Nettoyer", tna: "تنظيف" }, reason: { fr: "Un lait qui démaquille sans frotter — la mousse est l’ennemie ici.", tn: "Lait ynaddhef bla ma t7akk — el moûssa hiya l-3edou.", tna: "حليب ينظّف بلا حكّة — الرغوة هي العدوّ." } },
      { pos: 2, name: "Toleriane Sensitive Crème", label: { fr: "Apaiser", tn: "Heddi", tna: "تهدئة" }, reason: { fr: "Prébiotiques et niacinamide pour repeupler une barrière épuisée.", tn: "Prébiotiques w niacinamide bech tjibed el barrière.", tna: "بريبيوتيكات ونياسيناميد باش تجبّد الحاجز." } },
      { pos: 3, name: "Anthelios UVMune 400 Fluide Invisible SPF50+", label: { fr: "Protéger", tn: "Elli ḥmi", tna: "حماية" }, reason: { fr: "Le filtre le plus large du marché, invisible sur les peaux qui rougissent.", tn: "Ech-filtre el wsî3 9oddâr, maybench 3la ejjeld el ye7mâr.", tna: "الفلتر الأوسع، ما باينش على الجلد اللي يحمر." } },
    ],
    "hydratation": [
      { pos: 1, name: "Sensibio H2O Eau Micellaire", label: { fr: "Préparer", tn: "Ejjiyez", tna: "تحضير" }, reason: { fr: "Une peau propre boit mieux ; on commence par l’eau, jamais par le savon.", tn: "Ejled nadhif yechrob a7sen — nebdaw bel mâ, mach bel ṣâboun.", tna: "جلد نظيف يشرب أحسن — نبداو بالماء، ماشي بالصابون." } },
      { pos: 2, name: "Hyalu B5 Sérum", label: { fr: "Repulper", tn: "Ejbed", tna: "ترطيب" }, reason: { fr: "Deux acides hyaluroniques : l’un de surface, l’autre qui tient la journée.", tn: "Zouz acide hyaluronique — wâ7ed fel sbe7 we wâ7ed ykhalle9.", tna: "زوج حمض هيالورونيك — واحد بالسبح والآخر يطبّل." } },
      { pos: 3, name: "Toleriane Sensitive Crème", label: { fr: "Sceller", tn: "Sed del", tna: "حبس" }, reason: { fr: "Le film crème qui empêche l’eau de repartir avant la nuit.", tn: "El film el crème li ymnâ3 el mâ yerou7.", tna: "غشاء الكريم يمنع الماء يروح." } },
    ],
  };
  for (const [concernSlug, steps] of Object.entries(ROUTINES)) {
    const cid = K[concernSlug];
    if (!cid) continue;
    for (const st of steps) {
      const pid = ID_BY_NAME[st.name];
      if (!pid) continue;
      await db.insert(routineSteps).values({ concernId: cid, position: st.pos, productId: pid, label: st.label, reason: st.reason });
    }
  }

  console.log("→ Out-of-stock substitutions & duos");
  const SUBS: { for: string; by: string; why: { fr: string; tn?: string; tna?: string } }[] = [
    { for: "Effaclar Duo+ M", by: "Sebiaclear Sérum", why: { fr: "Même objectif — imperfections et marques — avec un sérum SVR très bien toléré.", tn: "Nefs el hadaf — les imperfections wel marques — b-serum SVR yet7ammalo jeldek.", tna: "نفس الهدف — الحباب والأثر — بسيروم SVR يتحمّله جلدك." } },
    { for: "Crème Change 1-2-3", by: "Cicalfate+ Crème Réparatrice", why: { fr: "En attendant le réassort, Avène Cicalfate+ assure le change, assainit et répare.", tn: "Famma Cicalfate+ Avène yetkafef bel change, yessanne wel yerba3 7ta yrja3 el stock.", tna: "كية Cicalfate+ أفان يكلّف بالتغيير، يسنّي ويربّع حتى يراجع الستوك." } },
    { for: "Shampooing au Lait de Papyrus", by: "Shampooing à l'Avoine", why: { fr: "Deux shampooings doux ; celui à l’avoine convient même aux cuirs chevelus réactifs.", tn: "Zouz champooings 9sîra — wel âïne yen9aḍ7ta lel 9awra el 7essâsa.", tna: "زوج شامبوانغ لطافين — والشوفان ينقص حتى للفروة الحسّاسة." } },
  ];
  for (const [i, x] of SUBS.entries()) {
    const a = ID_BY_NAME[x.for], b = ID_BY_NAME[x.by];
    if (a && b && a !== b) await db.insert(productSubstitutes).values({ productId: a, substituteProductId: b, position: i + 1, reason: x.why });
  }
  await db.insert(duos).values([
    {
      slug: "duo-nettoyant-toleriane", name: { fr: "Duo peau nette & apaisée", tn: "Duo ejled na7iyya", tna: "ديو جلد نقيّة" },
      note: "Le nettoyage Toleriane et le soin Sébium : la routine des peaux mixtes qui tiraillent par endroits.",
      productIdA: ID_BY_NAME["Toleriane Dermo-Nettoyant"], productIdB: ID_BY_NAME["Sébium Gel Moussant"],
      discountMillimes: 4_000, isActive: true,
    },
    {
      slug: "duo-reparation-famille", name: { fr: "Duo réparation famille", tn: "Duo terebbee3 el âïla", tna: "ديو تربيع العائلة" },
      note: "Cicaplast et Cicalfate+ : deux baumes pour toutes les irritations de la maison, du change aux gerçures.",
      productIdA: ID_BY_NAME["Cicaplast Baume B5+"], productIdB: ID_BY_NAME["Cicalfate+ Crème Réparatrice"],
      discountMillimes: 5_000, isActive: true,
    },
  ]);

  console.log("→ Promotions");
  await db.insert(promotions).values([
    { code: "BIENVENUE10", label: "-10 % sur votre première commande", type: "percent", value: 10, minSubtotalMillimes: 50_000, maxDiscountMillimes: 30_000, perUserLimit: 1 },
    { code: "SOLAIRE15", label: "-15 % sur l'univers Solaire", type: "percent", value: 15, minSubtotalMillimes: 0, universeId: U["solaire"], perUserLimit: 0 },
    { code: "LIVRAISON", label: "Livraison offerte", type: "free_shipping", value: 0, minSubtotalMillimes: 40_000, perUserLimit: 0 },
    { code: "CLEO20", label: "20 DT offerts dès 150 DT", type: "fixed", value: 20_000, minSubtotalMillimes: 150_000, perUserLimit: 2, usageLimit: 200 },
    { code: "ETE2024", label: "Offre expirée", type: "percent", value: 20, isActive: false, endsAt: new Date("2024-09-01") },
  ]);

  console.log("→ Stores");
  const storeRows = await db.insert(stores).values([
    { slug: "ezzahra", name: "Cléopâtre Ezzahra", address: "Avenue Habib Bourguiba, face à la municipalité", city: "Ezzahra", phone: "71450210", hours: "Lun–Sam 8h30–20h30 · Dim 9h–14h", mapsUrl: "https://maps.google.com/?q=Ezzahra+Tunisie" },
    { slug: "hammam-lif", name: "Cléopâtre Hammam-Lif", address: "Rue de la République, centre-ville", city: "Hammam-Lif", phone: "71290345", hours: "Lun–Sam 8h30–20h · Dim 9h–13h", mapsUrl: "https://maps.google.com/?q=Hammam-Lif+Tunisie" },
  ]).returning({ id: stores.id, slug: stores.slug });
  const STORE_IDS: Record<string, number> = Object.fromEntries(storeRows.map((r) => [r.slug, r.id]));
  /** Undated lots land where the office actually opens cartons, deterministically. */
  const storeIdForUndated = (id: number) => (id % 2 === 0 ? "ezzahra" : "hammamLif");

  console.log("→ Orders");
  const addr = { fullName: "Ines Mansour", phone: "22345678", line1: "12 rue des Jasmins", city: "Ezzahra", governorate: "Ben Arous", postalCode: "2034" };
  const sample = [
    { number: "CL-240912-A1F3", status: "delivered" as const, days: 40, items: [[0, 1], [5, 1]] as [number, number][], promo: "BIENVENUE10" },
    { number: "CL-241003-B7C2", status: "shipped" as const, days: 3, items: [[26, 1], [39, 2]] as [number, number][], promo: null },
    { number: "CL-241010-D9E4", status: "pending" as const, days: 0, items: [[50, 1]] as [number, number][], promo: null },
  ];
  for (const s of sample) {
    const rows = await db.select().from(products).where(sql`id IN ${s.items.map(([i]) => productIds[i])}`);
    const lines = s.items.map(([i, q]) => { const p = rows.find((r) => r.id === productIds[i])!; return { p, q }; });
    const subtotal = lines.reduce((a, l) => a + l.p.priceMillimes * l.q, 0);
    const discount = s.promo ? Math.min(Math.floor(subtotal * 0.1), 30_000) : 0;
    const shipping = subtotal >= 99_000 ? 0 : 7_000;
    const created = new Date(Date.now() - s.days * 86_400_000);
    const [o] = await db.insert(orders).values({
      number: s.number, userId: customer.id, email: customer.email, phone: "22345678", status: s.status, paymentMethod: "cod",
      paymentStatus: s.status === "delivered" ? "paid" : "pending", shippingMethod: "standard", shippingAddress: addr,
      subtotalMillimes: subtotal, discountMillimes: discount, shippingMillimes: shipping, totalMillimes: subtotal - discount + shipping,
      promoCode: s.promo, createdAt: created, updatedAt: created, trackingCode: s.status === "shipped" ? "TN-4471-8820" : null,
    }).returning();
    await db.insert(orderItems).values(lines.map((l) => ({ orderId: o.id, productId: l.p.id, name: l.p.name, sku: l.p.sku, brandName: brandRows.find((b) => b.id === l.p.brandId)?.name, image: l.p.image, unitPriceMillimes: l.p.priceMillimes, quantity: l.q, lineTotalMillimes: l.p.priceMillimes * l.q })));
    const flow = ["pending", "confirmed", "preparing", "shipped", "delivered"] as const;
    const idx = flow.indexOf(s.status as (typeof flow)[number]);
    const msgs = ["Commande reçue", "Commande confirmée par notre équipe", "Préparation en cours en boutique", "Colis remis au transporteur", "Colis livré"];
    for (let i = 0; i <= idx; i++) {
      await db.insert(orderEvents).values({ orderId: o.id, status: flow[i], message: msgs[i], createdAt: new Date(created.getTime() + i * 6 * 3_600_000) });
    }
  }

  console.log("→ Reviews");
  const reviewTexts = [
    ["Texture parfaite", "Une texture légère qui pénètre vite. Ma peau est apaisée dès la première semaine.", 5],
    ["Efficace et doux", "Très bon rapport qualité-prix. Livraison rapide à Ezzahra, colis soigné.", 4],
    ["Je recommande", "Conseillé par la pharmacienne en boutique, je ne regrette pas. Résultat visible.", 5],
    ["Bien mais parfumé", "Efficace, mais j'aurais préféré une version sans parfum.", 3],
    ["Indispensable", "Je rachète à chaque fois. Le produit est authentique, date de péremption longue.", 5],
  ] as const;
  const names = ["Amira B.", "Yasmine K.", "Mehdi T.", "Salma R.", "Rim H.", "Khaled M."];
  let r = 0;
  for (const pid of productIds) {
    if (r % 2 === 0) {
      const [title, body, rating] = reviewTexts[r % reviewTexts.length];
      await db.insert(reviews).values({ productId: pid, authorName: names[r % names.length], rating, title, body, status: "approved", isVerified: true, userId: r % 4 === 0 ? customer.id : null });
    }
    if (r % 9 === 0) {
      await db.insert(reviews).values({ productId: pid, authorName: names[(r + 2) % names.length], rating: 4, title: "En attente", body: "Très satisfaite de ce produit, l'emballage était impeccable.", status: "pending" });
    }
    r++;
  }

  console.log("→ Articles");
  await db.insert(articles).values([
    { slug: "routine-minimaliste-peau-sensible", title: "La routine minimaliste pour peau sensible", tag: "Visage", author: "Ines Belkadi", authorRole: "Préparatrice en pharmacie, comptoir Ezzahra", readMinutes: 5, image: "/images/u-visage.jpg", excerpt: "Trois gestes, pas un de plus. Comment simplifier pour apaiser durablement.", body: "Une peau sensible ne demande pas plus de produits, mais moins d'ingrédients.\n\nLe matin : un nettoyage à l'eau ou avec une eau micellaire douce, puis un hydratant sans parfum et un SPF 50+.\n\nLe soir : un nettoyant sans savon, puis le même hydratant. Une fois par semaine, un masque apaisant si besoin.\n\nÉvitez les gommages mécaniques, les huiles essentielles et l'alcool dénaturé. En cas de doute, demandez conseil à nos pharmaciens en boutique." },
    { slug: "choisir-sa-protection-solaire-en-tunisie", title: "Choisir sa protection solaire en Tunisie", tag: "Solaire", author: "Dr. Amine Trabelsi", authorRole: "Pharmacien d’officine", readMinutes: 6, image: "/images/u-solaire.jpg", excerpt: "Indice, texture, résistance à l'eau : le guide honnête pour un été serein.", body: "Sous nos latitudes, l'indice UV dépasse 9 de mai à septembre. Le SPF 50+ n'est pas un luxe.\n\nPour le visage, privilégiez un fluide invisible ou une texture teintée si vous avez des taches. Pour le corps, un lait ou un spray résistant à l'eau.\n\nLa quantité compte plus que la marque : deux doigts pour le visage, renouvelés toutes les deux heures.\n\nLes enfants ont besoin de formules pédiatriques, testées sur peaux fragiles, et d'ombre entre 12h et 16h." },
    { slug: "chute-de-cheveux-saisonniere", title: "Chute de cheveux saisonnière : agir sans paniquer", tag: "Cheveux", author: "Ines Belkadi", authorRole: "Préparatrice en pharmacie", readMinutes: 4, image: "/images/u-cheveux.jpg", excerpt: "À l'automne, perdre jusqu'à 100 cheveux par jour est normal. Voici quand et comment agir.", body: "La chute saisonnière dure 4 à 6 semaines. Au-delà, ou si elle s'accompagne d'une fatigue inhabituelle, un bilan sanguin s'impose.\n\nUne cure de 3 mois associant un complément (biotine, zinc, fer si carence) et un sérum stimulant donne les meilleurs résultats.\n\nLavez vos cheveux avec un shampooing doux, sans frotter le cuir chevelu, et limitez la chaleur." },
    { slug: "vitamine-d-en-hiver", title: "Vitamine D : pourquoi en manquer même au soleil", tag: "Compléments", author: "Dr. Amine Trabelsi", authorRole: "Pharmacien d’officine", readMinutes: 3, image: "/images/u-complements.jpg", excerpt: "Paradoxe méditerranéen : ensoleillés mais carencés. Ce que disent les pharmaciens.", body: "Entre la protection solaire, les vêtements couvrants et la vie en intérieur, une majorité d'adultes présente un taux insuffisant en hiver.\n\nUne supplémentation quotidienne de 1000 à 2000 UI est simple, sûre et bien tolérée. Demandez conseil pour adapter la dose." },
  ]);

  console.log("→ Experience (rituels, abonnement, liste partagée, journal lié)");
  const byProdSlug = (sl: string) => db.select({ id: products.id }).from(products).where(sql`${products.slug} = ${sl}`).limit(1).then((r) => r[0]?.id ?? 0);
  const sSensibio = await byProdSlug("bioderma-sensibio-h2o-eau-micellaire");
  const sHyalu = await byProdSlug("la-roche-posay-hyalu-b5-serum");
  const sLipikar = await byProdSlug("la-roche-posay-lipikar-baume-apm");
  const sAnthelios = await byProdSlug("la-roche-posay-anthelios-uvmune-400-fluide-invisible-spf50");
  const sToleriane = await byProdSlug("la-roche-posay-toleriane-dermo-nettoyant");
  const sTolerianeC = await byProdSlug("la-roche-posay-toleriane-sensitive-creme");

  // Inès's rituals — one morning, one evening, an active subscription.
  const [rit1] = await db.insert(rituals).values({
    userId: customer.id, name: "Rituel du matin", moment: "morning", season: "Printemps",
    items: [{ productId: sToleriane }, { productId: sHyalu }].filter((x) => x.productId),
    reminderEnabled: true, reminderHour: 8, reminderDays: 127,
  }).returning({ id: rituals.id });
  await db.insert(rituals).values({
    userId: customer.id, name: "Rituel du soir", moment: "evening", season: null,
    items: [{ productId: sSensibio }, { productId: sTolerianeC }].filter((x) => x.productId),
  });
  await db.insert(rituals).values({
    userId: customer.id, name: "Rituel de voyage", moment: "morning", season: "Voyage",
    items: [{ productId: sAnthelios }].filter((x) => x.productId),
  });
  void rit1;
  const [sub] = await db.insert(subscriptions).values({ userId: customer.id, frequencyDays: 30, nextDueAt: new Date(Date.now() + 30 * 86_400_000) }).returning({ id: subscriptions.id });
  if (sSensibio) await db.insert(subscriptionItems).values({ subscriptionId: sub.id, productId: sSensibio, quantity: 1 });
  if (sLipikar) await db.insert(subscriptionItems).values({ subscriptionId: sub.id, productId: sLipikar, quantity: 1 });
  await db.insert(subscriptionEvents).values({ subscriptionId: sub.id, type: "created", detail: "Abonnement de démonstration" });
  await db.insert(diagnostics).values({ userId: customer.id, answers: { skin: "sensitive", concern: "hydratation", hair: "none", texture: "light", budget: "m" }, productIds: [sHyalu, sSensibio].filter(Boolean) });

  // A shared wishlist link (for the demo: Aïcha's birthday list).
  const shareToken = "demo-partage-2026";
  await db.insert(wishlistShares).values({ userId: customer.id, token: shareToken, label: "Anniversaire d'Inès — la liste douce", message: "Trois gestes qui me font du bien, si l'envie vous prend." });

  // Favorites for Inès (with one gift note), for the shared-list demo.
  for (const [pid, note] of [[sHyalu, null], [sLipikar, "celui de maman"], [sAnthelios, null]] as [number, string | null][]) {
    if (pid) await db.insert(wishlistItems).values({ userId: customer.id, productId: pid, note });
  }
  if (sSensibio) await db.insert(wishlistItems).values({ userId: 4, productId: sSensibio, note: null });

  // Rania, the Tunisian-language demo customer: a ritual + a restock alert.
  await db.insert(rituals).values({ userId: 4, name: "روتين الصباح", moment: "morning", items: [{ productId: sSensibio }].filter((x) => x.productId) });
  await db.insert(restockAlerts).values({ productId: sAnthelios, userId: 4, email: "client.tn@cleopatre.tn", channel: "whatsapp", locale: "tn" });

  // Journal ↔ commerce: what each article stands behind.
  const arts = await db.select({ id: articles.id, slug: articles.slug }).from(articles);
  const link: Record<string, [number, string][]> = {
    "routine-minimaliste-peau-sensible": [
      [sToleriane, "Le démaquillage sans frotter, première étape de toute routine apaisante."],
      [sTolerianeC, "L'hydratant prébiotique, à lui seul une routine."],
      [sSensibio, "L'eau micellaire qui a tout commencé."],
    ],
    "choisir-sa-protection-solaire-en-tunisie": [[sAnthelios, "Le fluide invisible — deux doigts, chaque matin."]],
    "chute-de-cheveux-saisonniere": [
      [await byProdSlug("ducray-anaphase+-shampooing".replace("+", "-").replace("--", "-")), "Le shampooing complément, en cure de trois mois."],
      [await byProdSlug("ducray-forcapil-cheveux-ongles"), "Biotine, zinc et vitamines B pour tenir la cure."],
    ],
    "vitamine-d-en-hiver": [[await byProdSlug("arkopharma-vitamine-d3-2000-ui"), "Mille unités par jour, la dose simple et sûre."]],
  };
  for (const art of arts) {
    const pairs = link[art.slug] ?? [];
    for (const [pid, note] of pairs) if (pid) await db.insert(articleProducts).values({ articleId: art.id, productId: pid, note: note ?? null });
  }

  // A demo conversation in the support thread.
  const [tk] = await db.insert(supportTickets).values({
    userId: customer.id, email: customer.email, name: "Ines Mansour", type: "delivery", priority: "normal",
    subject: "Livraison de ma commande CL-240912", message: "Est-ce que le colis peut être déposé chez ma sœur à Hammam-Lif plutôt ?",
    status: "in_progress", reply: "Bonjour Inès, oui — répondez simplement à ce message avec l'adresse, nous l'ajoutons au bordereau. Toute l'équipe.", orderNumber: "CL-240912-A1F3",
  }).returning({ id: supportTickets.id });
  await db.insert(ticketMessages).values([
    { ticketId: tk.id, userId: customer.id, authorName: "Ines Mansour", body: "Est-ce que le colis peut être déposé chez ma sœur à Hammam-Lif plutôt ?" },
    { ticketId: tk.id, userId: null, authorName: "Sami (support)", body: "Bonjour Inès, oui — répondez simplement à ce message avec l'adresse, nous l'ajoutons au bordereau." },
  ]);

  // Prompt 15 — the search log's correction side, with two honest cases from
  // the real catalogue: a brand people ask for that we sell by prescription
  // ethics (never online), and a syndet caught in a restock.
  await db.insert(queryLandings).values([
    {
      query: "vitreine",
      label: "L’isotrétinoïne (Curacné, Roaccutane) est un médicament sur ordonnance, dispensé en pharmacie d’officine — jamais en ligne. Nos pharmaciens vous orientent et répondent le jour même.",
      href: "/aide?type=product_question",
      kind: "zero",
    },
    {
      query: "lipikar syndet",
      label: "Le syndet Lipikar AP+ repasse au réassort — en attendant, le baume Lipikar AP+M apaise les mêmes peaux atopiques, en rayon aujourd’hui.",
      href: "/produit/la-roche-posay-lipikar-baume-ap-m",
      kind: "oos",
    },
  ]);

  console.log("→ Historique (210 jours — commandes, mouvements, avis, télémetrie)");
  const hist = await seedHistory();
  console.log(`  · ${hist.orders} commandes · ${hist.events} événements · ${hist.reviews} avis · ${hist.customers} clientes`);

  /* ══ LES LOTS — the shelf, dated ═══════════════════════════════════════════
     A pharmacy does not have "stock": it has boxes with dates on them. This
     step builds the shelf *under* the stock figure — every sellable unit gets
     a lot, a date and a counter, and the product row is then rewritten to be
     exactly the sum of what is sellable. Every unit the lot table cannot
     explain becomes visible in /admin/lots rather than hidden in a number.

     Three states are seeded on purpose, because a demo that only shows the
     happy path teaches nothing:
       · dated lots, spread from 4 months to 3 years, so FEFO has work to do;
       · a handful of lots inside the alert windows;
       · a few undated lots (« DLC non communiquée ») and a few already past —
         both of which exist on any real shelf the day nobody looked. */
  console.log("→ Lots & dates de péremption");
  const [entrepot] = await db.insert(stores).values({
    slug: "entrepot",
    name: "Entrepôt Cléopâtre",
    address: "Zone industrielle, Ezzahra",
    city: "Ezzahra",
    phone: "71450210",
    hours: "Réserve — non ouvert au public",
    isActive: false,
  }).returning({ id: stores.id });

  const allProducts = await db.execute(sql`
    SELECT id, name, sku, universe_id, stock, volume, ingredients, category_id
      FROM products ORDER BY id ASC`);
  const rows = allProducts.rows as Array<{ id: number; name: string; sku: string; universe_id: number | null; stock: number; volume: string | null; ingredients: string | null; category_id: number | null }>;

  const PAO_BY_UNIVERSE: Record<number, number> = {
    [U.complements]: 24,
    [U.solaire]: 12,
    [U.hygiene]: 12,
    [U["bebe-maman"]]: 12,
    [U.cheveux]: 12,
    [U.corps]: 12,
    [U.visage]: 6,
  };
  const MADE_BY_BRAND: Record<string, { madeIn: string; distributor: string }> = {
    "la-roche-posay": { madeIn: "France", distributor: "Cosmétique Active Tunisie" },
    bioderma: { madeIn: "France", distributor: "NAOS Tunisie" },
    caudalie: { madeIn: "France", distributor: "Caudalie Export" },
    vichy: { madeIn: "France", distributor: "Cosmétique Active Tunisie" },
    avene: { madeIn: "France", distributor: "Pierre Fabre Tunisie" },
    svr: { madeIn: "France", distributor: "SVR Distribution" },
    filorga: { madeIn: "France", distributor: "Filorga Export" },
    nuxe: { madeIn: "France", distributor: "Nuxe Distribution" },
    eucerin: { madeIn: "Allemagne", distributor: "Beiersdorf Tunisie" },
    cerave: { madeIn: "États-Unis", distributor: "L'Oréal Export" },
    klorane: { madeIn: "France", distributor: "Pierre Fabre Tunisie" },
    uriage: { madeIn: "France", distributor: "Laboratoires Uriage" },
    arkopharma: { madeIn: "France", distributor: "Arkopharma Maghreb" },
  };
  const brandRows2 = await db.execute(sql`SELECT id, slug FROM brands`);
  const BRAND_SLUG = new Map((brandRows2.rows as Array<{ id: number; slug: string }>).map((b) => [b.id, b.slug]));
  const productBrand = await db.execute(sql`SELECT id, brand_id FROM products`);
  const BRAND_OF = new Map((productBrand.rows as Array<{ id: number; brand_id: number | null }>).map((r) => [r.id, r.brand_id ? BRAND_SLUG.get(r.brand_id) ?? null : null]));

  const STORES = { ezzahra: STORE_IDS.ezzahra, hammamLif: STORE_IDS["hammam-lif"], entrepot: entrepot.id };
  const SUPPLIERS = ["Grossiste officinal Tunis", "Livraison directe laboratoire", "Centrale d'achat Cléopâtre", "Dépôt Sfax"];
  const YEAR_MS = 365.25 * 86_400_000;

  let lotCount = 0;
  for (const [i, p] of rows.entries()) {
    const brandSlug = BRAND_OF.get(p.id) ?? null;
    const origin = (brandSlug && MADE_BY_BRAND[brandSlug]) || { madeIn: "France", distributor: "Fournisseur agréé" };
    const read = readFormula(p.ingredients);

    /* The fiche's provenance, field by field. The copy typed in the office is
       marked « à confirmer » until a pharmacist signs it — because a claim
       nobody checked is not a claim, and the page will say so. */
    const claims: Record<string, ProductDataClaim> = {
      ingredients: { source: "Notice du laboratoire", at: new Date(Date.now() - 30 * 86_400_000).toISOString(), state: "to-confirm" },
      howToUse: { source: "Notice du laboratoire", at: new Date(Date.now() - 30 * 86_400_000).toISOString(), state: "to-confirm" },
      keyActives: { source: "Lecture de la formule", at: new Date().toISOString(), state: "verified" },
      allergens: { source: "Lecture de la formule", at: new Date().toISOString(), state: read.count > 0 ? "verified" : "none" },
      description: { source: "Rédaction Cléopâtre", at: new Date().toISOString(), state: "to-confirm" },
    };
    const verified = i % 4 === 0; // one fiche in four has been signed by hand

    await db.update(products).set({
      barcode: ean13(p.id),
      paoMonths: PAO_BY_UNIVERSE[p.universe_id ?? -1] ?? 12,
      madeIn: origin.madeIn,
      distributor: origin.distributor,
      allergens: read.allergens,
      keyActives: activesIn(p.ingredients, 5),
      dataSources: claims,
      verifiedAt: verified ? new Date(Date.now() - 7 * 86_400_000) : null,
      verifiedBy: verified ? "Yassine Ben Salah, pharmacien" : null,
      storeThresholds: { ezzahra: 4, hammamLif: 3 },
    }).where(sql`${products.id} = ${p.id}`);

    if (p.stock <= 0) continue;
    void isFragranceFree;

    /* Split the shelf across the two counters and the reserve, then cut it into
       dated lots. The split is deterministic so a reseed gives the same shop. */
    const toEzzahra = Math.max(1, Math.floor(p.stock * 0.6));
    const toHammam = Math.max(0, Math.floor(p.stock * 0.25));
    const toStore = new Map<number, number>();
    if (toEzzahra > 0) toStore.set(STORES.ezzahra, Math.min(toEzzahra, p.stock));
    const leftAfterEzzahra = p.stock - (toStore.get(STORES.ezzahra) ?? 0);
    if (toHammam > 0 && leftAfterEzzahra > 0) toStore.set(STORES.hammamLif, Math.min(toHammam, leftAfterEzzahra));
    const left = p.stock - [...toStore.values()].reduce((a, b) => a + b, 0);
    if (left > 0) toStore.set(STORES.entrepot, left);

    let seq = 0;
    for (const [storeId, qty] of toStore) {
      if (qty <= 0) continue;
      /* Two lots per counter where the quantity allows, with different dates:
         without that, FEFO has nothing to choose between. */
      const boxes = qty >= 6 ? 2 : 1;
      const base = boxes === 2 ? Math.floor(qty / 2) : qty;
      const rest = qty - base * (boxes - 1);
      for (let b = 0; b < boxes; b++) {
        const take = b === 0 && boxes === 2 ? rest : base;
        if (take <= 0) continue;
        // Dates: mostly comfortable, a few inside the alert windows.
        const roll = (p.id + seq * 7 + storeId) % 20;
        const months = roll === 0 ? 0.7 : roll === 1 ? 2.4 : roll === 2 ? 4 : 9 + ((p.id * 3 + seq) % 26);
        const expiresAt = new Date(Date.now() + months * 30 * 86_400_000);
        const [lotRow] = await db.insert(productLots).values({
          productId: p.id,
          storeId,
          lot: `L${String(p.id).padStart(3, "0")}-${String.fromCharCode(65 + seq)}${(p.id * 7 + seq) % 90 + 10}`,
          expiresAt,
          quantity: take,
          placed: storeId === STORES.entrepot ? "back" : seq % 3 === 0 ? "back" : "shelf",
          supplier: SUPPLIERS[(p.id + seq) % SUPPLIERS.length],
          receivedAt: new Date(Date.now() - (3 + ((p.id + seq) % 40)) * 86_400_000),
          status: "sale",
        }).returning({ id: productLots.id });
        await db.insert(lotEvents).values({ lotId: lotRow.id, type: "received", quantity: take, note: "Réception fournisseur" });
        lotCount++;
        seq++;
      }
    }

    /* The two states a perfect shelf never has, seeded on purpose — and kept
       OUT of the stock figure, because neither can be sold. */
    if (p.id % 17 === 0) {
      const [bad] = await db.insert(productLots).values({
        productId: p.id, storeId: STORES.ezzahra, lot: `L${String(p.id).padStart(3, "0")}-PERI`,
        expiresAt: new Date(Date.now() - (5 + (p.id % 20)) * 86_400_000), quantity: 2 + (p.id % 3),
        placed: "shelf", supplier: SUPPLIERS[p.id % SUPPLIERS.length], status: "quarantine",
        note: "Date dépassée en rayon — retiré de la vente, à détruire ou retourner",
      }).returning({ id: productLots.id });
      await db.insert(lotEvents).values({ lotId: bad.id, type: "quarantined", quantity: 0, note: "Retrait automatique à la date de péremption" });
      lotCount++;
    }
    if (p.id % 23 === 0) {
      const [undated] = await db.insert(productLots).values({
        productId: p.id, storeId: STORES[storeIdForUndated(p.id)], lot: `L${String(p.id).padStart(3, "0")}-SD`,
        expiresAt: null, quantity: 3 + (p.id % 4), placed: "back",
        supplier: SUPPLIERS[(p.id + 2) % SUPPLIERS.length], status: "sale",
        note: "Reçu sans date — à dater avant toute vente",
      }).returning({ id: productLots.id });
      await db.insert(lotEvents).values({ lotId: undated.id, type: "received", quantity: 3 + (p.id % 4), note: "Lot reçu sans date — jamais vendable en l'état" });
      lotCount++;
    }
  }

  /* The product row is rewritten as the sum of its sellable lots: from here on,
     the shelf is the source of truth and the number merely reports it. */
  await db.execute(sql`
    UPDATE products p SET
      stock = COALESCE((SELECT SUM(l.quantity) FROM product_lots l
                         WHERE l.product_id = p.id AND l.status = 'sale'
                           AND l.expires_at IS NOT NULL AND l.expires_at > now()), 0),
      location_stock = NULLIF((
        SELECT jsonb_object_agg(slug, n) FROM (
          SELECT st.slug, SUM(l.quantity)::int AS n
            FROM product_lots l JOIN stores st ON st.id = l.store_id
           WHERE l.product_id = p.id AND l.status = 'sale'
             AND l.expires_at IS NOT NULL AND l.expires_at > now()
           GROUP BY st.slug HAVING SUM(l.quantity) > 0) t), '{}'::jsonb)`);
  console.log(`  · ${lotCount} lots · ${rows.length} références suivies par date`);

  console.log(`✓ Seed complete — ${productIds.length} products. Admin: admin@cleopatre.tn · Client: client@cleopatre.tn · Support: ${support.email}${IS_PROD_SEED ? " (passwords supplied via environment)" : " — demo passwords: Admin123! / Client123! / Support123!"}`);
  console.log(`  ✦ Shared list: /liste/${shareToken} · demo clients: client@cleopatre.tn & client.tn@cleopatre.tn`);
  await pool.end();
}

main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1); });
