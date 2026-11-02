# Bibliothèque du Manager

Livres de management en cartes mentales interactives et en lectures d'environ 45 minutes.
Chaque lecteur crée un compte gratuit (e-mail et mot de passe) et retrouve sa progression sur tous ses appareils.

## Fonctions
- Cartes mentales et fiches de lecture approfondies
- Compte personnel : livres lus, position de lecture, marque-pages, surlignages et notes synchronisés
- Carnet de notes avec export, tableau de bord (temps de lecture, série, objectif mensuel)
- Recherche dans tout le contenu, réglages de lecture (taille, thème clair/sépia/sombre, largeur), lecture audio
- Application installable sur téléphone, lecture hors connexion

## Technique
- Site statique : GitHub Pages (`index.html`, `sw.js`, `manifest.webmanifest`)
- Comptes et données : Supabase (table `reading_progress`, protégée par des règles RLS)
- Les copies PDF ajoutées par un lecteur restent sur son appareil.
