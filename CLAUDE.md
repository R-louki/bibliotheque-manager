# La Bibliothèque du Manager — sources & passation

Ce fichier sert de mémoire du projet pour reprendre le travail dans une nouvelle session Claude (Claude Code ou claude.ai) sur un autre compte.

## Le projet en bref
- Site : https://r-louki.github.io/bibliotheque-manager/ (FR), `/en/`, `/ar/` (arabe, RTL).
- Dépôt GitHub : `R-louki/bibliotheque-manager`
  - branche `main` = **site généré** (servi par GitHub Pages, ne pas éditer à la main sauf `confidentialite.html`, `README.md`, `icons/`, `vendor/`, `manifest.webmanifest`).
  - branche `sources` = **ce dossier** : les sources et le générateur.
- 40 livres de management / compétences / sciences humaines : fiche complète, carte mentale (SVG), quiz, parcours, statistiques, notes, communauté.
- Comptes : Supabase (projet `tujlyauskqaqwgeppdnj`, clé publishable dans `build.py`) — e-mail + **Google** (OAuth client « bibliotheque-du-manager » sur Google Cloud, app en production ; le secret est stocké côté Supabase uniquement, **jamais dans le dépôt**).
- Contact / propriétaire : pro.loukil@gmail.com. Page confidentialité bilingue : `main/confidentialite.html`.

## Arborescence (branche `sources`)
- `books/<id>.txt` — fiche FR d'un livre. Format :
  - en-tête `clé: valeur` (id, t, o, a, y, cat, p, c, center, pitch)
  - `=== Branche` (8 branches), `--- Nœud`, `kw: a · b · c`, paragraphes, listes `- `, encadrés `> Label | texte` (labels : À retenir, Exercice, Question clé, Question de réflexion, Parcours conseillé).
- `quizzes.json` — quiz FR.
- `template.html` + `map.js`, `step1.js`, `step2.js`, `step3.js`, `pwa.py` — appli (une seule page).
- `i18n/<en|ar>/ui.json` — traductions de l'interface.
- `i18n/<lang>/books/<id>.json` — titres, mots-clés, quiz traduits (40/40 faits).
- `i18n/<lang>/full/<id>.txt` — **texte complet traduit** (même format que `books/` sans l'en-tête). Doit avoir exactement le même nombre de branches et de nœuds que la fiche FR, dans le même ordre. Les labels d'encadrés restent en français (`> À retenir |` …) : l'interface les traduit.

## Sections et accueil immersif
- Chaque fiche peut avoir `section: Business | Islamiques | Scientifiques | Histoire` (défaut : Business, voir `build.py`). `cat` reste la sous-catégorie ; `catId` (FR, ajouté par `build.py`) sert aux icônes.
- L'accueil est un « hall » plein écran (`#hall` dans `template.html`, bloc « Accueil immersif ») : une scène illustrée par section, glissement entre sections, carrousel de thèmes. Toucher un thème ou « Voir les N livres » ouvre la liste existante (mode `browse`, filtres `sec`/`cat`) ; « ← Sections » revient au hall.
- Les sections sans livre affichent des thèmes provisoires (`H_PH`) ; ils s'effacent dès qu'un livre y est ajouté. Textes et noms traduits via `i18n/*/ui.json`.
- Format libre : pas de nombre de branches ni de durée imposés (le temps de lecture vient du nombre de mots). Le futur champ `format: parcours` est prévu pour les textes longs.
- Section Islamiques : à cadrer avec le propriétaire (sources, école, ton) avant tout livre.
- Pour tester en local sans compte : ouvrir la page puis masquer `#auth` dans la console.

## Construire et publier
```bash
git clone -b sources https://github.com/R-louki/bibliotheque-manager build
git clone -b main    https://github.com/R-louki/bibliotheque-manager bibliotheque-manager
cd build && python3 build.py          # écrit dans ../bibliotheque-manager (ou SITE_DIR=...)
# vérifier : aucune ligne « ! structure différente » ; ligne « N textes complets »
cd ../bibliotheque-manager && git add -A && git commit -m "..." && git push   # Pages se déploie seul
cd ../build && git add -A && git commit -m "..." && git push                  # sauvegarder les sources
```
Test local : `cd bibliotheque-manager && python3 -m http.server 8765`.

## État au 3 novembre 2026
Fait : étapes 1–3 (appli, apprentissage, communauté), étape 4 (EN/AR de l'interface, des métadonnées, cartes et quiz ; connexion Google en ligne).

**Terminé — traduction intégrale des fiches (demande : « la traduction en anglais, arabe concerne aussi les livres, tout »)**
- Faits (EN + AR) — 40/40 : womack-lean, liker, goldratt, ohno, rother-shook, rother-kata, drucker-eff, grove, scott, lencioni, collins, sinek, covey, goldsmith, kahneman, christensen, ocean, drucker-mgmt, zhuo, marquet, doerr, horowitz, mcchrystal, carnegie, patterson, voss, cialdini, newport, clear, dehaene, brown, young, ericsson, dweck, harari, frankl, lebon, taleb, csikszentmihalyi, morel.
- Reste à faire — 0.
- Méthode : lire `books/<id>.txt`, écrire `i18n/en/full/<id>.txt` puis `i18n/ar/full/<id>.txt`, lancer `build.py`, publier (un commit par livre : « Texte complet traduit (EN, AR) : <titre original> »).
- Conventions : en anglais, citer les autres livres par leur titre original anglais ; en arabe, titre traduit entre guillemets « » (et titre original en italique la première fois) ; noms propres translittérés de façon cohérente (دراكر، غروف، لنسيوني، كولينز، كانمان…).

## Points ouverts
- Vérifier avec l'utilisateur que la connexion Google fonctionne de bout en bout.
- Un ancien client OAuth inutile (883241528093-…) existe dans le projet Firebase « Fahim » : à supprimer si l'utilisateur le souhaite.
