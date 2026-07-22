# Test Plan — Recommandations data-driven + bouton « Relancer un run » (PR #19)

Env: build prod local (`npm start`) + Mongo local, projet réel **Les Chandelles**
(`/app/6a6079d746d27262b3294ec0`, `isReal=true`, non-demo). Compte `demo@leschandelles.fr`.

## What changed (user-visible)
- Ancienne page reco = 3 tips génériques par moteur.
- Nouvelle page = 5 blocs data-driven : Plan d'action priorisé, Requêtes à gagner,
  Sources à conquérir, Optimisations techniques GEO (llms.txt / robots.txt live / FAQ+JSON-LD /
  descriptions), Actions par moteur.
- Bouton « Relancer un run » dans l'en-tête du dashboard projet.

## Test 1 — Recommandations montre du contenu spécifique au projet (pas générique)
Page: `/app/6a6079d746d27262b3294ec0/recommendations`
- **Plan d'action priorisé** : au moins 3 cartes, chacune avec un badge priorité (URGENT/IMPORTANT),
  un badge **« +N pts estimés »** (N nombre), un « Effort : … », et des icônes moteur.
  PASS si une carte référence explicitement une donnée du projet (ex. « Claude (13%) », « reddit.com »).
  FAIL si on ne voit que 3 titres génériques sans points/effort.
- **Requêtes à gagner** : cartes par prompt avec statut (Partielle/Perdue), ligne « Cité par » +
  « Absent sur » avec icônes moteur, et une **Action** qui nomme une source (ex. « reddit.com »,
  « sortiraparis.com ») ou un concurrent (ex. « Le 41 »). PASS si ≥1 carte nomme une source/concurrent réel.
- **Sources à conquérir** : tableau listant des domaines (reddit.com, sortiraparis.com) avec colonne
  « Requêtes » (nombre) et lien « Voir ». PASS si ≥1 ligne présente.

## Test 2 — Optimisations techniques GEO (le différenciateur + live robots check)
Même page, scroll vers le bloc « Optimisations techniques GEO ».
- **llms.txt** : bloc de code contenant `# Les Chandelles` et l'URL `leschandelles.com`. Bouton « Copier ».
- **robots.txt** : chips des 5 bots (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended)
  colorés vert (autorisé) / rouge (bloqué). PASS si le check reflète le **vrai** robots.txt du site.
  Le robots.txt Squarespace de leschandelles.com liste les bots IA dans un groupe partagé avec `*`
  dont les `Disallow` ne visent que des sous-chemins (`/config`, `/search`…) — la racine `/` n'est
  donc pas bloquée : **attendu = les 5 bots en vert (autorisés)** + note « Tous les crawlers IA
  suivis sont autorisés ✔ ». Ceci prouve un fetch live parsé correctement, pas du texte en dur.
- **Copie** : cliquer « Copier » sur le bloc llms.txt → le libellé passe à « Copié » (assertion visuelle).
- **FAQ + JSON-LD** : ≥1 question repliable + bloc JSON-LD contenant `"@type": "FAQPage"`.
- **Descriptions** : une meta description + ≥3 phrases-descripteurs, dont une nommant un concurrent réel.

## Test 3 — Bouton « Relancer un run » (état de chargement)
Page: `/app/6a6079d746d27262b3294ec0`
- L'en-tête affiche un bouton **« Relancer un run »** (à côté de « Exporter en PDF »).
- Clic → le bouton passe en état chargement (« Run en cours… » + spinner) et est désactivé.
  PASS si l'état loading est visible puis la page se rafraîchit sans erreur.
  FAIL si aucun changement d'état / erreur affichée.
