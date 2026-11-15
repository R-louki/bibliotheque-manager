# Passation — reprendre le projet avec un autre compte Claude ou un autre PC

Ce dossier contient tout ce qu'il faut pour continuer sans perdre le fil. Il est versionné sur la branche `sources`.

## Démarrage en 5 minutes

1. **Installer** : Git, Python 3, Claude Code (ou ouvrir claude.ai).
2. **Cloner côte à côte** (le build écrit dans `../bibliotheque-manager`) :
   ```bash
   git clone -b sources https://github.com/R-louki/bibliotheque-manager build
   git clone -b main    https://github.com/R-louki/bibliotheque-manager bibliotheque-manager
   ```
3. **Construire et tester** :
   ```bash
   cd build && python build.py
   cd ../bibliotheque-manager && python -m http.server 8765
   ```
   Ouvrir `http://localhost:8765/`. Sur `localhost`, l'écran de connexion est masqué.
4. **Ouvrir Claude Code dans le dossier `build`** : il lit `CLAUDE.md` automatiquement.
5. **Coller le texte de `PROMPT_DE_REPRISE.md`** comme premier message : Claude lit l'état du projet (`ETAT.md`), recharge les décisions (`DECISIONS.md`) et reprend là où on s'est arrêté.

## Contenu du dossier

| Fichier / dossier | Rôle |
|---|---|
| `PROMPT_DE_REPRISE.md` | Premier message à coller dans la nouvelle session |
| `ETAT.md` | Où en est le projet, ce qui est fait, ce qui attend une décision |
| `DECISIONS.md` | Règles et choix du propriétaire (à respecter), pièges techniques |
| `memoire-claude/` | Copie de la mémoire de l'ancien compte (à réimporter, voir ci-dessous) |
| `tamal/cartes_tamal.py` | Génère la page de revue des cartes « تأمل اليوم » (liste des 85 cartes dans la variable `C`) |
| `outils/etoiles/` | Scripts de comparaison des étoiles ۞ du mushaf imprimé avec les données |
| `donnees/etoiles_hizb_ecarts.json` | Résultat : les 124 étoiles dont la position diffère du mushaf imprimé |

## Réimporter la mémoire dans le nouveau compte

La mémoire de Claude est locale à chaque compte et à chaque dossier. Dans la nouvelle session, dites :
« Lis les fichiers de `passation/memoire-claude/` et enregistre-les dans ta mémoire. »

## Ce qui n'est PAS dans le dépôt (à récupérer à part)

- Le PDF du mushaf de référence (Médine, riwaya de Qalun) : `quran-qalun-mushaf.pdf` (dossier Téléchargements de l'ancien PC). Ignoré par git. Sans lui, la comparaison visuelle avec le mushaf imprimé n'est pas possible.
- L'édition tunisienne scannée (627 pages, 446 Mo) : fournie par le propriétaire, jamais versionnée.
- `quran/tools/` : anciens scripts de vérification avec chemins locaux, ignorés par git.
- Les clés : la clé Supabase *publishable* est dans `build.py` (publique par conception). Le secret du client Google OAuth est **uniquement** chez Supabase. Aucun secret n'est dans le dépôt, n'en ajoutez pas.

## Données externes utilisées par les scripts (à retélécharger si besoin)

- Hadiths (Sahih al-Bukhari et Sahih Muslim, arabe), pour les cartes « تأمل اليوم » :
  `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.min.json` et `.../ara-muslim.min.json`
- Tafsirs al-Muyassar et as-Sa'di : déjà dans `quran/tafsir/` (source `spa5k/tafsir_api` via jsdelivr).
- Texte du Coran en riwaya de Qalun : déjà dans `quran/qalun.json`.

Les scripts de `tamal/` et `outils/etoiles/` contiennent des **chemins Windows en dur** (dossier du projet, dossier temporaire). Adaptez les constantes en tête de fichier (`B`, `H`, chemins du PDF) avant de les lancer.
