# ShowYourBrand — Implémentation des plans tarifaires
> v2 — 2026-03-24

---

## Vue d'ensemble des plans

| Plan | Prix | Type | Audits | Dashboard | Continuité | White-label | Output |
|--|--|--|--|--|--|--|--|
| **Data** | €29 | One-shot | 1 | Technique (JSON) | ❌ | ❌ | JSON brut |
| **Starter** | €49 | One-shot | 1 | 30 jours | ❌ | ❌ | Dashboard complet |
| **Pro** | €59/mois | Abonnement | 1/mois auto | Permanent | ✅ | ❌ | Dashboard + delta |
| **Agency** | €599/mois | Abonnement | 15/mois | Permanent multi-clients | ✅ | ✅ | Dashboard + delta + partage |

**Concurrents suivis : 3 dans tous les plans.**

---

## Stack IA — Moteurs retenus

| Moteur | Modèle | Rôle | Coût/audit |
|--|--|--|--|
| OpenAI | GPT-4o | 100 requêtes | €0.51 |
| Anthropic | Claude Sonnet 4.5 | 100 requêtes + synthèse + génération prompts | €0.72 + €0.16 + €0.06* |
| Perplexity | sonar-pro | 100 requêtes (search live) | €1.18 |
| Google | Gemini 2.0 Flash | 100 requêtes | €0.02 |

*€0.06 uniquement au 1er audit d'un business (prompts ensuite sauvegardés et réutilisés)

**Coût total par audit :**
- Data (sans synthèse) : ~**€2.39**
- Starter / Pro / Agency : ~**€2.65** (mois 1) / **€2.59** (mois suivants, prompts sauvegardés)

---

## 1. Stripe — Configuration

### Produits à créer dans Stripe Dashboard

```
Produit 1 : ShowYourBrand Data
  - Type : one-time payment
  - Prix : €29.00 EUR
  - Price ID → NEXT_PUBLIC_STRIPE_PRICE_ID_DATA

Produit 2 : ShowYourBrand Starter
  - Type : one-time payment
  - Prix : €49.00 EUR
  - Price ID → NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER

Produit 3 : ShowYourBrand Pro
  - Type : recurring
  - Prix : €59.00 EUR / month
  - Price ID → NEXT_PUBLIC_STRIPE_PRICE_ID_PRO

Produit 4 : ShowYourBrand Agency
  - Type : recurring
  - Prix : €599.00 EUR / month
  - Price ID → NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY
```

### Variables d'environnement

```bash
NEXT_PUBLIC_STRIPE_PRICE_ID_DATA=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY=price_xxx
```

### Webhooks Stripe à gérer

- `checkout.session.completed` → activer le plan (Data/Starter = one-shot, Pro/Agency = subscription)
- `customer.subscription.updated` → mettre à jour le statut abonnement
- `customer.subscription.deleted` → désactiver Pro/Agency
- `invoice.payment_failed` → email relance paiement

---

## 2. config.ts — Mise à jour complète

```typescript
stripe: {
  data: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_DATA || "",
    name: "Data",
    price: 29,
    currency: "EUR",
    mode: "payment",
    outputMode: "data",        // JSON brut, pas de synthèse Claude
    competitors: 3,
    dashboardAccessDays: null, // accès permanent (c'est du JSON)
    auditsIncluded: 1,
  },
  starter: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER || "",
    name: "Starter",
    price: 49,
    currency: "EUR",
    mode: "payment",
    outputMode: "full",
    competitors: 3,
    dashboardAccessDays: 30,
    auditsIncluded: 1,
  },
  pro: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || "",
    name: "Pro",
    price: 59,
    currency: "EUR",
    mode: "subscription",
    interval: "month",
    outputMode: "full",
    competitors: 3,
    dashboardAccessDays: null,  // permanent
    auditsPerMonth: 1,
    features: {
      deltaTracking: true,
      checklistAlerts: true,
      savedPrompts: true,
      progressHistory: true,
    }
  },
  agency: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY || "",
    name: "Agency",
    price: 599,
    currency: "EUR",
    mode: "subscription",
    interval: "month",
    outputMode: "full",
    competitors: 3,
    dashboardAccessDays: null,
    auditsPerMonth: 15,
    features: {
      deltaTracking: true,
      checklistAlerts: true,
      savedPrompts: true,
      progressHistory: true,
      whiteLabel: true,        // phase 1 : logo/nom custom sur /share/[token]
      multiClient: true,
      shareableLinks: true,
    }
  }
}
```

---

## 3. Modèle User — Champs

```typescript
subscriptionTier: {
  type: String,
  enum: ['none', 'data', 'starter', 'pro', 'agency'],
  default: 'none',
}

// Agency : crédits mensuels
auditCreditsRemaining: { type: Number, default: 0 }
auditCreditsResetDate: { type: Date }

// Pro : prochain audit automatique
nextScheduledAuditDate: { type: Date }

// Agency white-label : branding custom
agencyBranding: {
  name: { type: String },         // Ex: "Agence Horizon"
  logoUrl: { type: String },      // URL Vercel Blob
  primaryColor: { type: String }, // Ex: "#2563EB"
}
```

---

## 4. Modèle Business — Saved Prompts

```typescript
// Les 100 prompts générés au 1er audit, réutilisés ensuite
savedPrompts: {
  type: [String],
  default: [],
}
promptsGeneratedAt: { type: Date }

// Regénérer tous les 3 mois pour rester à jour
promptsRefreshIntervalMonths: { type: Number, default: 3 }
```

**Logique côté serveur Python :**
```
Si business.savedPrompts.length === 0
  → Générer 100 prompts avec Claude Sonnet, les stocker
Sinon si promptsGeneratedAt > 3 mois
  → Regénérer et remplacer
Sinon
  → Réutiliser savedPrompts (économie €0.06, cohérence de comparaison)
```

---

## 5. Modèle Audit — Output mode + Delta + Checklist

```typescript
// Mode de sortie : data (brut) ou full (avec synthèse Claude)
outputMode: {
  type: String,
  enum: ['data', 'full'],
  default: 'full',
}

// Référence à l'audit précédent
previousAuditId: { type: Schema.Types.ObjectId, ref: 'Audit', default: null }

// Delta calculé vs audit précédent (Pro/Agency uniquement)
delta: {
  globalScore: Number,
  byCategory: {
    discovery: Number,
    comparison: Number,
    reputation: Number,
    product: Number,
    trust: Number,
  },
  resolvedIssues: [String],       // issues qui ont disparu
  newIssues: [String],            // nouvelles issues
  newMentionPrompts: [String],    // prompts qui mentionnent maintenant le business
  lostMentionPrompts: [String],   // prompts qui ne le mentionnent plus
  competitorDeltas: [{
    url: String,
    scoreDelta: Number,
  }],
}

// Bilan comparatif rédigé par Claude Sonnet (Pro/Agency)
deltaReport: { type: String, default: null }

// Checklist des recommandations avec statut
recommendations: [{
  id: String,
  priority: { type: String, enum: ['critical', 'important', 'nice'] },
  category: String,
  title: String,
  description: String,
  status: { type: String, enum: ['pending', 'done', 'dismissed'], default: 'pending' },
  statusUpdatedAt: Date,
}]

// Type d'audit
auditType: {
  type: String,
  enum: ['manual', 'scheduled'],
  default: 'manual',
}
```

---

## 6. Plan Data — Implémentation spécifique

### Ce qui est sauté vs Starter

```typescript
// Dans le serveur Python, si outputMode === 'data' :
// ✅ Faire : 4 × 100 requêtes IA, HTML scan, scoring
// ❌ Sauter : appel Claude synthèse (deltaReport)
// ❌ Sauter : génération recommandations rédigées en prose
// ❌ Sauter : génération FAQ/schema snippets formatés

// Résultat : raw JSON des scores + prompt results + issues brutes
```

### Livraison

Nouvelle page : `/[username]/[projectSlug]/data`
- Affiche le JSON formaté de l'audit (read-only)
- Bouton "Télécharger JSON"
- Endpoint : `GET /api/audits/[auditId]/raw` → retourne le JSON complet
- Accès permanent (le JSON est téléchargé, pas de dashboard à expirer)

### Restriction d'accès

```typescript
// /api/audits/[auditId]/raw
if (audit.outputMode !== 'data') {
  return res.status(403).json({ error: 'Raw export only available on Data plan' })
}
// Vérifier que l'user est bien propriétaire de l'audit
```

---

## 7. Checklist alerts — Email de rappel

### Logique

Les alertes email ne sont **pas** déclenchées par une baisse de score.
Elles sont déclenchées par **des items critiques non traités dans la checklist**.

### Cron : `GET /api/cron/checklist-reminders`

```json
// vercel.json
{
  "path": "/api/cron/checklist-reminders?secret=CRON_SECRET",
  "schedule": "0 9 * * 1"  // Chaque lundi à 9h
}
```

### Logique du cron

```
1. Récupérer tous les audits avec recommendations.status === 'pending'
   ET recommendations.priority === 'critical'
   ET audit.createdAt ou statusUpdatedAt > 14 jours
2. Pour chaque user concerné :
   a. Construire la liste des items critiques non traités
   b. Envoyer 1 email max par semaine (éviter le spam)
   c. Stocker lastReminderSentAt sur l'audit pour ne pas re-envoyer
```

### Endpoint : `PATCH /api/audits/[auditId]/recommendations/[recId]`

```typescript
// L'utilisateur coche une recommendation dans le dashboard
{
  status: 'done' | 'dismissed'
}
// Met à jour recommendation.status et statusUpdatedAt
```

### Email type

```
Sujet : "3 optimisations critiques en attente pour [Business Name]"

Corps :
- [Business Name] a 3 points critiques non traités depuis 14 jours :
  🔴 Ajouter une page FAQ (impact estimé : +8 points)
  🔴 Implémenter Schema.org Organization (impact : +5 points)
  🔴 Optimiser la meta description (impact : +3 points)

→ [Voir le dashboard et marquer comme fait]
```

---

## 8. Audit mensuel automatique (Pro)

### Cron : `GET /api/cron/monthly-audits`

```json
// vercel.json
{
  "path": "/api/cron/monthly-audits?secret=CRON_SECRET",
  "schedule": "0 8 1 * *"  // 1er du mois à 8h
}
```

### Logique

```
1. Récupérer tous users Pro avec subscriptionStatus === 'active'
2. Pour chaque user :
   a. Récupérer le business principal
   b. Vérifier dernier audit > 25 jours (anti-doublon)
   c. Créer audit { auditType: 'scheduled', outputMode: 'full' }
   d. Envoyer au serveur Python avec savedPrompts existants
   e. Après completion → calculate-delta → envoyer email résumé
```

### Endpoint : `POST /api/audits/calculate-delta`

```
Input : auditId (le nouveau)
1. Récupérer audit N et audit N-1 (previousAuditId)
2. Comparer scores, issues, prompt mentions, concurrents
3. Appeler Claude Sonnet pour rédiger deltaReport
4. Sauvegarder delta + deltaReport sur l'audit
```

---

## 9. Agency — Crédits mensuels

### Cron : `GET /api/cron/reset-agency-credits`

```json
{
  "path": "/api/cron/reset-agency-credits?secret=CRON_SECRET",
  "schedule": "0 0 1 * *"  // 1er du mois à minuit
}
```

### Vérification crédit avant lancement audit

```typescript
// /api/audits/create.ts
if (user.subscriptionTier === 'agency') {
  if (user.auditCreditsRemaining <= 0) {
    return res.status(402).json({ error: 'No audit credits remaining this month' })
  }
  await User.updateOne({ _id: user._id }, { $inc: { auditCreditsRemaining: -1 } })
}
```

---

## 10. White-label Agency — Phase 1

### Settings agence : `PATCH /api/user/agency-branding`

```typescript
{
  agencyName: string,
  agencyLogoFile: File,     // uploadé vers Vercel Blob
  agencyPrimaryColor: string
}
// Sauvegardé dans user.agencyBranding
```

### Modèle SharedDashboard

```typescript
{
  token: String,            // UUID unique
  auditId: ObjectId,
  businessId: ObjectId,
  agencyUserId: ObjectId,
  // Snapshot du branding au moment du partage
  brandingSnapshot: {
    name: String,
    logoUrl: String,
    primaryColor: String,
  },
  createdAt: Date,
  expiresAt: Date,          // null = permanent (Agency)
}
```

### Page : `GET /share/[token]`

```
- Récupérer le SharedDashboard par token
- Charger l'audit correspondant
- Afficher le dashboard avec :
  - Logo + nom de l'agence dans le header (PAS ShowYourBrand)
  - Couleur primaire de l'agence
  - Footer : "Propulsé par [rien / mention discrète optionnelle]"
- Pas de login requis (public mais protégé par token)
```

### Endpoint : `POST /api/audits/[auditId]/share`

```typescript
// Vérifier que user est Agency
// Créer SharedDashboard avec brandingSnapshot courant
// Retourner : { url: "https://showyourbrand.com/share/[token]" }
```

### White-label Phase 2 (future)

Custom domain via CNAME :
- L'agence pointe `geo.monagence.com` → `cname.vercel-dns.com`
- On enregistre le domaine via Vercel API : `POST /v10/projects/{id}/domains`
- On détecte l'host entrant dans Next.js middleware → charge branding agence correspondant

---

## 11. Accès dashboard selon plan

```typescript
// middleware ou dans la page dashboard

// Starter : expiration 30 jours
if (audit.outputMode === 'full' && user.subscriptionTier === 'starter') {
  const expired = Date.now() - audit.createdAt > 30 * 24 * 60 * 60 * 1000
  if (expired) redirect('/upgrade?reason=expired')
}

// Data : pas de dashboard complet, rediriger vers vue raw
if (audit.outputMode === 'data') {
  redirect(`/[username]/[projectSlug]/data`)
}

// Pro/Agency : accès permanent, features continuité débloquées
```

---

## 12. Emails à implémenter

| Trigger | Plan | Sujet |
|--|--|--|
| Achat Starter | Starter | "Votre audit est en cours de traitement" |
| Audit Starter terminé | Starter | "Votre rapport est prêt — accès pendant 30 jours" |
| Achat Data | Data | "Votre audit Data est en cours" |
| Audit Data terminé | Data | "Votre export JSON est disponible" |
| Abonnement Pro activé | Pro | "Bienvenue en Pro — 1er audit automatique le [date]" |
| Audit Pro mensuel terminé | Pro | "Rapport [mois] : +X points / -X points ce mois-ci" |
| Items critiques non traités >14j | Pro/Agency | "3 optimisations critiques en attente sur [Business]" |
| Abonnement Agency activé | Agency | "15 audits disponibles ce mois" |
| Reset crédits Agency | Agency | "Vos 15 audits du mois de [mois] sont disponibles" |
| Paiement échoué | Pro/Agency | "Problème de paiement — votre abonnement va être suspendu" |

---

## 13. Récapitulatif tâches par priorité

### 🔴 Bloquant pour le lancement

- [ ] Créer les 4 produits/prix dans Stripe (Data, Starter, Pro, Agency)
- [ ] Mettre à jour `config.ts` (nouveaux plans, supprimer basic/premium)
- [ ] Mettre à jour `User.subscriptionTier` enum
- [ ] Remplacer DeepSeek par Gemini 2.0 Flash dans le serveur Python
- [ ] Implémenter flag `outputMode: 'data' | 'full'` dans le pipeline Python
- [ ] Créer l'endpoint `GET /api/audits/[auditId]/raw` (plan Data)
- [ ] Implémenter la restriction 30j sur le dashboard Starter
- [ ] Mettre à jour le webhook Stripe pour les 4 nouveaux priceId
- [ ] Mettre à jour la page d'accueil (3 nouveaux plans)

### 🟠 Pro fonctionnel

- [ ] Ajouter `savedPrompts` sur le modèle Business
- [ ] Modifier le serveur Python pour réutiliser les prompts existants
- [ ] Ajouter `recommendations[]` avec statut sur le modèle Audit
- [ ] Ajouter `delta` + `deltaReport` + `previousAuditId` sur le modèle Audit
- [ ] Endpoint `POST /api/audits/calculate-delta`
- [ ] Endpoint `PATCH /api/audits/[id]/recommendations/[recId]` (cocher item)
- [ ] Cron `monthly-audits` (1er du mois)
- [ ] Cron `checklist-reminders` (chaque lundi)
- [ ] Dashboard : section delta (score +/-, problèmes résolus/nouveaux)
- [ ] Dashboard : courbe historique des scores
- [ ] Dashboard : checklist interactive (cocher les recommandations)
- [ ] Email "audit mensuel terminé" avec résumé delta
- [ ] Email "items critiques en attente"

### 🟡 Agency

- [ ] Système de crédits (`auditCreditsRemaining`, vérification avant launch)
- [ ] Cron `reset-agency-credits` (1er du mois)
- [ ] Page settings agence : upload logo, nom, couleur primaire
- [ ] Modèle `SharedDashboard`
- [ ] Page `/share/[token]` avec white-label (logo + nom agence)
- [ ] Endpoint `POST /api/audits/[id]/share`
- [ ] Dashboard multi-clients `/[username]/clients`
- [ ] Email reset crédits mensuels

### ⚪ Phase 2 (après stabilisation)

- [ ] White-label custom domain (CNAME + Vercel API)
- [ ] Export PDF avec branding agence
- [ ] API publique (clé API pour accès programmatique, Data plan++)

---

*Document v2 — 2026-03-24*
