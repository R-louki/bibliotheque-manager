---
name: project-coran-lecteur-prive
description: "Lecteur du Coran (Qalun) PUBLIÉ en ligne le 14 nov 2026 ; contrôles faits, limites restantes et garde-fous de build"
metadata:
  node_type: memory
  type: project
  originSessionId: 036338db-dc59-421b-9f19-99a974b8b426
  modified: 2026-11-14T15:20:30.007Z
---

Le lecteur du Coran (riwaya de Qalun, tafsirs al-Muyassar et as-Sa'di reproduits tels quels) est **en ligne** depuis le 14 novembre 2026 (commits `d8630d0` site, `1e000e0` sources). Il est derrière le compte comme tout le site. Le build inclut le Coran par défaut ; `WITH_QURAN=0` le retire (et supprime `quran/` du site : ne pas publier ainsi par erreur).

**Décision :** l'utilisateur a demandé de publier après une vérification approfondie, en connaissant les limites (voir ci-dessous).

**Contrôles faits avant publication :**
- 6 214 versets, effectifs identiques à ceux du mushaf imprimé (PDF fourni), aux données officielles du Complexe (v10) et à Quranpedia ; pagination PDF = données sur 601/604 pages.
- Texte final = données officielles + 4 corrections d'après le mushaf imprimé (2:71, 33:37, 34:23, 58:10) ; **aucune différence de lettre/signe avec Quranpedia**; mapping vers Hafs identique à Quranpedia sur 6 214 versets.
- Police : Amiri Quran n'a pas U+065E ni U+06D2 → police principale Scheherazade New (OFL, couvre les 63 signes).
- Tests : 114 sourates, 6 214 versets/marqueurs, tafsirs des deux sources, aucune erreur console ; 344 fichiers en ligne identiques par somme de contrôle.

**Limites restantes (dites à l'utilisateur) :** pas relu par un lecteur de Qalun ; signes de pause/tajwid non tous comparés au mushaf imprimé ; licences du Complexe (texte, police) et des tafsirs non confirmées (page développeurs du Complexe introuvable) → bandeau public avec adresse pro.loukil@gmail.com pour signaler une erreur ou demander un retrait.

**Police (15 nov 2026, local, pas encore publié) :** l'utilisateur a choisi la police officielle KFGQPC Qaloon (`quran/fonts/KFGQPC-Qaloon-v0.10.ttf`, servie TELLE QUELLE : sa licence intégrée autorise usage/copie/distribution gratuits mais interdit toute modification, donc ni sous-ensemble ni conversion woff2). Raison : le texte officiel utilise un codage propre à cette police (ألف الوصل de « اهدنا » mal rendue par Scheherazade, gardée en secours). Pas de licence confirmée pour le texte lui-même. L'utilisateur possède aussi une édition tunisienne scannée (627 p., comptage différent : basmala = verset 1, البقرة 286) et l'appli « qalun.app » (images de pages, droits tiers : ne pas copier) ; nous restons sur le comptage de Médine.

**Why:** sujet sensible, l'utilisateur veut un texte fidèle sans reformulation.
**How to apply:** toute correction du texte doit se justifier par le mushaf imprimé ; après chaque publication vérifier le déploiement (voir [[feedback-publication-verifier]]) ; voir [[project-coran-qalun]].
