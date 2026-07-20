# SYB v2 — Analyse de coûts & pricing (monitoring GEO continu)

> Objet : justifier le pricing **Solo 29 € / Pro 79 € / Agence 149 €** par une
> estimation des coûts réels (appels LLM + infra) et vérifier la marge.
> Source de vérité des prix : [`config.ts`](./config.ts) (`config.monitoring`).
> Source de vérité des limites : [`lib/monitoring/plans.ts`](./lib/monitoring/plans.ts).

## 1. Modèle de coût — appels LLM

Un « run » = pour un projet, on interroge **chaque prompt × chaque moteur activé**.
Chaque appel envoie le prompt + un petit contexte et lit une réponse.

Hypothèses par appel (petits modèles du PRD) :

| Moteur      | Modèle recommandé        | Prix entrée / 1M tok | Prix sortie / 1M tok | ~Tokens in | ~Tokens out | Coût / appel |
|-------------|--------------------------|----------------------|----------------------|-----------|-------------|--------------|
| ChatGPT     | `gpt-4o-mini`            | 0,15 $               | 0,60 $               | 400       | 500         | ~0,00033 $   |
| Claude      | `claude-3-5-haiku`       | 0,80 $               | 4,00 $               | 400       | 500         | ~0,00232 $   |
| Perplexity  | `sonar`                  | 1,00 $ (+ recherche) | 1,00 $               | 400       | 500         | ~0,00090 $   |
| Gemini      | `gemini-1.5-flash`       | 0,075 $              | 0,30 $               | 400       | 500         | ~0,00018 $   |

> Claude Haiku domine le coût. On retient une **moyenne prudente de ~0,0012 $/appel**
> (arrondie à ~0,0015 $ pour absorber les retries et la variance de longueur).

### Coût d'un projet / mois

`appels/mois = prompts × moteurs × runs/mois`

| Fréquence   | runs/mois | Ex. 20 prompts × 4 moteurs | Coût @ 0,0015 $/appel |
|-------------|-----------|----------------------------|-----------------------|
| Hebdomadaire| ~4        | 320 appels                 | **~0,48 $** (~0,45 €) |
| Quotidien   | ~30       | 2 400 appels               | **~3,60 $** (~3,35 €) |

Projet plus léger (10 prompts × 3 moteurs) :
- Hebdo : 120 appels → ~0,18 $ / mois.
- Quotidien : 900 appels → ~1,35 $ / mois.

## 2. Coût infrastructure (mensuel, mutualisé)

| Poste                         | Hypothèse                                   | Coût/mois         |
|-------------------------------|---------------------------------------------|-------------------|
| Hébergement (Vercel)          | Pro ~20 $ mutualisé sur tous les clients    | négligeable/client|
| Cron / exécutions serverless  | runs courts, dans les quotas Vercel         | ~0 €              |
| MongoDB Atlas                 | M10 partagé (~57 $) ou serverless au début  | ~0,1–0,5 €/client |
| Resend (emails d'alerte)      | 3 000 emails gratuits, puis ~0,001 €/email  | négligeable       |

Coût infra marginal par client : **< 1 €/mois** tant qu'on mutualise Vercel + Atlas.

## 3. Coût total estimé par plan (pire cas plausible)

| Plan   | Prix  | Projets | Fréquence | LLM (pire cas)                 | Infra   | Coût total  | Marge     |
|--------|-------|---------|-----------|--------------------------------|---------|-------------|-----------|
| Solo   | 29 €  | 2       | Hebdo     | 2 × ~0,45 € = ~0,90 €          | ~0,5 €  | **~1,4 €**  | **~95 %** |
| Pro    | 79 €  | 10      | Quotidien | 10 × ~3,35 € = ~33,5 €         | ~1 €    | **~35 €**   | **~55 %** |
| Agence | 149 € | illimité| Quotidien | ~20 clients × ~3,35 € = ~67 €  | ~2 €    | **~69 €**   | **~54 %** |

> Le plan **Pro** est le point de vigilance : un utilisateur qui pousse 10 projets
> avec beaucoup de prompts en quotidien peut consommer davantage. Garde-fous
> recommandés (déjà partiellement en place via `lib/monitoring/plans.ts`) :
> - plafond de prompts par projet (déjà 100 max côté validation Zod),
> - quotidien réservé à Pro/Agence (déjà appliqué),
> - Agence = illimité mais cible réaliste 10–20 clients (au-delà → offre sur mesure).

## 4. Seuils de rentabilité

- Coûts fixes ~80 €/mois (Vercel Pro + Atlas M10).
- **Break-even ≈ 3 clients Solo** ou **1 client Pro**.
- À 20 clients (mix 10 Solo / 8 Pro / 2 Agence) : revenu ~1 300 €/mois,
  coûts variables ~300 €, coûts fixes ~80 € → **marge nette ~70 %**.

## 5. Recommandation de pricing

Le pricing du PRD est **confirmé** et cohérent avec le marché (Promptmonitor 29–129 €) :

| Plan   | Prix  | Projets   | Moteurs | Fréquence           |
|--------|-------|-----------|---------|---------------------|
| Solo   | 29 €  | 2         | 3       | Hebdomadaire        |
| Pro    | 79 €  | 10        | 4       | Quotidien           |
| Agence | 149 € | illimité  | 4       | Quotidien + PDF MB  |

Actions de suivi (hors périmètre de cette PR) :
1. Créer les 3 prix récurrents dans Stripe et renseigner les
   `NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_*` (voir `.env.example`).
2. Câbler le checkout + le webhook Stripe sur ces prix et étendre l'enum
   `subscriptionTier` avec `solo` (aujourd'hui `solo` est mappé sur les tiers
   hérités via `planForTier`, sans casser la facturation audit existante).
3. Ajouter un compteur d'usage (appels LLM / mois) pour surveiller la marge Pro.
