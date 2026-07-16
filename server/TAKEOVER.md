# Reprise en main du serveur Python (`server/`)

> Guide de passation — le co-fondateur qui a écrit ce service est parti. Ce
> document explique **où le service tourne, comment le lancer, et ce qu'il faut
> récupérer/vérifier en priorité** pour en reprendre le contrôle.

## TL;DR

- Le service est une **API FastAPI (Python 3.11)** qui exécute le pipeline d'audit GEO.
- Il tourne en **prod sur un cluster Kubernetes Infomaniak** (voir `KUBE_SETUP.md`),
  exposé sur l'IP **`83.228.202.11`** (port 80 → conteneur 8080).
- L'image Docker est **`s4m0s/audit-syb`** sur Docker Hub (compte `s4m0s`).
- Il partage la **même base MongoDB Atlas** que le site Next.js. Le site crée un
  document `audit`, appelle `POST /audit`, et le serveur écrit les résultats dans
  la même base.

## 🔴 À récupérer / vérifier EN PRIORITÉ (accès co-fondateur)

Ces accès étaient probablement au nom du co-fondateur. Sans eux tu ne peux ni
redéployer ni faire tourner de vrais audits :

1. **Compte Docker Hub `s4m0s`** — l'image `s4m0s/audit-syb` y est hébergée (privée).
   - Récupère les identifiants, OU pousse une nouvelle image vers **ton propre**
     registre (Docker Hub perso, GHCR…) et mets à jour `image:` dans `kube.yaml` +
     le secret `dockerhub-secret`.
2. **Kubeconfig Infomaniak** (contexte `kubernetes-admin@pck-6mbtghh`) — nécessaire
   pour `kubectl` (logs, redéploiement, secrets). Récupère-le depuis le panel
   Infomaniak ou auprès du co-fondateur.
3. **Vraies clés API IA en prod.** ⚠️ D'après `KUBE_SETUP.md`, le secret K8s
   `audit-syb-env` contenait des clés IA **« Mock » (valeurs bidon)**. Si c'est
   toujours le cas, **le serveur en prod ne peut pas lancer de vrais audits** :
   il faut au minimum 2 moteurs qui répondent (`MIN_ENGINES_REQUIRED=2`), donc des
   clés OpenAI + Anthropic + Gemini + Perplexity **réelles**. Voir « Mettre à jour
   les clés » dans `KUBE_SETUP.md`.
4. **Accès MongoDB Atlas** (compte + IP whitelist) — le `MONGODB_URI` doit être le
   même que celui du site.

## Architecture & pipeline

```
Next.js  ──POST /audit (Bearer PROCESSING_SERVICE_API_KEY)──▶  FastAPI (server/)
                                                                   │
   prompt_generator ─▶ ai_executor (4 moteurs en //) ─▶ mention_detector
        ─▶ scoring ─▶ html_scanner (W3C + schema.org + TF-IDF) ─▶ competitor_comparison
                                                                   │
                                          écrit results dans MongoDB (collection `audits`)
```

- **Auth :** tout endpoint (sauf `/health`) exige `Authorization: Bearer <PROCESSING_SERVICE_API_KEY>`.
  Un middleware « silencieux » ferme la connexion (444) sans indice si le token est absent/faux.
- **Endpoints :** `GET /health`, `POST /audit`, `POST /audit/:id/approve-prompts`,
  `POST /html-scan`, routes GSC. Docs interactives sur `/docs` (protégées par le token).
- **Modes de fonctionnement** (variables d'env, pratiques pour tester sans coût) :
  - `MOCK_AI=true` → réponses IA factices déterministes (aucun appel réel, aucune clé requise).
  - `USE_LOCAL_AI=true` → tous les moteurs routés vers Ollama local (`OLLAMA_MODEL`).
  - `USE_CLAUDE_CODE_LOCAL=true` → routé vers le CLI `claude` local (utilise l'abonnement).
  - Par défaut → vrais appels API, `MIN_ENGINES_REQUIRED=2`.

## Lancer en local

### Option A — sans clés IA (recommandé pour reprendre la main rapidement)

```bash
cd server
cp .env.example .env
# Édite .env : mets MONGODB_URI + PROCESSING_SERVICE_API_KEY, puis ajoute :
#   MOCK_AI=true
docker compose up --build      # depuis la racine du repo : http://localhost:8080
```

Avec `MOCK_AI=true`, seules `MONGODB_URI` et `PROCESSING_SERVICE_API_KEY` sont
requises — tu peux dérouler tout le pipeline (et l'admin human-in-the-loop) sans
dépenser un centime d'API.

### Option B — avec de vraies clés

Remplis les 4 clés IA dans `server/.env` puis `docker compose up --build`.

### Vérifier que ça tourne

```bash
curl http://localhost:8080/health
# → {"success": true, "data": {"status": "healthy"}}
```

## Déployer / redéployer en prod (Infomaniak K8s)

Voir `KUBE_SETUP.md` pour le détail. En résumé :

```bash
# 1. (si tu changes le code) rebuild + push l'image
docker build --platform linux/amd64 -t <ton-registre>/audit-syb:0.0.3 server/
docker push <ton-registre>/audit-syb:0.0.3
# 2. mets à jour image: dans server/kube.yaml, puis
kubectl apply -f server/kube.yaml -n default
kubectl rollout restart deployment/audit-syb -n default
kubectl logs -f deployment/audit-syb -n default
```

## ⚠️ Points à vérifier (dettes / incohérences repérées)

- **Clés IA « Mock » en prod** (cf. plus haut) — probablement la raison n°1 pour
  laquelle des audits réels ne se termineraient pas.
- **Tag d'image incohérent** : `kube.yaml` référence `s4m0s/audit-syb:0.0.2` alors
  que `KUBE_SETUP.md` parle de `0.0.1`. Vérifie quelle image tourne réellement
  (`kubectl describe pod`).
- **Nom de base MongoDB** : `config.py` utilise `get_client()["showyourbrand"]`
  (minuscules) tandis que la doc/URI mentionnent `ShowYourBrand`. Les noms de base
  Mongo sont **sensibles à la casse** — vérifie que le serveur Python et le site
  Next.js écrivent bien dans **la même** base (sinon les audits n'apparaîtront pas
  côté site).
- **Registre au nom du co-fondateur** (`s4m0s`) — migre l'image vers un registre
  que tu contrôles dès que possible.
