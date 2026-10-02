# -*- coding: utf-8 -*-
"""Construit « Cleopatre-PFE-Soutenance.pptx » (20 diapositives, chaîne Morph complète).
Exécution : python build_deck.py   (python-pptx, pillow, fonttools)"""
import os, sys, zipfile, re, shutil
sys.path.insert(0, os.path.dirname(__file__))
from lib import *

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PUB = os.path.join(ROOT, "public")
IMG = lambda *p: os.path.join(PUB, *p)
HERO = IMG("videos", "posters", "hero.jpg")        # still de campagne
VISAGE = IMG("images", "u-visage.jpg")
ATELIER = IMG("images", "atelier.jpg")
MAISON = IMG("images", "maison.jpg")

NB = "\u00a0"           # espace insécable (avant : ? ; )
CH = {1: "COUVERTURE", 2: "INTRODUCTION", 3: "PROBLÉMATIQUE", 4: "SOLUTION PROPOSÉE", 5: "PLAN",
      6: "SPÉCIFICATION DES BESOINS", 7: "BESOINS FONCTIONNELS · CLIENT",
      8: "BESOINS FONCTIONNELS · ADMINISTRATION", 9: "BESOINS NON FONCTIONNELS",
      10: "MODÉLISATION ET RÉALISATION", 11: "CONCEPTION · DIAGRAMME 01", 12: "CONCEPTION · DIAGRAMME 02",
      13: "CONCEPTION · DIAGRAMME 03", 14: "CONCEPTION · DIAGRAMME 04", 15: "CONCEPTION · DIAGRAMME 05",
      16: "RÉALISATION · ENVIRONNEMENT", 17: "DÉMONSTRATION · CLIENT", 18: "DÉMONSTRATION · ADMINISTRATION",
      19: "CONCLUSION", 20: "CLÔTURE"}

D = Deck()
MORPH = {}   # numéro -> (option, durée ms)

def furniture(s, n, label=dict(), idx=dict(), dark=False):
    """Marque (!!ProjectLabel) et index de chapitre (!!ChapterIndex) : présents sur toutes les diapositives."""
    lc = label.get("color", WHITE if dark else INK)
    s.tx("!!ProjectLabel", label.get("x", 0.6), label.get("y", 0.34), label.get("w", 3.0), label.get("h", 0.32),
         "CLÉOPÂTRE", font=ANTON, size=label.get("size", 16), color=lc, spc=label.get("spc", 1.5), ls=label.get("ls", 1.0),
         anchor=label.get("anchor", "t"))
    ic = idx.get("color", LINE2 if dark else MUTED)
    s.tx("!!ChapterIndex", idx.get("x", 5.73), idx.get("y", 0.4), idx.get("w", 7.0), 0.28,
         f"{n:02d} / 20   ·   {CH[n]}", font=MONO, size=12, color=ic, align=idx.get("align", "r"), spc=0.6)

def ttl(s, text, x=0.6, y=0.88, w=12.1, h=0.62, size=30, color=INK, name="!!MorphHeadline", **k):
    k.setdefault("bold", True); k.setdefault("ls", 0.95)
    return s.tx(name, x, y, w, h, text, size=size, color=color, **k)

# ═══════════════════════════════════════════════════════════════ 1 · COUVERTURE
s = D.slide(CANVAS)
s.pic("!!VisualAnchor", HERO, 5.35, 0, W - 5.35, H, fx=0.46, fy=0.5, zoom=1.0)
furniture(s, 1, label=dict(x=0.6, y=1.85, w=4.6, h=1.2, size=66, spc=0, ls=0.85),
          idx=dict(x=0.6, y=7.1, w=4.5, align="l"))
s.tx("Kicker", 0.6, 0.42, 4.6, 0.3, "SOUTENANCE · PROJET DE FIN D’ÉTUDES", font=MONO, size=12, color=MUTED, spc=0.6)
s.rect("!!CleoSignal", 0.6, 1.4, 4.4, 0.1, fill=GREEN)
ttl(s, "Conception et réalisation d’une plateforme e-commerce pour une parapharmacie",
    x=0.6, y=3.1, w=4.6, h=1.9, size=24)
s.line("!!NarrativePath", 0.6, 5.42, 5.0, 5.42, color=LINE2, lw=0.75)
for k, (lab, val, yy) in enumerate([("PRÉSENTÉ PAR", "[Nom de l’étudiant·e]", 5.62), ("ENCADRANT", "[Encadrant]", 5.98), ("ÉTABLISSEMENT", "[Établissement]", 6.34)]):
    s.tx(f"Libellé {lab}", 0.6, yy + 0.05, 1.6, 0.26, lab, font=MONO, size=12, color=MUTED, spc=0.4)
    s.tx(f"Champ {lab}", 2.25, yy, 2.9, 0.3, val, size=16, color=INK)
s.tx("Champ Année", 2.25, 6.7, 2.9, 0.3, "[Année universitaire]", size=16, color=INK)
s.tx("Libellé ANNÉE", 0.6, 6.75, 1.6, 0.26, "ANNÉE", font=MONO, size=12, color=MUTED, spc=0.4)
s.notes("""À DIRE : Bonjour. Je présente Cléopâtre, la plateforme e-commerce d’une parapharmacie d’Ezzahra et de Hammam-Lif, que j’ai redessinée et développée de bout en bout. Le titre complet est affiché ; je me présente puis j’enchaîne.

À COMPLÉTER AVANT LA SOUTENANCE : [Nom de l’étudiant·e], [Encadrant], [Établissement], [Année universitaire] (zones de texte modifiables en bas à gauche).

VISUEL : still de campagne authentique du projet (public/videos/posters/hero.jpg).
POLICES : Anton, Instrument Sans et JetBrains Mono (voir docs/soutenance/polices). Sans installation, PowerPoint substitue une police de remplacement.

TRANSITION (Morph, mot à mot) → 2 : l’image change de cadrage et passe à gauche ; les mots du titre (plateforme, pour, une, parapharmacie) glissent vers le titre d’introduction ; le trait vert devient le repère de chapitre ; « CLÉOPÂTRE » se réduit en marque.""")

# ═══════════════════════════════════════════════════════════════ 2 · INTRODUCTION
s = D.slide(CANVAS)
s.pic("!!VisualAnchor", HERO, 0.6, 1.15, 4.3, 5.75, fx=0.43, fy=0.5, zoom=1.0)
furniture(s, 2)
s.rect("!!CleoSignal", 5.6, 1.15, 0.9, 0.1, fill=GREEN)
ttl(s, "Une plateforme pour une parapharmacie d’Ezzahra et de Hammam-Lif", x=5.6, y=1.5, w=7.1, h=1.8, size=34)
s.tx("Texte introduction", 5.6, 3.5, 6.9, 1.2,
     "Cléopâtre est une parapharmacie implantée à Ezzahra et à Hammam-Lif, en Tunisie. Ce projet repense son identité en ligne et construit sa plateforme, de A à Z.",
     size=18, color=MUTED, ls=1.05)
s.line("!!NarrativePath", 5.6, 5.0, 12.73, 5.0, color=INK, lw=1.0)
for i, (k, v) in enumerate([("LIEUX", "Ezzahra · Hammam-Lif"), ("PÉRIMÈTRE", "Vitrine et administration"), ("RÔLE", "Conception et développement")]):
    x = 5.6 + i * 2.42
    s.tx(f"Fiche {k}", x, 5.22, 2.25, 1.3, [dict(runs=[(k, {})], font=MONO, size=12, color=MUTED, spc=0.6, after=6), dict(runs=[(v, {})], size=20, bold=True)], size=20)
s.notes("""À DIRE : Cléopâtre est une parapharmacie implantée à Ezzahra et à Hammam-Lif. Mon travail : repenser son identité en ligne et développer entièrement la plateforme — une vitrine pour les clients et un espace d’administration séparé pour l’équipe. Le trait vert et l’index en haut à droite nous accompagneront jusqu’à la fin.

SOURCES : README.md (contexte, stack) ; src/app/(site)/local/ezzahra-hammam-lif/page.tsx ; public/videos/posters/hero.jpg.
(Aucun chiffre d’activité n’est avancé : le dossier ne contient pas de données commerciales.)

TRANSITION → 3 : l’image se retire en simple lisière à gauche ; le trait vert pivote à la verticale pour devenir l’ancre de la question ; le titre se transforme en question.""")

# ═══════════════════════════════════════════════════════════════ 3 · PROBLÉMATIQUE
s = D.slide(CANVAS)
s.pic("!!VisualAnchor", HERO, 0, 0, 0.42, H, fx=0.30, fy=0.5, zoom=1.0)
furniture(s, 3)
s.rect("!!CleoSignal", 1.0, 1.62, 0.1, 3.55, fill=GREEN)
ttl(s, "Comment proposer une expérience en ligne claire pour découvrir les produits, commander et suivre ses demandes,",
    x=1.4, y=1.5, w=10.9, h=2.0, size=36)
s.tx("!!QuestionTeam", 1.4, 3.72, 10.9, 1.45,
     [[(f"tout en donnant à l’équipe des outils adaptés à la gestion de la parapharmacie{NB}?", dict(color=GREEN))]],
     size=36, bold=True, ls=0.95)
s.line("!!NarrativePath", 1.4, 5.75, 12.33, 5.75, color=INK, lw=1.5)
s.notes("""À DIRE : Voici la question qui guide tout le projet. Elle a deux moitiés : l’expérience du client (en encre) et les outils de l’équipe (en vert). Je ne prétends pas qu’un problème chiffré préexistait : il s’agit d’une problématique de conception.

SOURCES : énoncé du projet (aucune étude ni enquête n’est invoquée).

TRANSITION → 4 : la question se sépare — la première moitié devient le chemin « Client », la seconde le chemin « Administration » ; le soulignement se redresse et devient le connecteur entre les deux.""")

# ═══════════════════════════════════════════════════════════════ 4 · SOLUTION
s = D.slide(CANVAS)
furniture(s, 4)
s.tx("Titre section", 0.6, 0.88, 7.0, 0.6, "Solution proposée", size=30, bold=True, ls=0.95)
s.tx("Sous-titre", 0.6, 1.45, 12.0, 0.4, "Deux espaces distincts, alimentés par une même base de données.", size=16, color=MUTED)
rows = [(2.3, "!!MorphHeadline", "Client", "ESPACE PUBLIC · VITRINE", ["Découvrir", "Choisir", "Commander", "Suivre"], "!!PathClient", VISAGE, (0.5, 0.35, 1.0), GREEN),
        (4.95, "!!QuestionTeam", "Administration", "ESPACE PROTÉGÉ · ÉQUIPE", ["Catalogue", "Stocks", "Commandes", "Relation client"], "!!PathAdmin", ATELIER, (0.5, 0.45, 1.0), INK)]
for y0, nm, head, tag, stages, pn, img, (fx, fy, z), col in rows:
    s.pic("Image " + head, img, 0.6, y0, 1.9, 1.9, fx=fx, fy=fy, zoom=z)
    s.tx(nm, 2.9, y0 - 0.04, 6.0, 0.62, head, size=34, bold=True, ls=0.95)
    s.tx("Étiquette " + head, 2.9, y0 + 0.62, 5.0, 0.28, tag, font=MONO, size=12, color=MUTED, spc=0.6)
    s.line(pn, 2.9, y0 + 1.62, 12.73, y0 + 1.62, color=col, lw=1.5, tail="triangle")
    for i, st in enumerate(stages):
        x = 2.9 + i * 2.6
        s.rect(f"Repère {head} {i+1}", x, y0 + 1.53, 0.18, 0.18, fill=col)
        s.tx(f"Étape {head} {i+1}", x, y0 + 1.1, 2.3, 0.36, st, size=18, bold=True)
s.line("!!NarrativePath", 1.55, 4.2, 1.55, 4.95, color=INK, lw=2.0, head="triangle", tail="triangle")
s.rect("!!CleoSignal", 1.45, 4.465, 0.2, 0.2, fill=GREEN)
s.tx("Légende liaison", 2.9, 4.4, 9.8, 0.3, "Mêmes données, même base PostgreSQL : ce que l’équipe gère est ce que le client voit.", size=14, color=MUTED)
s.notes("""À DIRE : La solution est un seul système avec deux espaces. Côté client : découvrir, choisir, commander et suivre. Côté administration : gérer le catalogue, les stocks, les commandes et la relation client. Les deux reposent sur la même base PostgreSQL — c’est ce lien, au centre, qui fait la cohérence.

SOURCES : src/app/(site) (vitrine) ; src/app/admin (administration) ; src/db/schema.ts ; README.md (« PostgreSQL comme source unique de vérité »).
VISUELS : public/images/u-visage.jpg (client) et public/images/atelier.jpg (équipe, geste de préparation).

TRANSITION → 5 : les deux chemins se replient à la verticale pour former deux colonnes du plan.""")

# ═══════════════════════════════════════════════════════════════ 5 · PLAN
s = D.slide(CANVAS)
furniture(s, 5)
ttl(s, "PLAN", x=0.6, y=0.95, w=4.3, h=2.2, size=120, font=ANTON, bold=False, ls=0.85)
s.rect("!!CleoSignal", 0.6, 3.35, 1.2, 0.1, fill=GREEN)
s.tx("Sous-titre plan", 0.6, 3.7, 3.9, 1.3, "Huit temps pour aller du contexte à la démonstration des interfaces.", size=18, color=MUTED, ls=1.05)
s.tx("Étiquette colonne 1", 5.5, 1.0, 3.6, 0.28, "CONTEXTE ET BESOINS", font=MONO, size=12, color=MUTED, spc=0.6)
s.tx("Étiquette colonne 2", 9.4, 1.0, 3.3, 0.28, "RÉALISATION ET DÉMONSTRATION", font=MONO, size=12, color=MUTED, spc=0.6)
s.line("!!NarrativePath", 5.5, 1.4, 12.73, 1.4, color=INK, lw=1.0)
s.line("!!PathClient", 5.58, 1.9, 5.58, 6.25, color=GREEN, lw=1.5)
s.line("!!PathAdmin", 9.48, 1.9, 9.48, 6.25, color=INK, lw=1.5)
plan = ["Introduction", "Problématique", "Solution", "Spécification des besoins",
        "Modélisation et réalisation", "Conception", "Démonstration des interfaces", "Conclusion"]
for i, t in enumerate(plan):
    col, r = divmod(i, 4)
    xl = 5.58 if col == 0 else 9.48
    y0 = 1.85 + r * 1.2
    s.rect(f"Nœud plan {i+1}", xl - 0.09, y0 + 0.06, 0.18, 0.18, fill=WHITE, line=(GREEN if col == 0 else INK), lw=1.5)
    nm = "!!AgendaIndex" if i == 3 else f"Numéro plan {i+1}"
    s.tx(nm, xl + 0.35, y0, 0.9, 0.3, f"{i+1:02d}", font=MONO, size=14, color=GREEN if col == 0 else INK, spc=0.6)
    s.tx(f"Titre plan {i+1}", xl + 0.35, y0 + 0.32, 3.1 if col == 0 else 3.05, 0.78, t, size=22, bold=True, ls=0.95)
s.notes("""À DIRE : Le plan suit la logique du projet : contexte (introduction, problématique, solution), besoins, modélisation et réalisation, conception, démonstration des interfaces, puis conclusion. La colonne verte porte le contexte et les besoins, la colonne encre la réalisation.

TRANSITION → 6 : le numéro 04 grandit et vient en tête de la diapositive suivante ; les deux colonnes se couchent et deviennent les liaisons entre les acteurs et la plateforme.""")

# ═══════════════════════════════════════════════════════════════ 6 · SPÉCIFICATION DES BESOINS
s = D.slide(CANVAS)
furniture(s, 6)
s.tx("!!AgendaIndex", 0.6, 0.72, 1.4, 1.0, "04", font=ANTON, size=54, color=GREEN, ls=0.9)
ttl(s, "Spécification des besoins", x=1.95, y=0.88, w=10.6, h=0.62)
s.tx("Sous-titre périmètre", 1.95, 1.5, 10.7, 0.5, "Périmètre : une vitrine et un espace d’administration séparé, reliés à la même base de données.", size=16, color=MUTED)
bx, by, bw, bh = 3.7, 2.55, 5.93, 4.3
s.line("!!NarrativePath", bx, by, bx + bw, by, color=INK, lw=1.5, dash="dash")
s.line("Frontière gauche", bx, by, bx, by + bh, color=INK, lw=1.5, dash="dash")
s.line("Frontière droite", bx + bw, by, bx + bw, by + bh, color=INK, lw=1.5, dash="dash")
s.line("Frontière basse", bx, by + bh, bx + bw, by + bh, color=INK, lw=1.5, dash="dash")
s.rect("!!CleoSignal", bx - 0.1, by - 0.1, 0.2, 0.2, fill=GREEN)
s.tx("Étiquette frontière", bx + 0.25, by + 0.2, 5.0, 0.28, "PLATEFORME CLÉOPÂTRE", font=MONO, size=12, color=MUTED, spc=0.6)
s.line("Séparateur zones", 6.665, by + 0.8, 6.665, by + bh - 0.3, color=LINE2, lw=0.75)
for x, head, items in [(4.08, "Vitrine", ["Catalogue et recherche", "Panier et commande", "Compte et suivi"]),
                       (6.95, "Administration", ["Catalogue et stocks", "Commandes et retours", "Support et e-mails"])]:
    s.tx("Zone " + head, x, by + 0.8, 2.55, 3.1, [dict(runs=[(head, {})], size=22, bold=True, after=12)] + [dict(runs=[(t, {})], size=16, after=10) for t in items], size=16)
s.rect("!!RoleChip", 0.6, 3.35, 2.3, 1.45, fill=GREEN, text=[dict(runs=[("ACTEUR", {})], font=MONO, size=12, color=WHITE, spc=0.6, after=4), dict(runs=[("Client", {})], size=26, bold=True, color=WHITE)], anchor="m", inset=0.2)
s.tx("Rôle client", 0.6, 5.0, 2.3, 1.3, "Découvre le catalogue, commande et suit ses demandes.", size=16, color=MUTED, ls=1.05)
s.rect("!!ActorTeam", 10.43, 3.35, 2.3, 1.45, fill=INK, text=[dict(runs=[("ACTEUR", {})], font=MONO, size=12, color=LINE2, spc=0.6, after=4), dict(runs=[("Équipe", {})], size=26, bold=True, color=WHITE)], anchor="m", inset=0.2)
s.tx("Rôle équipe", 10.43, 5.0, 2.3, 1.3, "Gère le catalogue, les commandes et la relation client.", size=16, color=MUTED, ls=1.05)
s.line("!!PathClient", 2.9, 4.075, 3.92, 4.075, color=GREEN, lw=1.5, tail="triangle")
s.line("!!PathAdmin", 10.43, 4.075, 9.45, 4.075, color=INK, lw=1.5, tail="triangle")
s.notes("""À DIRE : Deux acteurs. Le client consulte, commande et suit ; l’équipe gère le catalogue, les commandes et la relation client. La ligne pointillée marque la frontière du système : la plateforme Cléopâtre contient la vitrine et l’administration.

SOURCES : src/app/(site) ; src/app/admin ; src/lib/auth.ts (rôles customer / support / admin, schema userRoleEnum dans src/db/schema.ts).

TRANSITION → 7 : l’acteur Client se réduit en pastille et se place au départ du parcours ; la frontière supérieure devient la ligne du parcours client.""")

# ═══════════════════════════════════════════════════════════════ 7 · BESOINS FONCTIONNELS : CLIENT
s = D.slide(CANVAS)
furniture(s, 7)
s.rect("!!RolePanel", 0, 0, 0.14, H, fill=GREEN)
ttl(s, f"Besoins fonctionnels{NB}: client", x=0.6, y=0.88, w=11, h=0.62)
s.tx("Sous-titre client", 0.6, 1.5, 11.5, 0.4, "Le parcours client, tel qu’il est réellement implémenté dans la vitrine.", size=16, color=MUTED)
JY = 3.45
s.line("!!NarrativePath", 2.0, JY, 12.73, JY, color=INK, lw=1.5, tail="triangle")
s.rect("!!CleoSignal", 2.0, JY - 0.045, 2.43, 0.09, fill=GREEN)
s.rect("!!RoleChip", 0.6, JY - 0.28, 1.4, 0.56, fill=GREEN, text=[dict(runs=[("CLIENT", {})], font=MONO, size=13, color=WHITE, spc=0.8, bold=False, align="c")], anchor="m", inset=0.05)
stg = [("Découvrir", "Univers, catégories, marques et produits"),
       ("Choisir", "Recherche, filtres et fiche produit"),
       ("Commander", "Panier, commande et paiement"),
       ("Suivre", "Compte, favoris, avis, notifications, suivi de commande et retours"),
       ("Conseil", "Contact du support et conseils du pharmacien")]
for i, (h_, d_) in enumerate(stg):
    x = 2.35 + i * 2.08
    s.rect(f"!!Node{i+1}", x, JY - 0.11, 0.22, 0.22, fill=WHITE, line=INK, lw=1.5)
    s.tx(f"Numéro client {i+1}", x, 2.35, 1.9, 0.28, f"{i+1:02d}", font=MONO, size=14, color=GREEN, spc=0.6)
    s.tx(f"Étape client {i+1}", x, 2.7, 1.95, 0.42, h_, size=20, bold=True)
    s.tx(f"Détail client {i+1}", x, 3.85, 1.9, 2.3, d_, size=16, color=INK, ls=1.05)
s.tx("Moyens de paiement", 6.51, 5.95, 6.2, 0.3, "PAIEMENT : À LA LIVRAISON · VIREMENT · CARTE CADEAU", font=MONO, size=12, color=INK, spc=0.3)
s.tx("Note paiement", 6.51, 6.3, 6.2, 0.3, "CARTE BANCAIRE : NON ACTIVÉE", font=MONO, size=12, color=AMBER, spc=0.3)
s.notes("""À DIRE : Le parcours client en cinq temps. Découvrir : univers, catégories, marques, produits. Choisir : recherche, filtres, fiche produit. Commander : panier, commande, et les moyens de paiement réellement disponibles — paiement à la livraison, virement bancaire, carte cadeau. Le paiement par carte bancaire n’est pas activé et aucune passerelle n’est intégrée. Suivre : compte, favoris, avis, notifications, suivi de commande, retours. Conseil : support et conseils.

SOURCES : src/app/(site)/{boutique, univers/[slug], categorie/[slug], marques, produit/[slug], recherche, panier, commande, suivi, conseil-pharmacien, aide} ; src/app/(site)/compte/{favoris, commandes, retours, notifications} ; src/actions/checkout.ts ; docs/PAYMENTS.md (cod, bank_transfer, gift_card actifs ; card refusé côté serveur).

TRANSITION → 8 : la ligne horizontale se redresse et les cinq repères descendent en colonne : le même fil devient le flux de travail de l’équipe. La pastille « CLIENT » devient « ÉQUIPE » et le bandeau vert s’élargit en panneau sombre.""")

# ═══════════════════════════════════════════════════════════════ 8 · BESOINS FONCTIONNELS : ADMINISTRATION
s = D.slide(CANVAS)
s.rect("!!RolePanel", 0, 0, 4.7, H, fill=INK)
furniture(s, 8, label=dict(color=WHITE), idx=dict())
s.rect("!!RoleChip", 0.6, 1.0, 1.9, 0.56, fill=WHITE, text=[dict(runs=[("ÉQUIPE", {})], font=MONO, size=13, color=INK, spc=0.8, align="c")], anchor="m", inset=0.05)
ttl(s, f"Besoins fonctionnels{NB}: administration", x=0.6, y=1.85, w=3.7, h=1.9, size=30, color=WHITE)
s.line("Filet panneau", 0.6, 4.35, 4.1, 4.35, color=GRAPHITE, lw=1.0)
s.tx("Texte rôles", 0.6, 4.6, 3.6, 1.75, [dict(runs=[("ACCÈS PROTÉGÉ", {})], font=MONO, size=12, color=LINE2, spc=0.6, after=8),
                                          dict(runs=[("Chaque action d’administration est protégée par un rôle, vérifié côté serveur.", {})], size=18, color=WHITE, bold=True)], size=18, color=WHITE, ls=1.05)
s.tx("Rôles", 0.6, 6.55, 3.8, 0.3, "RÔLES : CLIENT · SUPPORT · ADMIN", font=MONO, size=12, color=LINE2, spc=0.4)
wf = [("Catalogue", "Produits, marques, prix et promotions"),
      ("Stock", "Suivi des stocks, des lots et des dates"),
      ("Commandes", "Traitement et préparation des commandes"),
      ("Clientèle", "Clients, retours et factures"),
      ("Suivi", "Support, e-mails transactionnels et activité")]
VX = 5.55
s.line("!!NarrativePath", VX, 1.95, VX, 6.35, color=INK, lw=1.5, tail="triangle")
s.rect("!!CleoSignal", VX - 0.045, 1.95, 0.09, 1.1, fill=GREEN)
hairs = [1.4, 2.5, 3.6, 4.7, 5.8]
for k, y in zip("ABCDE", hairs):
    s.line(f"!!Link{k}", 5.9, y, 12.73, y, color=LINE2, lw=0.75)
s.line("Filet bas", 5.9, 6.9, 12.73, 6.9, color=LINE2, lw=0.75)
for i, (a, b) in enumerate(wf):
    yc = 1.95 + i * 1.1
    s.rect(f"!!Node{i+1}", VX - 0.11, yc - 0.11, 0.22, 0.22, fill=WHITE, line=INK, lw=1.5)
    s.tx(f"Étape admin {i+1}", 6.05, yc - 0.22, 2.6, 0.45, a, size=24, bold=True)
    s.tx(f"Détail admin {i+1}", 8.85, yc - 0.27, 3.85, 0.7, b, size=16, color=MUTED, ls=1.05)
s.notes("""À DIRE : Côté équipe, le travail suit un flux : catalogue (produits, marques, prix, promotions), stock (niveaux, lots, dates), commandes (traitement et préparation), clientèle (clients, retours, factures), suivi (support, e-mails transactionnels, activité). Point clé : chaque action d’administration est protégée par un rôle, vérifié côté serveur.

SOURCES : src/app/admin/{produits, promotions, stock, lots, commandes, preparation, clients, retours-rma, support, emails, activite} ; src/lib/admin/ ; src/actions/admin.ts, src/actions/lots.ts ; src/lib/auth.ts (requireStaff, requireAdmin) ; src/lib/invoice-pdf.ts (factures).

TRANSITION → 9 : la colonne de flux et ses filets se réorganisent en grille de spécification.""")

# ═══════════════════════════════════════════════════════════════ 9 · BESOINS NON FONCTIONNELS
s = D.slide(CANVAS)
furniture(s, 9)
ttl(s, "Besoins non fonctionnels", x=0.6, y=0.88, w=11, h=0.62)
s.tx("Sous-titre qualité", 0.6, 1.45, 12.1, 0.4, "Objectif général à gauche · mécanisme réellement mis en œuvre à droite. Ni certification ni score revendiqués.", size=16, color=MUTED)
HY = 2.0
s.tx("Colonne qualité", 1.55, HY, 2.8, 0.28, "QUALITÉ", font=MONO, size=12, color=MUTED, spc=0.6)
s.tx("Colonne objectif", 4.6, HY, 3.0, 0.28, "OBJECTIF GÉNÉRAL", font=MONO, size=12, color=MUTED, spc=0.6)
s.tx("Colonne mécanisme", 8.3, HY, 4.4, 0.28, "MÉCANISME MIS EN ŒUVRE", font=MONO, size=12, color=GREEN, spc=0.6)
RY, RP = 2.38, 0.655
s.line("!!NarrativePath", 7.95, HY - 0.02, 7.95, RY + 7 * RP, color=GREEN, lw=2.0)
nf = [("Sécurité", "!!ReqSecurite", "Protéger les accès", "Sessions protégées ; rôles vérifiés côté serveur"),
      ("Validation", "!!ReqValidation", "Fiabiliser les saisies", "Entrées contrôlées avant traitement (Zod)"),
      ("Résilience", "!!ReqResilience", "Rester disponible", "Limitation de débit ; gestion des erreurs"),
      ("Adaptation", None, "Servir tous les écrans", "Écrans adaptatifs ; mouvement réduit respecté"),
      ("Performance", None, "Navigation fluide", "Images optimisées ; vidéo chargée à la demande"),
      ("Évolutivité", None, "Faire évoluer le code", "Code modulaire, TypeScript et PostgreSQL"),
      ("Localisation", None, "Parler la langue du client", "Français, tounsi et arabe tunisien")]
links = ["A", "B", "C", "D", "E", "F", "G", "H"]
for i in range(8):
    y = RY + i * RP
    nm = f"!!Link{links[i]}" if i < 5 else f"Filet {links[i]}"
    s.line(nm, 0.6, y, 12.73, y, color=(INK if i == 0 else LINE2), lw=(1.5 if i == 0 else 0.75))
for i, (q, nm, o, m) in enumerate(nf):
    y = RY + i * RP
    s.tx(f"Code NF {i+1}", 0.6, y + 0.17, 0.9, 0.3, f"NF-{i+1:02d}", font=MONO, size=12, color=MUTED)
    s.tx(nm or f"Qualité {i+1}", 1.55, y + 0.14, 2.9, 0.4, q, size=20, bold=True)
    s.tx(f"Objectif {i+1}", 4.6, y + 0.15, 3.2, 0.4, o, size=16, color=MUTED)
    s.rect(f"!!Node{i+1}" if i < 5 else f"Repère NF {i+1}", 8.1, y + 0.2, 0.17, 0.17, fill=GREEN)
    s.tx(f"Mécanisme {i+1}", 8.45, y + 0.07, 4.28, 0.58, m, size=16, ls=1.0)
s.rect("!!CleoSignal", 7.865, HY - 0.02, 0.27, 0.27, fill=GREEN)
s.notes("""À DIRE : Je sépare l’objectif général de ce qui existe réellement dans le code. Sécurité : sessions en cookie httpOnly, rôles vérifiés côté serveur. Validation : schémas Zod avant traitement. Résilience : limitation de débit stockée dans PostgreSQL et pages d’erreur. Adaptation : écrans adaptatifs et respect de prefers-reduced-motion. Performance : images optimisées (AVIF/WebP) et vidéos chargées quand la scène approche de l’écran. Évolutivité : code modulaire, TypeScript, PostgreSQL. Localisation : français, tounsi en lettres latines et arabe tunisien (de droite à gauche).
Je ne revendique ni certification, ni score, ni résultat garanti.

SOURCES : src/lib/auth.ts (createSession httpOnly, sameSite, requireStaff/requireAdmin) ; src/lib/validation.ts (Zod) ; src/lib/rate-limit.ts ; src/app/error.tsx, global-error.tsx ; src/app/globals.css (prefers-reduced-motion) ; next.config.ts (images avif/webp) ; src/components/cinematic/VideoLoader.tsx (IntersectionObserver) ; src/lib/i18n/config.ts (fr, tn, tn-arab) ; src/db/schema.ts.

TRANSITION → 10 : les filets de la grille deviennent les connecteurs de l’architecture, les repères verts deviennent des nœuds ; « Sécurité », « Validation » et « Résilience » glissent vers le nœud serveur auquel ils appartiennent.""")

# ═══════════════════════════════════════════════════════════════ 10 · ARCHITECTURE
s = D.slide(CANVAS)
furniture(s, 10)
ttl(s, "Architecture de la plateforme", x=0.6, y=0.88, w=11, h=0.62)
s.tx("Sous-titre archi", 0.6, 1.45, 12, 0.4, "Du navigateur à la base de données : un seul chemin, côté serveur, pour toutes les données.", size=16, color=MUTED)
NW, GAP, NY, NH = 1.7, 0.386, 2.8, 1.75
nodes = [("Client / équipe", "visiteur · équipe"), ("Navigateur", "mobile ou poste"),
         ("Application Next.js", "React 19"), ("Server Actions et routes API", "TypeScript"),
         ("Drizzle ORM", "requêtes typées"), ("PostgreSQL", "données")]
shp = []
for i, (a, b) in enumerate(nodes):
    x = 0.6 + i * (NW + GAP)
    last = i == 5
    nm = "!!DiagramFrame" if last else f"!!Node{i+1}"
    s.tx(f"Index nœud {i+1}", x, NY - 0.38, 1.0, 0.28, f"{i+1:02d}", font=MONO, size=12, color=MUTED, spc=0.6)
    r = s.rect(nm, x, NY, NW, NH, fill=(INK if last else WHITE), line=(INK if last else LINE2), lw=1.0,
               text=[dict(runs=[(a, {})], size=17, bold=True, color=(WHITE if last else INK), after=6, ls=0.95),
                     dict(runs=[(b, {})], font=MONO, size=12, color=(LINE2 if last else MUTED))], anchor="m", inset=0.1)
    shp.append(r)
for i, k in enumerate("ABCDE"):
    c = s.line(f"!!Link{k}", 0, 0, 1, 0, color=INK, lw=1.5, tail="triangle")
    c.begin_connect(shp[i], 3); c.end_connect(shp[i + 1], 1)
s.rect("!!CleoSignal", 0.6 + 3 * (NW + GAP), NY - 0.1, NW, 0.1, fill=GREEN)
bx3 = 0.6 + 3 * (NW + GAP) + NW / 2
s.rect("Brevo", bx3 - 1.8, 5.55, 3.6, 0.95, fill=WHITE, line=INK, lw=1.0, dash="dash",
       text=[dict(runs=[("Brevo", {})], size=17, bold=True, after=3), dict(runs=[("e-mails transactionnels · optionnel", {})], font=MONO, size=12, color=MUTED)], anchor="m", inset=0.1, align="c")
c = s.line("!!NarrativePath", bx3, NY + NH, bx3, 5.55, color=INK, lw=1.5, dash="dash", tail="triangle")
c.begin_connect(shp[3], 2); c.end_connect(s.reg["Brevo"]["shape"], 0)
s.tx("Titre côté serveur", 0.6, 5.03, 4.0, 0.28, "CÔTÉ SERVEUR", font=MONO, size=12, color=MUTED, spc=0.6)
for j, (nm, a, b) in enumerate([("!!ReqSecurite", "Sécurité", "rôles vérifiés"), ("!!ReqValidation", "Validation", "entrées contrôlées"), ("!!ReqResilience", "Résilience", "limitation de débit")]):
    s.tx(nm, 0.6, 5.45 + j * 0.45, 5.2, 0.4, [[(a, dict(bold=True)), (f"  ·  {b}", dict(color=MUTED))]], size=17)
s.notes("""À DIRE : Le client ou l’équipe passe par un navigateur ; l’application Next.js sert les pages ; toutes les écritures et lectures sensibles passent par les Server Actions et les routes API ; Drizzle ORM écrit en SQL typé dans PostgreSQL. C’est côté serveur que sont appliqués les rôles, la validation et la limitation de débit. Brevo est un service d’e-mails transactionnels optionnel (sans clé, les messages sont rendus en HTML dans un dossier local). Aucune passerelle de paiement par carte n’est représentée : elle n’est pas intégrée.

SOURCES : src/db/index.ts (pool node-postgres, Drizzle) ; src/db/schema.ts ; src/actions/*.ts (Server Actions) ; src/app/api/ (routes) ; src/lib/email/brevo.ts ; docs/DEPLOYMENT.md (BREVO_API_KEY optionnelle).

TRANSITION → 11 : les cinq premiers nœuds se réduisent en repères de progression ; le nœud PostgreSQL s’élargit en grand cadre vide ; le connecteur pointillé devient le bord supérieur du cadre.""")

# ═══════════════════════════════════════════════════════════════ 11-15 · DIAGRAMMES
track_x = [7.0 + k * 1.0 for k in range(5)]
for n in range(11, 16):
    k = n - 11
    s = D.slide(CANVAS)
    furniture(s, n)
    ttl(s, f"Diagramme {k+1:02d} — À insérer", x=0.6, y=0.84, w=6.2, h=0.6, size=28)
    # frame et corners
    fx, fy, fw, fh = 0.6, 1.62, 12.13, 5.23
    s.rect("!!DiagramFrame", fx, fy, fw, fh, fill=WHITE, line=LINE, lw=1.0)
    s.line("!!NarrativePath", fx, fy, fx + fw, fy, color=INK, lw=1.5)
    for nm, (cx, cy) in [("TL", (fx, fy)), ("TR", (fx + fw, fy)), ("BL", (fx, fy + fh)), ("BR", (fx + fw, fy + fh))]:
        s.rect(f"!!Corner{nm}", cx - 0.08, cy - 0.08, 0.16, 0.16, fill=GREEN)
    # progress ticks
    tk = []
    for i in range(5):
        tk.append(s.rect(f"!!Node{i+1}", track_x[i] - 0.1, 1.05, 0.2, 0.2, fill=WHITE, line=INK, lw=1.5))
    for i, kk in enumerate("ABCD"):
        c = s.line(f"!!Link{kk}", 0, 0, 1, 0, color=INK, lw=1.0)
        c.begin_connect(tk[i], 3); c.end_connect(tk[i + 1], 1)
    s.rect("!!CleoSignal", track_x[k] - 0.1, 1.05, 0.2, 0.2, fill=GREEN)
    s.rect("Repère À insérer", 11.43, 1.0, 1.3, 0.3, fill=None, line=LINE2, lw=0.75, text=[dict(runs=[("À INSÉRER", {})], font=MONO, size=12, color=MUTED, spc=0.6, align="c")], anchor="m", inset=0.04)
    nxt = {11: "le même cadre se déplace d’un cran : seuls l’index et le repère de progression changent.", 12: "même cadre ; l’index et le repère avancent.",
           13: "même cadre ; l’index et le repère avancent.", 14: "même cadre ; l’index et le repère avancent.",
           15: "le cadre se replie en panneau sombre ; ses quatre coins verts et le trait supérieur deviennent la grille de la fiche technique."}[n]
    s.notes(f"""À DIRE : Diagramme {k+1:02d} — zone réservée. {'Le sujet du diagramme est à préciser par l’étudiant·e (diagramme de conception à insérer).' }
Aucun diagramme, acteur, relation ni séquence n’est dessiné ici volontairement : supprimer ou conserver le cadre blanc « !!DiagramFrame » et coller l’image du diagramme (ou un diagramme natif) à l’intérieur ; le cadre est volontairement identique sur les cinq diapositives.
Si les cinq diagrammes ne sont pas tous utilisés, supprimer la diapositive en trop : la transition Morph de la suivante restera valide.

TRANSITION → {n+1} : {nxt}""")
# ═══════════════════════════════════════════════════════════════ 16 · ENVIRONNEMENT
s = D.slide(CANVAS)
furniture(s, 16)
ttl(s, "Caractéristiques matérielles et environnement", x=0.6, y=0.84, w=12.1, h=0.62, size=30)
px, py, pw, ph = 0.6, 1.75, 4.6, 5.1
s.rect("!!DiagramFrame", px, py, pw, ph, fill=INK, line=None)
for nm, (cx, cy) in [("TL", (px, py)), ("TR", (px + pw, py)), ("BL", (px, py + ph)), ("BR", (px + pw, py + ph))]:
    s.rect(f"!!Corner{nm}", cx - 0.08, cy - 0.08, 0.16, 0.16, fill=GREEN)
s.tx("Étiquette logiciel", 0.95, 2.1, 3.9, 0.28, "ENVIRONNEMENT LOGICIEL", font=MONO, size=12, color=LINE2, spc=0.6)
s.tx("Pile logicielle", 0.95, 2.5, 3.9, 1.4, [dict(runs=[("Application Next.js", {})], size=24, bold=True, color=WHITE, after=6), dict(runs=[("Base PostgreSQL", {})], size=24, bold=True, color=WHITE)], size=24, color=WHITE)
s.rect("!!VideoStage", 0.95, 4.2, 3.9, 2.2, fill=None, line=LINE2, lw=1.0,
       text=[dict(runs=[("Accès par navigateur : client et équipe", {})], size=14, color=LINE2, align="c")], anchor="m", inset=0.3)
s.line("!!NarrativePath", 5.8, 1.75, 12.73, 1.75, color=INK, lw=1.5)
s.rect("!!CleoSignal", 5.8, 1.9, 0.16, 0.16, fill=GREEN)
s.tx("Groupe confirmé", 6.1, 1.86, 5, 0.28, "CONFIRMÉ PAR LE PROJET", font=MONO, size=12, color=GREEN, spc=0.6)
ys = [2.3, 3.05]
for y, (a, b) in zip(ys, [("CLIENT", "Smartphone ou ordinateur avec navigateur web"), ("ÉQUIPE", "Poste de travail et accès à l’administration")]):
    s.tx(f"Libellé {a}", 5.8, y + 0.08, 1.8, 0.3, a, font=MONO, size=13, color=MUTED, spc=0.6)
    s.tx(f"Valeur {a}", 7.6, y, 5.1, 0.7, b, size=18, bold=True, ls=1.0)
    s.line(f"Filet {a}", 5.8, y + 0.73, 12.73, y + 0.73, color=LINE, lw=0.75)
s.rect("Repère à préciser", 5.8, 4.0, 0.16, 0.16, fill=AMBER)
s.tx("Groupe à préciser", 6.1, 3.96, 5, 0.28, "À COMPLÉTER", font=MONO, size=12, color=AMBER, spc=0.6)
s.line("Filet groupe 2", 5.8, 4.33, 12.73, 4.33, color=INK, lw=1.0)
for i, (a, b) in enumerate([("PROCESSEUR", "[Processeur]"), ("MÉMOIRE", "[Mémoire]"), ("STOCKAGE", "[Stockage]"), ("HÉBERGEMENT", "[Hébergement]")]):
    y = 4.4 + i * 0.62
    s.tx(f"Libellé {a}", 5.8, y + 0.12, 1.8, 0.3, a, font=MONO, size=13, color=MUTED, spc=0.6)
    s.tx(f"Champ {a}", 7.6, y + 0.06, 3.3, 0.4, b, size=20, bold=True)
    s.tx(f"Statut {a}", 11.0, y + 0.13, 1.73, 0.3, "à préciser", font=MONO, size=12, color=AMBER, align="r")
    s.line(f"Filet {a}", 5.8, y + 0.6, 12.73, y + 0.6, color=LINE, lw=0.75)
s.notes("""À DIRE : Du côté client, un smartphone ou un ordinateur avec un navigateur suffit ; côté équipe, un poste de travail avec accès à l’administration. Côté logiciel : une application Next.js et une base PostgreSQL.

À COMPLÉTER AVANT LA SOUTENANCE (champs modifiables en ambre) : [Processeur], [Mémoire], [Stockage], [Hébergement]. Aucune valeur n’a été supposée et aucun hébergeur n’est cité tant qu’il n’est pas confirmé.

SOURCES : README.md (stack) ; docs/DEPLOYMENT.md (Node ≥ 20, PostgreSQL 17 recommandé — ces prérequis logiciels ne sont pas des caractéristiques matérielles).

TRANSITION → 17 : le petit cadre vide « Accès par navigateur » s’agrandit jusqu’à devenir la scène vidéo de la démonstration client. Aucune interface n’est simulée.""")

# ═══════════════════════════════════════════════════════════════ 17 · VIDÉO CLIENT
s = D.slide(CANVAS)
furniture(s, 17)
ttl(s, f"Interface client{NB}: démonstration vidéo", x=0.6, y=0.84, w=9.2, h=0.6, size=28)
SW, SH = 9.1, 5.12
s.rect("!!VideoStage", 0.6, 1.65, SW, SH, fill=INK, line=None,
       text=[dict(runs=[("Insérer ici la vidéo de l’interface client", {})], size=24, color=WHITE, align="c", bold=True)], anchor="m", inset=0.4)
s.line("!!NarrativePath", 10.05, 1.65, 10.05, 6.77, color=LINE2, lw=0.75)
s.rect("!!CleoSignal", 10.35, 1.65, 1.3, 0.1, fill=GREEN)
s.tx("Repère démo", 10.35, 1.95, 2.4, 0.28, "DÉMO 01 / 02", font=MONO, size=12, color=MUTED, spc=0.6)
s.tx("Parcours à montrer", 10.35, 2.55, 2.4, 3.2, [dict(runs=[("PARCOURS À MONTRER", {})], font=MONO, size=12, color=GREEN, spc=0.6, after=10)] +
     [dict(runs=[(t, {})], size=17, after=8) for t in ["Accueil et univers", "Catalogue et fiche produit", "Panier et commande", "Compte et suivi"]], size=17, ls=1.0)
s.notes("""À DIRE : Démonstration de l’interface client. Parcours suggéré : accueil et univers, catalogue et fiche produit, panier et commande (paiement à la livraison, virement ou carte cadeau), compte et suivi de commande.

À FAIRE : insérer la vraie vidéo de la vitrine (Insertion > Vidéo > Ce périphérique) par-dessus le rectangle sombre « !!VideoStage », puis le ranger à l’arrière-plan ou le supprimer. Aucune capture ni interface n’a été fabriquée dans cette présentation. Le parcours à droite est une suggestion modifiable.

TRANSITION → 18 : la scène vidéo glisse vers la droite, passe de l’encre au vert profond ; son libellé et la colonne de parcours basculent de « client » à « administration ».""")

# ═══════════════════════════════════════════════════════════════ 18 · VIDÉO ADMIN
s = D.slide(CANVAS)
furniture(s, 18)
ttl(s, f"Interface administration{NB}: démonstration vidéo", x=3.63, y=0.84, w=9.1, h=0.6, size=28)
s.rect("!!VideoStage", 3.63, 1.65, SW, SH, fill=DEEP, line=None,
       text=[dict(runs=[("Insérer ici la vidéo de l’interface d’administration", {})], size=24, color=WHITE, align="c", bold=True)], anchor="m", inset=0.4)
s.line("!!NarrativePath", 3.3, 1.65, 3.3, 6.77, color=LINE2, lw=0.75)
s.rect("!!CleoSignal", 0.6, 1.65, 1.3, 0.1, fill=GREEN)
s.tx("Repère démo", 0.6, 1.95, 2.4, 0.28, "DÉMO 02 / 02", font=MONO, size=12, color=MUTED, spc=0.6)
s.tx("Parcours à montrer", 0.6, 2.55, 2.5, 3.6, [dict(runs=[("PARCOURS À MONTRER", {})], font=MONO, size=12, color=GREEN, spc=0.6, after=10)] +
     [dict(runs=[(t, {})], size=17, after=8) for t in ["Poste de commande", "Produits et stocks", "Commandes et préparation", "Support et e-mails"]], size=17, ls=1.0)
s.notes("""À DIRE : Démonstration de l’interface d’administration, réservée à l’équipe et protégée par rôle. Parcours suggéré : poste de commande, produits et stocks, commandes et préparation, support et e-mails.

À FAIRE : insérer la vraie vidéo de l’administration par-dessus le rectangle vert profond « !!VideoStage ». Aucune interface d’administration n’a été fabriquée dans cette présentation.

TRANSITION → 19 : la scène vidéo se contracte et devient le cadre-viseur posé sur l’image de conclusion.""")

# ═══════════════════════════════════════════════════════════════ 19 · CONCLUSION
s = D.slide(CANVAS)
s.pic("Image comptoir", MAISON, 6.5, 0, W - 6.5, H, fx=0.52, fy=0.5, zoom=1.0)
furniture(s, 19, idx=dict(x=0.6, y=7.0, w=5.5, align="l"))
s.rect("!!VideoStage", 6.9, 0.4, 5.9, 6.7, fill=None, line=WHITE, lw=1.5)
ttl(s, ["DU COMPTOIR", "À LA", "PLATEFORME"], x=0.6, y=0.95, w=5.6, h=3.7, size=68, font=ANTON, bold=False, ls=0.85)
s.rect("!!CleoSignal", 0.6, 4.82, 1.4, 0.1, fill=GREEN)
s.line("!!NarrativePath", 0.6, 4.87, 6.1, 4.87, color=INK, lw=1.0)
s.tx("Bilan", 0.6, 5.12, 5.6, 1.8, [dict(runs=[("Une vitrine pour découvrir, commander et suivre.", {})], after=8),
                                    dict(runs=[("Une administration pour gérer catalogue, stocks, commandes et support.", {})], after=8),
                                    dict(runs=[("Une même base de données pour les deux parcours.", {})])], size=17, ls=1.0)
s.notes("""À DIRE : Ce projet a fait passer le comptoir de la parapharmacie à une plateforme : une vitrine pour découvrir, commander et suivre ; un espace d’administration pour gérer catalogue, stocks, commandes et support ; et une même base de données qui relie les deux parcours. Je n’avance aucun résultat commercial mesuré.

SOURCES : synthèse des diapositives 4 à 10 ; public/images/maison.jpg (image du « comptoir », visuel de campagne du projet).

TRANSITION → 20 : le titre se transforme en « MERCI POUR VOTRE ATTENTION » ; l’image se fond dans le still de campagne de la couverture ; le cadre-viseur reste en place.""")

# ═══════════════════════════════════════════════════════════════ 20 · CLÔTURE
s = D.slide(INK)
s.pic("Image campagne retour", HERO, 7.0, 0, W - 7.0, H, fx=0.46, fy=0.5, zoom=1.0)
furniture(s, 20, label=dict(x=0.6, y=0.85, w=5.6, h=0.9, size=44, spc=1.0, color=WHITE), idx=dict(x=0.6, y=6.95, w=5.6, align="l", color=LINE2))
s.rect("!!VideoStage", 7.35, 0.4, 5.6, 6.7, fill=None, line=WHITE, lw=1.5)
s.rect("!!CleoSignal", 0.6, 1.9, 4.4, 0.14, fill=GREEN)
ttl(s, ["MERCI POUR", "VOTRE", "ATTENTION"], x=0.6, y=2.3, w=6.2, h=4.1, size=76, font=ANTON, bold=False, color=WHITE, ls=0.85)
s.line("!!NarrativePath", 0.6, 6.55, 6.4, 6.55, color=GRAPHITE, lw=1.0)
s.notes("""À DIRE : Merci pour votre attention — je suis disponible pour vos questions.

Retour à l’identité de la couverture : marque Anton, trait vert, still de campagne (public/videos/posters/hero.jpg).

FIN : la dernière transition est une Morph comme les précédentes ; aucune diapositive après celle-ci.""")

# ═══════════════════════════════════════════════════════════════ transitions Morph
for n in range(2, 21):
    opt = "byWord" if n == 2 else "byObject"
    add_morph(D.slides[n - 1], opt, 900 if n in (2, 3, 20, 19) else 800)

# ═══════════════════════════════════════════════════════════════ export + post-traitement
OUT = os.path.join(os.path.dirname(__file__), "Cleopatre-PFE-Soutenance.pptx")
cp = D.prs.core_properties
cp.title = "Cléopâtre — Conception et réalisation d’une plateforme e-commerce pour une parapharmacie"
cp.subject = "Soutenance de PFE"; cp.author = ""; cp.language = "fr-FR"; cp.keywords = ""; cp.comments = ""
D.prs.save(OUT)

# thème : polices et couleurs du site
tmp = OUT + ".tmp"
with zipfile.ZipFile(OUT) as zi, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zo:
    for it in zi.infolist():
        data = zi.read(it.filename)
        if re.match(r"ppt/theme/theme\d+\.xml", it.filename):
            t = data.decode("utf8")
            t = re.sub(r'(<a:majorFont>\s*<a:latin typeface=")[^"]*"', r'\1Instrument Sans"', t)
            t = re.sub(r'(<a:minorFont>\s*<a:latin typeface=")[^"]*"', r'\1Instrument Sans"', t)
            for tag, val in [("dk1", INK), ("lt1", WHITE), ("dk2", GRAPHITE), ("lt2", CANVAS), ("accent1", GREEN), ("accent2", DEEP),
                             ("accent3", MUTED), ("accent4", LINE2), ("accent5", AMBER), ("accent6", LINE), ("hlink", GREEN), ("folHlink", MUTED)]:
                t = re.sub(rf'(<a:{tag}>)\s*<a:(?:srgbClr|sysClr)[^>]*?/>\s*(</a:{tag}>)', rf'\1<a:srgbClr val="{val}"/>\2', t)
            data = t.encode("utf8")
        zo.writestr(it, data)
os.replace(tmp, OUT)
print("écrit", OUT)
for w_ in WARN: print("ATTENTION", w_)
import pickle
pickle.dump({s.idx: {k: {kk: vv for kk, vv in v.items() if kk != "shape"} for k, v in s.reg.items() if k != "_fit"} for s in D.slides}, open("/tmp/reg.pkl", "wb"))
