# Configuration des Variables d'Environnement

Ce document décrit toutes les variables d'environnement nécessaires pour AutoInvoice.

## Variables Stripe - Plan Pro Unique

### STRIPE_PRICE_ID_PRO (REQUIS)

**Description**: Price ID Stripe pour le plan Pro unique à 10€/mois.

**Comment l'obtenir**:
1. Connectez-vous au [Stripe Dashboard](https://dashboard.stripe.com)
2. Allez dans **Products**
3. Créez un nouveau produit nommé "Pro" (ou sélectionnez-le s'il existe)
4. Créez un prix récurrent:
   - Montant: 10,00 €
   - Fréquence: Mensuelle
   - Type: Récurrent
5. Copiez le **Price ID** (commence par `price_`)
6. Ajoutez-le à vos variables d'environnement

**Exemple**:
```bash
STRIPE_PRICE_ID_PRO=price_1RNfWfPoHilHQPmc8krEzGdW
```

**Note importante**: Cette variable remplace les anciennes variables suivantes qui ne sont plus utilisées:
- ~~STRIPE_PRICE_ID_BASIC~~
- ~~STRIPE_PRICE_ID_PREMIUM~~
- ~~STRIPE_PRICE_ID_ENTREPRISE~~

### STRIPE_SECRET_KEY (REQUIS)

**Description**: Clé secrète Stripe pour les appels API côté serveur.

**Comment l'obtenir**:
1. Allez dans **Developers** > **API keys** sur le Stripe Dashboard
2. Copiez la **Secret key**
3. Pour le développement, utilisez la clé de test (commence par `sk_test_`)
4. Pour la production, utilisez la clé live (commence par `sk_live_`)

**Exemple**:
```bash
# Développement
STRIPE_SECRET_KEY=sk_test_51RMslzPoHilHQPmc...

# Production
STRIPE_SECRET_KEY=sk_live_51RMslzPoHilHQPmc...
```

### STRIPE_PUBLIC_KEY (REQUIS)

**Description**: Clé publique Stripe pour les appels côté client.

**Comment l'obtenir**:
1. Allez dans **Developers** > **API keys** sur le Stripe Dashboard
2. Copiez la **Publishable key**

**Exemple**:
```bash
# Développement
STRIPE_PUBLIC_KEY=pk_test_51RMslzPoHilHQPmc...

# Production
STRIPE_PUBLIC_KEY=pk_live_51RMslzPoHilHQPmc...
```

### STRIPE_WEBHOOK_SECRET (REQUIS)

**Description**: Secret pour vérifier les signatures des webhooks Stripe.

**Comment l'obtenir**:
1. Allez dans **Developers** > **Webhooks** sur le Stripe Dashboard
2. Créez un nouveau endpoint webhook pointant vers `https://votre-domaine.com/api/webhook/stripe`
3. Sélectionnez les événements à écouter:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copiez le **Signing secret** (commence par `whsec_`)

**Exemple**:
```bash
STRIPE_WEBHOOK_SECRET=whsec_a41bc397a715f0f8745abe6cd9c43c090a9f4fc7fc5a74cff0b8f5efb811769e
```

## Autres Variables Requises

### Base de données

```bash
# MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Clé de chiffrement pour les données sensibles (32 bytes en base64)
MONGODB_ENCRYPTION_KEY=3LpDEIbjCI1YEkjwHJ7RtIsgY8Nc7HJvRIdqV3koy8A
```

### NextAuth

```bash
# URL de l'application
NEXTAUTH_URL=http://localhost:3000  # Développement
NEXTAUTH_URL=https://votre-domaine.com  # Production

# Secret pour signer les tokens JWT (générer avec: openssl rand -base64 32)
NEXTAUTH_SECRET=xzXTAnY5hlGC3UDtv1y2qcLH335KbSw251wctZmZ6Qs
```

### Vercel Blob Storage

```bash
# Token pour accéder au Blob Storage (généré automatiquement par Vercel en production)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

### Email (Resend)

```bash
# Clé API Resend pour l'envoi d'emails
RESEND_API_KEY=re_xxxxx

# Adresse email d'envoi (doit être vérifiée dans Resend)
RESEND_FROM_EMAIL=noreply@autoinvoice.pro
```

### Google OAuth (Optionnel)

```bash
# Client ID et Secret pour l'authentification Google
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

### CRON

```bash
# Secret pour sécuriser les endpoints CRON
CRON_SECRET=auto_invoice_cron_2024_secure_key
```

### N8N Webhook (Optionnel)

```bash
# URL du webhook N8N pour les automatisations
N8N_WEBHOOK_URL=http://localhost:5678/webhook/test-webhook
```

### Admin (Développement uniquement)

```bash
# Identifiants admin pour les endpoints de développement
NEXT_PUBLIC_ADMINID=admin
NEXT_PUBLIC_ADMINPASSWORD=gzhjdgkdzgkadgkgfzuk
```

## Configuration pour le Développement Local

Créez un fichier `.env.local` à la racine du projet avec toutes les variables ci-dessus.

**Exemple de fichier `.env.local` complet**:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=xzXTAnY5hlGC3UDtv1y2qcLH335KbSw251wctZmZ6Qs

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/AutoInvoice
MONGODB_ENCRYPTION_KEY=3LpDEIbjCI1YEkjwHJ7RtIsgY8Nc7HJvRIdqV3koy8A

# Stripe (mode test)
STRIPE_SECRET_KEY=sk_test_51RMslzPoHilHQPmc...
STRIPE_PUBLIC_KEY=pk_test_51RMslzPoHilHQPmc...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_1RNfWfPoHilHQPmc8krEzGdW

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx

# Email
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@autoinvoice.pro

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# CRON
CRON_SECRET=auto_invoice_cron_2024_secure_key

# N8N
N8N_WEBHOOK_URL=http://localhost:5678/webhook/test-webhook

# Admin (dev only)
NEXT_PUBLIC_ADMINID=admin
NEXT_PUBLIC_ADMINPASSWORD=gzhjdgkdzgkadgkgfzuk
```

## Configuration pour la Production (Vercel)

1. Allez sur le [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **Environment Variables**
4. Ajoutez toutes les variables ci-dessus avec leurs valeurs de production
5. **Important**: Utilisez les clés Stripe en mode **live** (pas test) pour la production

## Vérification de la Configuration

Pour vérifier que toutes les variables sont correctement configurées, vous pouvez:

1. Vérifier au démarrage de l'application que `config.ts` charge correctement `STRIPE_PRICE_ID_PRO`
2. Tester la création d'une session Stripe Checkout
3. Vérifier les logs Vercel pour les erreurs de variables manquantes

## Migration depuis l'ancien système

Si vous migrez depuis l'ancien système avec plusieurs plans:

1. **Supprimez** les anciennes variables:
   - `STRIPE_PRICE_ID_BASIC`
   - `STRIPE_PRICE_ID_PREMIUM`
   - `STRIPE_PRICE_ID_ENTREPRISE`

2. **Ajoutez** la nouvelle variable:
   - `STRIPE_PRICE_ID_PRO`

3. **Créez** le nouveau produit Pro dans Stripe avec un prix de 10€/mois

4. **Mettez à jour** les webhooks Stripe pour reconnaître le nouveau Price ID

## Support

En cas de problème avec la configuration:
1. Vérifiez que toutes les variables requises sont présentes
2. Vérifiez que les clés Stripe correspondent à l'environnement (test vs live)
3. Vérifiez les logs de l'application pour les erreurs spécifiques
4. Consultez la documentation Stripe pour plus d'informations sur les Price IDs
