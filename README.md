# ATOMIC TV — addon Stremio sur Vercel

## Déploiement
1. Envoie ces fichiers dans un dépôt GitHub.
2. Importe le dépôt dans Vercel.
3. Dans Project Settings → Environment Variables, ajoute `TMDB_TOKEN` avec ton nouveau jeton TMDB.
4. Redéploie.

Ne mets jamais le jeton dans le code ou dans GitHub. Comme le jeton précédent a été partagé dans une conversation, régénère-le avant usage.

## Tests
Remplace TON-ADDON.vercel.app par ton domaine :
- `/manifest.json`
- `/catalog/movie/atomic_popular_movies.json`
- `/catalog/series/atomic_popular_series.json`
- `/meta/movie/tmdb:550.json`

Ce service fournit un catalogue et des métadonnées, pas les vidéos des films. Ajoute uniquement des flux vidéo dont tu possèdes les droits. Vérifie les conditions TMDB pour ton usage, notamment commercial.
