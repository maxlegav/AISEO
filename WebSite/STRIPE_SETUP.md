# Configuration & vérification Stripe

> Ce guide reflète le **modèle de prix réel** (défini dans `config.ts`). Les
> anciennes offres (Basic €50 / Pro €150 / Premium €300) n'existent plus.

## Modèle de prix — SYB v2 (le produit actuel : monitoring GEO)

Ce sont les 3 plans **récurrents** vendus sur la landing (`config.monitoring`).
Le checkout (`/api/checkout`) et le webhook les reconnaissent et provisionnent
les tiers `solo` / `pro` / `agency`.

| Tier | Nom | Prix | Mode Stripe | Variable d'env (Price ID) |
|------|-----|------|-------------|---------------------------|
| `solo` | Solo | €29/mois | abonnement (`subscription`) | `NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_SOLO` |
| `pro` | Pro | €79/mois | abonnement (`subscription`) | `NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_PRO` |
| `agency` | Agence | €149/mois | abonnement (`subscription`) | `NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_AGENCY` |

Les plans monitoring **n'accordent aucun crédit d'audit** (le renouvellement les
saute explicitement). Les limites par plan (projets / moteurs / fréquence)
vivent dans `lib/monitoring/plans.ts`.

## Modèle de prix — audit legacy (conservé le temps de la migration)

| Tier | Nom | Prix | Mode Stripe | Variable d'env (Price ID) |
|------|-----|------|-------------|---------------------------|
| `data` | Data | €29 | one-shot (`payment`) | `NEXT_PUBLIC_STRIPE_PRICE_ID_DATA` |
| `starter` | Starter | €79 | one-shot (`payment`) | `NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER` |
| `pro` | Pro | €59/mois | abonnement (`subscription`) | `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO` |
| `agency` | Agency | €599/mois | abonnement (`subscription`) | `NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY` |
| `agencyExtraAudit` | Extra Audit | €50 | one-shot (`payment`) | `NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY_EXTRA` |

Le webhook **résout toujours le tier depuis le Price ID réel de la ligne de
commande** (pas depuis les metadata), donc on ne peut pas être piégé par un tier
falsifié — mais les Price IDs de `.env.local` doivent correspondre exactement à
ceux du dashboard Stripe. Les prix monitoring sont prioritaires sur les prix
audit lors de la résolution du tier (voir `lib/stripe-tiers.ts`).

## 1. Clés API

1. https://dashboard.stripe.com → mode **Test** (toggle en haut à droite).
2. **Developers → API keys** : copie la clé publique (`pk_test_…`) et la clé
   secrète (`sk_test_…`).

## 2. Créer les prix

**Priorité SYB v2** : dans **Products → Add product**, crée les **3 produits
récurrents** (mensuels, EUR) du premier tableau — Solo €29, Pro €79, Agence €149.
Copie chaque **Price ID** (`price_…`, PAS le Product ID `prod_…`).

Les 5 prix audit legacy ne sont nécessaires que si tu continues à vendre l'ancien
audit one-shot ; sinon tu peux ne créer que les 3 plans monitoring.

## 3. Remplir `.env.local`

```bash
STRIPE_SECRET_KEY=sk_test_…
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…

# SYB v2 — plans monitoring (les 3 à créer en priorité)
NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_SOLO=price_…
NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_PRO=price_…
NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_AGENCY=price_…

# Audit legacy (optionnel, seulement si tu vends encore l'audit one-shot)
NEXT_PUBLIC_STRIPE_PRICE_ID_DATA=price_…
NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER=price_…
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_…
NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY=price_…
NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY_EXTRA=price_…

# IMPORTANT en prod : l'URL publique du site (redirections success/cancel Stripe)
NEXTAUTH_URL=https://showyourbrand.app
```

## 4. Webhook

**En local** (Stripe CLI) :

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook/stripe
# copie le whsec_… affiché dans STRIPE_WEBHOOK_SECRET
```

**En prod** (Stripe Dashboard → Developers → Webhooks → Add endpoint) :

- URL : `https://<ton-domaine>/api/webhook/stripe`
- Events : `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.payment_succeeded`,
  `invoice.payment_failed`.

## 5. Cartes de test

| Scénario | Numéro |
|----------|--------|
| Succès | `4242 4242 4242 4242` |
| Refusée | `4000 0000 0000 0002` |
| 3D Secure requis | `4000 0027 6000 3184` |

Date future quelconque, CVC 3 chiffres. Plus : https://stripe.com/docs/testing#cards

---

## ✅ Checklist de vérification end-to-end (à faire par Max)

Objectif : confirmer que « checkout → webhook → MongoDB → gating » fonctionne
réellement. Fais-le une fois en **mode Test**.

1. **Config** — les 8 variables ci-dessus sont bien dans `.env.local` (ou Vercel).
   Sanity check rapide : `node scripts/check-config.js`.
2. **Abonnement (Pro)** — connecte-toi, lance un checkout Pro, paie avec
   `4242…`. Attendu :
   - redirection vers `/checkout/success` ;
   - dans Stripe, l'event `checkout.session.completed` est **delivered** (200) ;
   - en base, l'`User` a `subscriptionTier: "pro"`, `subscriptionStatus: "active"` ;
   - un doc `Subscription` est créé.
   - Vérif : `node scripts/verify-subscription.js <email>`.
3. **Gating** — le badge « audits disponibles » du dashboard reflète le tier
   (Pro/Data/Starter → 1, Agency → 15) ; tu peux créer un projet sans erreur 403.
4. **One-shot (Data ou Extra Audit)** — achat via `/settings#subscription`.
   Attendu : `auditCredits` +1 en base ; Data/Starter changent aussi le tier,
   l'Extra Audit non.
5. **Idempotence** — dans Stripe, « Resend » un event déjà traité : la 2ᵉ
   livraison répond `200 { duplicate: true }` et **ne double pas** les crédits.
6. **Échec de paiement** — carte `4000…0002` : l'`User` passe `past_due`,
   aucun crédit ajouté.
7. **Renouvellement** (optionnel) — via Stripe CLI
   `stripe trigger invoice.payment_succeeded` : +1 crédit (Pro) / +15 (Agency)
   uniquement sur `billing_reason = subscription_cycle`.

### Points d'attention connus

- **`NEXTAUTH_URL`** doit pointer vers l'URL publique en prod, sinon les
  redirections Stripe renvoient vers `localhost`.
- Le **gating des audits se fait au niveau des projets** (création de business),
  pas à la création d'audit : `canCreateProject()` consomme un crédit au-delà de
  la limite de projets du tier (voir `lib/subscription-limits.ts`).

## Passage en production

1. Bascule Stripe en **Live**, récupère les clés `sk_live_…` / `pk_live_…`.
2. Recrée les 5 prix en mode Live, mets à jour les Price IDs sur Vercel.
3. Configure le webhook prod (étape 4) et mets le `whsec_…` Live sur Vercel.
4. Refais la checklist ci-dessus avec un vrai paiement de faible montant si possible.

## Ressources

- [Stripe Dashboard](https://dashboard.stripe.com/) · [Docs](https://stripe.com/docs) · [Testing](https://stripe.com/docs/testing) · [CLI](https://stripe.com/docs/stripe-cli)
