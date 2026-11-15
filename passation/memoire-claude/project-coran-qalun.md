---
name: project-coran-qalun
description: "Premier livre de la section Islamiques = Coran en arabe seul, riwaya de Qalun ; source, contrôles faits et décisions en attente"
metadata:
  node_type: memory
  type: project
  originSessionId: 036338db-dc59-421b-9f19-99a974b8b426
  modified: 2026-11-13T00:00:32.318Z
---

Premier livre de la section Islamiques : le Coran, **arabe seul, riwaya de Qalun (عن نافع)**, lecture **par sourate façon mushaf** (liste des 114 sourates, texte grand, reprise de lecture, marque-pages ; pas de carte mentale ni de quiz). Décidé le 12 novembre 2026.

**Règle absolue :** ne jamais saisir ni reformuler le texte coranique de mémoire ; seulement l'importer par programme d'une source puis le contrôler.

**Source choisie (par l'utilisateur) :** Wikisource arabe, module de données `وحدة:Quran/data Qaloun.json` (révision 519676, 2 février 2025) = mushaf de Médine, riwaya de Qalun. 114 sourates, 6 218 versets, un seul appel API. Noms de sourates dans `وحدة:Quran/data general`. Wikisource limite la cadence (erreur 429) : attendre ≥ 1,2 s entre pages.

**PDF de référence fourni par l'utilisateur (13 nov 2026) :** `C:\Users\prolo.MYRA\Downloads\quran-qalun-mushaf.pdf` (605 pages = couverture + 604 pages du mushaf de Médine, produit par pdf.quran.ws, 180 Mo, sans couche texte : tout est vectoriel). Les marqueurs de fin de verset sont des dessins comptables avec PyMuPDF (cadre de 271/272 éléments + dessin du chiffre). Comparaison faite : 108/114 sourates identiques ; le PDF imprime 175 (An-Nisa), 134 (Taha), 62 (An-Nur) alors que Wikisource avait 176/135/64. Correction par fusion de versets : An-Nisa 44+45, Taha 86+87, An-Nur 36+37 et 43+44 → **total 6 214** (compte de Médine). Texte corrigé dans `quran/qalun.json` (sources) ; mot à mot toujours non relu (seulement ~40 fins de versets comparées visuellement).

**Source finale retenue (13 nov 2026) :** données officielles du Complexe du Roi Fahd, « Uthmanic Qaloon Data v10 » (dépôt GitHub `thetruetruth/quran-data-kfgqpc`, `qaloon/data/QaloonData_v10.json`, 6 214 versets avec page, lignes, juz'), qui donnent 175/134/62 pour Nisa/Taha/Nur comme le PDF. Pagination du PDF = données officielles sur 601 pages sur 604. Comparaison de 77 430 mots avec la copie Wikisource : seulement 5 versets diffèrent vraiment ; tranchés avec le PDF → officiel retenu sauf 33:37 et 34:23 (Wikisource retenu). Fichier final `quran/qalun.json` (avec page/ligne par verset) + `quran/map_to_hafs.json` + scripts dans `quran/tools/`. La police officielle `qaloon.10.ttf` est dans le même dépôt ; **licences du texte et de la police toujours à confirmer** (page développeurs du Complexe introuvable, 404). Le dépôt `risan/quran-json` fournit aussi un mapping `number_in_hafs` (CC BY-SA 4.0) pour recouper le nôtre.

**Contrôles faits (avant le PDF) :** 110/114 sourates comparées aux pages Wikisource (109 concordent ; An-Nahl : note de page 127 mais 128 versets, module juste) ; 4 restent à comparer ; aucun verset vide ; similarité lettre à lettre avec Hafs 98,1 %.

**Reste ouvert :** total 6 218 non confirmé face au décompte attendu de Médine (6 214 ou 6 217) ; relecture par une personne qui lit Qalun ; comparaison avec le fichier officiel du Complexe du Roi Fahd (dm.qurancomplex.gov.sa) ; police (Amiri Quran libre rend bien les signes de Qalun ; police officielle KFGQPC Qaloun : licence à confirmer) ; mentions de source et de licence à afficher. Ne rien publier avant ces validations.

**Tafsir (13 nov 2026) :** l'utilisateur veut qu'un toucher sur un verset affiche son tafsir, en une **nouvelle version simplifiée** fondée sur les tafsirs les plus sûrs. Les numéros de versets de Qalun (compte de Médine) diffèrent de Hafs : seulement 3 505 versets sur 6 218 ont le même numéro (2 639 décalés, 74 couvrent deux versets de Hafs) → toujours relier par alignement lettre à lettre (`map_qalun_to_hafs.json` dans le scratchpad de la session), jamais par numéro. Sources ouvertes disponibles : API alquran.cloud (Muyassar, Jalalayn, Qurtubi, Baghawi, Waseet, Miqbas) et CDN jsdelivr `spa5k/tafsir_api` (Tabari, Ibn Kathir, Sa'di, Qurtubi, Baghawi, Ibn 'Ashur, etc. ; licences à vérifier). Pilote validé : Fatiha, Ikhlas, 'Asr, Falaq, Nas (25 versets Hafs), écrit uniquement d'après les textes lus, avec les sources par verset ; **aucun relecteur pour l'instant → rien ne se publie**.

**Why:** sujet sensible, l'utilisateur veut le développer petit à petit.
**How to apply:** toute intégration du Coran doit montrer l'état de vérification, citer la source, et attendre l'accord explicite avant publication. Voir [[feedback-publication-verifier]].
