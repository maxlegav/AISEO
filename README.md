# ShowYourBrand — GEO Monitoring (SYB v2)

**Suivez et améliorez en continu la visibilité de votre marque dans les réponses
des IA** (ChatGPT, Claude, Perplexity, Gemini).

> **Pivot produit — SYB v2.** ShowYourBrand n'est plus un **audit one-shot**.
> C'est désormais un **outil de monitoring GEO continu** (clone FR de
> Promptmonitor / Temso) : l'utilisateur configure ses marques, concurrents et
> requêtes ; l'app interroge les LLMs automatiquement (hebdo/quotidien), stocke
> les résultats, calcule un score de visibilité par moteur et suit l'évolution
> dans le temps. L'ancien produit d'audit reste temporairement dans le code
> (voir « Legacy » plus bas) mais n'est plus la direction.

## Ce que fait SYB v2

- **Monitoring multi-LLM continu** — ChatGPT, Claude, Perplexity, Gemini.
- **Score de visibilité** agrégé + **détail par moteur** (le différenciateur :
  « fort sur Perplexity, absent sur Claude — voici pourquoi »).
- **Historique** semaine par semaine, **suivi des concurrents**, **sources
  citées** par les IA, **recommandations spécifiques par moteur**.
- **Alertes email** sur variation significative de score.
- **Multi-projets** par utilisateur, **white-label** agence (logo/couleurs).
- Interface et support **en français**.

## Architecture — pas de serveur Python requis

**Tout SYB v2 tourne dans Next.js (API Routes + Vercel Cron).** Interroger les
LLMs = de simples appels HTTP aux APIs officielles, donc aucun service externe
n'est nécessaire.

```
Vercel Cron (quotidien)
  └─> /api/cron/run-monitoring
        └─> pour chaque Project actif dû à un run :
              pour chaque prompt × chaque LLM configuré :
                fetch API LLM (HTTP)  → détection marque (exact+fuzzy)
                                       → extraction des sources citées
                                       → écrit LLMResult (Mongo)
              → recalcule WeeklyScore (par moteur + global + delta)
              → met à jour MonitoredSource
              → alerte email (Resend) si |delta| ≥ seuil
```

Sans clé API LLM, les adaptateurs renvoient des **mocks déterministes**
(`mock: true` persisté) — le pipeline fonctionne de bout en bout sans clé, idéal
pour la phase de validation marché.

> ✅ L'ancien dossier `server/` (FastAPI + Selenium, audit HTML one-shot) a été
> **retiré**. Le monitoring est 100 % Next.js et n'a besoin d'aucun service Python.

## Stack

| Couche       | Choix                                             |
|--------------|---------------------------------------------------|
| Frontend/API | Next.js 16 (Pages Router), React 19, TS strict    |
| UI           | Tailwind + Shadcn/ui, Recharts, Lucide            |
| Base         | MongoDB + Mongoose                                |
| Auth         | NextAuth 4 (Google OAuth, magic link email, mot de passe) |
| Cron         | Vercel Cron (Inngest si les runs dépassent les limites serverless) |
| LLMs         | OpenAI, Anthropic, Perplexity, Google Gemini      |
| Email        | Resend                                            |
| Paiement     | Stripe                                            |
| Hébergement  | Vercel                                            |

## Modèles de données (SYB v2)

- **`Project`** — une marque à monitorer : `brandName`, `websiteUrl`,
  `competitors[]`, `prompts[]`, `llms[]`, `frequency`, `active`, `nextRunAt`.
- **`LLMResult`** — une réponse d'un moteur pour un prompt : `brandMentioned`,
  `brandPosition`, `sourcesCited[]`, `mock`, `week`.
- **`WeeklyScore`** — `scope` (moteur | `global`), `week`, `presenceRate`,
  `avgPosition`, `deltaVsLastWeek`.
- **`MonitoredSource`** — URL citée par un moteur, `citesBrand`, `citations`.

## Pricing (monitoring récurrent)

Source de vérité des prix : `WebSite/config.ts` (`config.monitoring`).
Source de vérité des limites : `WebSite/lib/monitoring/plans.ts`.
Analyse de coûts : `WebSite/PRICING_ANALYSIS.md`.

| Plan   | Prix   | Projets   | Moteurs | Fréquence          |
|--------|--------|-----------|---------|--------------------|
| Solo   | 29 €/mo| 2         | 3       | Hebdomadaire       |
| Pro    | 79 €/mo| 10        | 4       | Quotidien          |
| Agence | 149 €/mo| illimité | 4       | Quotidien + PDF MB |

## Démarrage

```bash
cd WebSite
cp .env.example .env.local   # renseigner les secrets (voir .env.example)
npm install --legacy-peer-deps
npm run dev                  # http://localhost:3000
```

Clés à placer dans `WebSite/.env.local` (local) et les env vars Vercel (prod) :
`MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`,
`RESEND_API_KEY`, `CRON_SECRET`, et les clés LLM
(`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `GEMINI_API_KEY`).
Sans clés LLM, le monitoring bascule automatiquement en mode mock.

Avant de committer : `npm run lint`, `npm run typecheck`, `npm run test`.
La CI (`.github/workflows/ci.yml`) lance lint + typecheck + tests + build.

## Repository

```
/AISEO/
├── WebSite/            # Application SYB v2 (Next.js) — tout le dev se fait ici
│   ├── pages/app/      # Dashboard monitoring (multi-projets, par moteur, sources…)
│   ├── pages/api/      # API Routes : projects, cron/run-monitoring, branding…
│   ├── lib/monitoring/ # Moteur (détection, scoring, plans, adaptateurs LLM)
│   └── models/         # Project, LLMResult, WeeklyScore, MonitoredSource, User
└── _bmad-output/       # Artefacts de planning (historiques)
```

## Ancien produit d'audit — retiré

Le produit d'audit one-shot a été **entièrement supprimé** : modèles
`Business`/`Audit`, dashboard `/{username}`, routes `/api/audits|businesses|`
`admin|share`, revue humaine, rapport `/share/:token` et service Python
`server/`. Seuls subsistent des vestiges de **facturation** : le mapping des
anciens tiers Stripe (`config.stripe` / `lib/stripe-tiers.ts`) et les champs
`auditCredits` / `data`/`starter` sur `User`, conservés pour que les
abonnements existants continuent de se résoudre. Aucune UI ni pipeline
d'audit ne subsiste.

## Licence

Propriétaire — tous droits réservés.
