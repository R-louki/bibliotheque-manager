# Décisions du propriétaire et pièges techniques

## Règles de travail (à respecter)

- **Pas d'invention de contenu religieux.** Le propriétaire n'est pas un savant et veut un texte fidèle : Coran (texte officiel), tafsirs al-Muyassar et as-Sa'di reproduits tels quels, hadiths **du Sahih al-Bukhari et du Sahih Muslim uniquement**, cités tels quels avec leur numéro. Pas de reformulation, pas de « messages » ajoutés. Le choix des versets/hadiths par thème est un jugement humain : toujours le soumettre à relecture, idéalement par une personne qualifiée.
- **Demander avant de publier.** Chaque publication (push du site `main`) passe par un accord explicite.
- **Vérifier après chaque publication** : le workflow GitHub Pages doit finir en `success` pour le bon commit, puis comparer le contenu en ligne au contenu local (les fichiers HTML se comparent après normalisation des fins de ligne CRLF/LF).
- **Réponses dans la langue du propriétaire** (arabe ou français). Il écrit parfois en dialecte tunisien.
- **Ne pas copier le contenu de tiers.** L'application « qalun.app » (images de pages) et le livre d'Adham Sharqawi sont protégés : on peut s'en inspirer, pas les reproduire.

## Choix techniques arrêtés

- **Comptage des versets : celui de Médine** (6 214 versets ; Fatiha 7 sans la basmala ; Baqara 285 avec « الم » intégré au verset 1). L'édition tunisienne scannée compte autrement (basmala = verset 1, Baqara 286) : on ne la suit pas. Le lien vers les tafsirs (comptage de Hafs) passe par `quran/map_to_hafs.json`.
- **Police du Coran : KFGQPC Qaloon v0.10** (`quran/fonts/KFGQPC-Qaloon-v0.10.ttf`). Le texte officiel utilise un codage propre à cette police (ex. ألف الوصل de « اهدنا ») que les autres polices rendent mal. **Sa licence (intégrée au fichier, copiée dans `quran/fonts/KFGQPC-LICENSE.txt`) autorise l'usage, la copie et la distribution gratuits mais interdit toute modification : servir le TTF tel quel, jamais de sous-ensemble ni de conversion.** Scheherazade New (OFL) reste en secours.
- **Mode pages immersif** : la page occupe tout l'écran, sans barre d'application ; tout le reste est dans le menu ☰ (sourates, signets enregistrés sur l'appareil, taille, aller à la page, lecture par sourate, plein écran, quitter). Le glissement horizontal utilise les **événements tactiles** (les événements « pointer » étaient peu fiables sur téléphone). Le sens est celui de l'arabe : glisser vers la droite = page suivante.
- Le build inclut le Coran par défaut ; `WITH_QURAN=0` le retire (et supprime `quran/` du site : **ne pas publier ainsi par erreur**).
- Les nouveaux textes d'interface passent par `i18n/<lang>/ui.json` (clé = chaîne française exacte, traduction EN et AR obligatoires).

## Pièges (Windows / PowerShell)

- `python -m http.server --directory <chemin avec accent>` échoue : utiliser `Start-Process ... -WorkingDirectory <dossier>`.
- Les processus lancés en arrière-plan peuvent s'arrêter : relancer et revérifier avant de conclure.
- Les avertissements git « LF will be replaced by CRLF » sont normaux.
- Écrire du JSON avec accents ou guillemets typographiques : le faire depuis un script Python (pas depuis des chaînes PowerShell).
- La zone de test du navigateur intégré refuse parfois `localhost` : ouvrir un nouvel onglet.
- Le service worker `sw.js` met en cache : après une publication, fermer et rouvrir l'appli sur le téléphone.
