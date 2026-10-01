# Soutenance PFE — Cléopâtre (note de livraison)

**Fichier** : `Cleopatre-PFE-Soutenance.pptx` — 20 diapositives 16:9, entièrement modifiables (textes, formes, connecteurs, images recadrées).
**Régénération** : `python build_deck.py` · **contrôle** : `python verifier_deck.py` (20 diapos, Morph 2→20, noms `!!` communs et modifiés, cadres vides, images non déformées).

## À compléter
- Couverture (diapo 1) : `[Nom de l’étudiant·e]`, `[Encadrant]`, `[Établissement]`, `[Année universitaire]`.
- Diapo 16 : `[Processeur]`, `[Mémoire]`, `[Stockage]`, `[Hébergement]` (marqués « à préciser »).
- Diapos 11 à 15 : insérer les cinq diagrammes dans les cadres blancs `!!DiagramFrame` (laissés vides volontairement).

## Vidéos réelles à insérer
- **Diapo 17** — interface client (rectangle sombre `!!VideoStage`).
- **Diapo 18** — interface d’administration (rectangle vert profond `!!VideoStage`).

## Morph
- Transition Morph native (`p159:morph`) posée sur les diapos 2 à 20 (objets, sauf 1→2 mot à mot), sur clic, 0,8–0,9 s.
- Les objets continus portent des noms `!!` identiques (`!!CleoSignal`, `!!NarrativePath`, `!!MorphHeadline`, `!!ChapterIndex`, `!!ProjectLabel`, `!!VisualAnchor`, `!!DiagramFrame`, `!!VideoStage`…).
- **Lecture PowerPoint non vérifiée** dans cet environnement (aucune installation PowerPoint). La présence du XML et un rendu statique ne prouvent pas la lecture : à tester en diaporama (surtout 7→8, 9→10, 10→11, 15→16, 16→17).
- Dans PowerPoint antérieur à Morph, la diapositive retombe sur un fondu (repli standard du fichier).

## Polices
Anton, Instrument Sans, JetBrains Mono (dossier `polices/`, licence OFL). Si elles ne sont pas installées sur l’ordinateur de soutenance, PowerPoint les remplacera et les retours à la ligne pourront changer.

## Palette
Le brief demande le vert de marque `#075E46` / `#054537`. Le dépôt, lui, définit encore `#007AFF` comme signal (`globals.css`, README) et ne contient aucun vert : le deck suit le brief.
