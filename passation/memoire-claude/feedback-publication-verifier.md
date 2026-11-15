---
name: feedback-publication-verifier
description: "Après une publication GitHub Pages, vérifier que le site en ligne sert bien la nouvelle version"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 036338db-dc59-421b-9f19-99a974b8b426
  modified: 2026-11-12T22:09:56.478Z
---

Après un push, contrôler l'exécution « pages build and deployment » (api.github.com/repos/R-louki/bibliotheque-manager/actions/runs) et le contenu en ligne (marqueur dans index.html, VERSION de sw.js) avant de dire que c'est publié.

**Why:** le 11 novembre 2026, un déploiement a fini en `startup_failure` sans que je le voie ; l'utilisateur a constaté que son téléphone n'avait pas la nouvelle version. Un commit vide a relancé le déploiement.
**How to apply:** toujours vérifier après publication ; si échec, relancer par commit vide et re-vérifier. L'utilisateur aime aussi qu'on vérifie les maquettes à l'écran avant de les présenter.
