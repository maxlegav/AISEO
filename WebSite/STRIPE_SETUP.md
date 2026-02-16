# Configuration Stripe pour le développement

## Problème

Les clés Stripe actuelles dans `.env.local` sont invalides (valeurs "CHANGE_ME"). Le checkout échoue à cause de cela.

## Solution

### 1. Créer un compte Stripe de test

1. Allez sur https://dashboard.stripe.com/register
2. Créez un compte (gratuit)
3. Assurez-vous d'être en **mode Test** (toggle en haut à droite du dashboard)

### 2. Récupérer vos clés API

1. Allez dans **Developers > API Keys**
2. Vous verrez deux clés de test :
   - **Publishable key** (commence par `pk_test_...`)
   - **Secret key** (commence par `sk_test_...`) - cliquez sur "Reveal test key"

### 3. Créer vos produits et prix

1. Allez dans **Products > Add product**
2. Créez les produits suivants (prix en euros) :

   **Basic Plan:**
   - Nom : "ShowYourBrand Basic Plan"
   - Prix : €50.00 / mois
   - Récurrent : Mensuel
   - Copiez le **Price ID** (commence par `price_...`)

   **Pro Plan:**
   - Nom : "ShowYourBrand Pro Plan"
   - Prix : €150.00 / mois
   - Récurrent : Mensuel
   - Copiez le **Price ID** (commence par `price_...`)

   **Premium Plan:**
   - Nom : "ShowYourBrand Premium Plan"
   - Prix : €300.00 / mois
   - Récurrent : Mensuel
   - Copiez le **Price ID** (commence par `price_...`)

   **One-Shot Audit:**
   - Nom : "ShowYourBrand One-Shot Audit"
   - Prix : €299.00
   - One-time payment (pas de récurrence)
   - Copiez le **Price ID** (commence par `price_...`)

### 4. Mettre à jour `.env.local`

Ouvrez `WebSite/.env.local` et remplacez les valeurs suivantes :

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_VOTRE_CLE_PUBLIQUE_ICI
STRIPE_PRICE_ID_BASIC=price_VOTRE_PRICE_ID_BASIC
STRIPE_PRICE_ID_PRO=price_VOTRE_PRICE_ID_PRO
STRIPE_PRICE_ID_PREMIUM=price_VOTRE_PRICE_ID_PREMIUM
STRIPE_PRICE_ID_ONE_SHOT=price_VOTRE_PRICE_ID_ONE_SHOT
```

### 5. Configurer le webhook (optionnel en développement)

Pour tester les webhooks en local :

1. Installez Stripe CLI : https://stripe.com/docs/stripe-cli
2. Connectez-vous : `stripe login`
3. Lancez le forward : `stripe listen --forward-to localhost:3000/api/webhook/stripe`
4. Copiez le **webhook signing secret** (commence par `whsec_...`)
5. Ajoutez-le dans `.env.local` :
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET
   ```

### 6. Redémarrer le serveur

```bash
cd WebSite
npm run dev
```

## Tester les paiements

Stripe fournit des cartes de test pour simuler différents scénarios :

### Succès

- **Numéro** : `4242 4242 4242 4242`
- **Date d'expiration** : N'importe quelle date future (ex: `12/25`)
- **CVC** : N'importe quel 3 chiffres (ex: `123`)
- **Code postal** : N'importe quel code postal valide

### Paiement refusé

- **Numéro** : `4000 0000 0000 0002`
- **Date d'expiration** : N'importe quelle date future
- **CVC** : N'importe quel 3 chiffres

### Authentification 3D Secure requise

- **Numéro** : `4000 0027 6000 3184`
- **Date d'expiration** : N'importe quelle date future
- **CVC** : N'importe quel 3 chiffres

### Carte insuffisamment approvisionnée

- **Numéro** : `4000 0000 0000 9995`
- **Date d'expiration** : N'importe quelle date future
- **CVC** : N'importe quel 3 chiffres

Plus de cartes de test : https://stripe.com/docs/testing#cards

## Vérifier que tout fonctionne

1. **Allez sur la landing page** `/`
2. **Scrollez jusqu'à la section pricing** ou cliquez sur un bouton "Buy Now"
3. **Cliquez** sur un plan (Basic, Pro, ou Premium) - vous serez redirigé vers `/signup?plan=xxx`
4. **Créez un compte** avec vos informations
5. **Vous devriez être automatiquement redirigé** vers Stripe Checkout après la création du compte
6. **Utilisez** la carte de test `4242 4242 4242 4242`
7. **Complétez** le paiement
8. **Vous devriez être redirigé** vers le dashboard

## Vérifier l'abonnement dans la base de données

Après un paiement réussi, vérifiez que l'abonnement a été créé :

```bash
node scripts/verify-subscription.js votre-email@example.com
```

## Troubleshooting

### "Invalid API Key provided"

- Vérifiez que vous avez bien copié la clé complète (commence par `sk_test_` ou `pk_test_`)
- Vérifiez qu'il n'y a pas d'espaces avant/après la clé
- Assurez-vous d'être en mode Test dans Stripe

### "No such price"

- Vérifiez que les Price IDs correspondent bien à ceux dans votre dashboard Stripe
- Assurez-vous que les produits sont actifs (non archivés)
- Vérifiez que vous utilisez les Price IDs (commence par `price_`) et non les Product IDs (commence par `prod_`)

### Le webhook ne fonctionne pas

- Assurez-vous que Stripe CLI est lancé (`stripe listen --forward-to localhost:3000/api/webhook/stripe`)
- Vérifiez que le webhook secret est correct dans `.env.local`
- Redémarrez le serveur Next.js après avoir modifié `.env.local`

### Le checkout échoue avec "Customer email not provided"

- C'est normal en développement si l'email n'est pas configuré
- Le checkout devrait quand même fonctionner

## Passage en production

Lorsque vous êtes prêt à passer en production :

1. Basculez en mode **Live** dans Stripe (toggle en haut à droite)
2. Récupérez vos nouvelles clés API **Live** (commencent par `sk_live_` et `pk_live_`)
3. Recréez vos produits en mode Live (ou utilisez le Stripe CLI pour migrer)
4. Configurez le webhook en production dans Stripe Dashboard :
   - URL : `https://votre-domaine.com/api/webhook/stripe`
   - Events : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
5. Mettez à jour vos variables d'environnement sur Vercel avec les clés Live

## Ressources

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Documentation Stripe](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
