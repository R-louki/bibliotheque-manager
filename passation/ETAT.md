# État du projet — 15 novembre 2026

Dernier état publié : site `main` = `36e6779`, sources `sources` = `d41e2ff` (puis ce dossier `passation/`).
Site : https://r-louki.github.io/bibliotheque-manager/ (FR, `/en/`, `/ar/`).

## Fait et en ligne

- 4 sections (Business 40 livres, Islamiques, Scientifiques, Histoire), accueil immersif plein écran, responsive téléphone/tablette/PC, FR/EN/AR.
- **Coran en riwaya de Qalun** (arabe seul) : texte officiel du Complexe du Roi Fahd v10 + 4 corrections d'après le mushaf imprimé (2:71, 33:37, 34:23, 58:10) ; tafsir au toucher d'un verset (al-Muyassar et as-Sa'di, reproduits tels quels).
- **Mode pages** (604 pages), plein écran, glissement horizontal tactile, menu ☰ (sourates, signets locaux, taille, page, lecture par sourate, plein écran), reprise de la dernière page, police officielle KFGQPC Qaloon servie telle quelle.
- Traductions EN/AR de toute l'interface, y compris le menu du Coran.

## En attente d'une décision du propriétaire

1. **Étoiles ۞ (علامة الحزب) mal placées dans les données officielles.** En comparant les 604 pages du mushaf imprimé de Médine (PDF) aux données, 316 des 440 étoiles sont au bon verset et **124 sont décalées de 1 à 3 versets** (ex. 4:137 imprimé contre 4:139 dans les données ; 2:101 contre 2:100 ; 3:26 contre 3:23). Vérifié à l'œil sur 3 cas. Le texte des versets n'est pas touché, seule la position du signe. La liste est dans `donnees/etoiles_hizb_ecarts.json` (`imprime_seul` = où l'étoile doit aller, `donnees_seul` = où elle est aujourd'hui). 5 pages non tranchées : 1, 2, 141, 381, 589. **Proposition faite : déplacer les 124 signes après relecture visuelle de chaque cas. Le propriétaire n'a pas encore répondu.** Méthode : `outils/etoiles/` (détection par corrélation d'image du glyphe étoile et de l'anneau des numéros de versets dans le PDF).
2. **Fonction « تأمل اليوم »** (expérience de lecture proche du livre « رسائل من القرآن » d'Adham Sharqawi, mais avec des sources fiables) : une carte par jour = thème + verset (texte Qalun) + tafsir al-Muyassar et as-Sa'di tels quels + **hadith des deux Sahih uniquement**, + bouton « suivant », signet, rappel quotidien facultatif. La **liste de 85 cartes** est dans `tamal/cartes_tamal.py` (variable `C` : thème, sourate, versets en comptage de Hafs, extrait du hadith, source B/M). Le propriétaire doit relire la liste (supprimer/remplacer des cartes) avant que la fonction soit construite. Réglages connus : certains hadiths débordent sur la suite de la narration (cartes « الصحة والفراغ », « اليد العليا », « طاعة الرسول ») ; les hadiths de Muslim sont cités par numéro de livre + numéro dans le livre de la base utilisée, pas par la numérotation de Fouad Abdelbaqi.
3. Choix de la police et du mushaf tunisien : tranché (police KFGQPC, comptage de Médine), voir `DECISIONS.md`.

## Points ouverts (à garder en tête)

- Le texte n'a **pas été relu par un lecteur de Qalun**. Licences du **texte** du Complexe et des tafsirs non confirmées : le bandeau public indique `pro.loukil@gmail.com` pour signaler une erreur ou demander un retrait.
- La liste des cartes « تأمل اليوم » est un choix humain à faire relire par une personne qualifiée.
- Vérifier avec le propriétaire que la connexion Google marche de bout en bout.
- Ancien client OAuth inutile (`883241528093-…`) dans le projet Firebase « Fahim » : à supprimer si le propriétaire le souhaite.
- L'installation sur téléphone : le manifeste est en `standalone` (pas de barre d'adresse une fois installée). Dans le navigateur, le menu ☰ propose « Plein écran ».

## Idées évoquées mais non lancées

- Plus de livres islamiques (le propriétaire développera cette section petit à petit ; cadrer sources/ton avant tout livre). Pistes citées : Arba'in an-Nawawi, Riyad as-Salihin, sira (ibn Hisham, Raheeq al-Makhtoum), « التبيان في آداب حملة القرآن » du Nawawi (page « آداب القراءة » dans le menu ☰), signets synchronisés entre appareils (aujourd'hui seulement sur l'appareil).
- Fonction « بطاقة نبي » : réunir les passages où un prophète est cité dans le Coran, avec liens vers les pages.
