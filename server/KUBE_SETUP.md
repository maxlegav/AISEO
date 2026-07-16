# Kubernetes Setup — Infomaniak

## Cluster Info

- **Provider**: Infomaniak Public Cloud Kubernetes
- **Context**: `kubernetes-admin@pck-6mbtghh`
- **Namespace**: `default`
- **Node**: `pck-6mbtghh-pne-cggtp-xnt6n` (amd64, Ubuntu 24.04)

## Service Access

| Resource | Value |
|----------|-------|
| External IP | `83.228.202.11` |
| Port | `80` (→ container `8080`) |
| Service type | LoadBalancer |
| Image | `s4m0s/audit-syb:0.0.2` (linux/amd64) — must match `image:` in `kube.yaml` |

### Test the API

```bash
curl -H "Authorization: Bearer <PROCESSING_SERVICE_API_KEY>" http://83.228.202.11/health
```

## Kubernetes Secrets

### `dockerhub-secret` (docker-registry)

Permet au cluster de pull l'image privée depuis Docker Hub (compte `s4m0s`).

```bash
kubectl create secret docker-registry dockerhub-secret \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=s4m0s \
  --docker-password='<DOCKER_HUB_ACCESS_TOKEN>' \
  -n default
```

### `audit-syb-env` (env vars)

Variables d'environnement injectées dans le pod via `envFrom`.

| Variable | Status |
|----------|--------|
| `MONGODB_URI` | Real (Atlas) |
| `PROCESSING_SERVICE_API_KEY` | Real |
| `OPENAI_API_KEY` | Mock |
| `ANTHROPIC_API_KEY` | Mock |
| `GEMINI_API_KEY` | Mock |
| `PERPLEXITY_API_KEY` | Mock |

Pour mettre à jour les clés AI avec les vraies valeurs :

```bash
kubectl delete secret audit-syb-env -n default

kubectl create secret generic audit-syb-env \
  --from-literal=MONGODB_URI='<REAL_URI>' \
  --from-literal=PROCESSING_SERVICE_API_KEY='<REAL_KEY>' \
  --from-literal=OPENAI_API_KEY='<REAL_KEY>' \
  --from-literal=ANTHROPIC_API_KEY='<REAL_KEY>' \
  --from-literal=GEMINI_API_KEY='<REAL_KEY>' \
  --from-literal=PERPLEXITY_API_KEY='<REAL_KEY>' \
  -n default

kubectl rollout restart deployment/audit-syb -n default
```

## Deployment

### Apply config

```bash
kubectl apply -f server/kube.yaml -n default
```

### Useful commands

```bash
# Check pod status
kubectl get pods -n default

# View logs
kubectl logs -f deployment/audit-syb -n default

# Restart after secret/config change
kubectl rollout restart deployment/audit-syb -n default

# Check external IP
kubectl get svc audit-syb-service -n default
```

## Architecture Note

L'image Docker est buildée en `linux/amd64` (les nodes Infomaniak sont amd64). Si tu rebuilds depuis un Mac Apple Silicon :

```bash
docker build --platform linux/amd64 -t s4m0s/audit-syb:0.0.2 .
docker push s4m0s/audit-syb:0.0.2
kubectl rollout restart deployment/audit-syb -n default
```
