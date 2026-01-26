# Guide de déploiement - Fix Production Invoice Creation

## Changements effectués

### 1. Migration vers Vercel Blob Storage
- Remplacement du système de fichiers local par Vercel Blob Storage
- Configuration de `@vercel/blob` pour le stockage des PDFs
- Création d'un endpoint sécurisé pour le téléchargement des PDFs

### 2. Fix Puppeteer/Chrome pour Vercel
- Remplacement de `puppeteer` par `puppeteer-core` + `@sparticuz/chromium`
- Support automatique des environnements production et développement
- Génération de PDFs fonctionnelle sur Vercel

## Variables d'environnement requises

Assurez-vous que ces variables sont configurées sur Vercel :

```bash
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx

# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_ENCRYPTION_KEY=votre-cle-encryption

# NextAuth
NEXTAUTH_URL=https://votre-domaine.com
NEXTAUTH_SECRET=votre-secret

# Stripe - Plan Pro unique (10€/mois)
# IMPORTANT: Cette variable remplace les anciennes variables STRIPE_PRICE_ID_BASIC, 
# STRIPE_PRICE_ID_PREMIUM, et STRIPE_PRICE_ID_ENTREPRISE
# Pour obtenir ce Price ID:
# 1. Aller sur Stripe Dashboard (https://dashboard.stripe.com)
# 2. Aller dans Products
# 3. Créer ou sélectionner le produit "Pro"
# 4. Créer un prix récurrent de 10€/mois
# 5. Copier le Price ID (commence par "price_")
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# Email (Resend)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@votre-domaine.com

# CRON pour relances automatiques
CRON_SECRET=votre-secret-cron

# Autres variables existantes...
```

## Étapes de déploiement

### 1. Vérifier le build local
```bash
npm run build
```
✅ Le build doit réussir sans erreurs

### 2. Commit et push
```bash
git add .
git commit -m "Fix: Migration vers Blob Storage et fix Chromium pour Vercel"
git push origin main
```

### 3. Déploiement automatique sur Vercel
Vercel détectera automatiquement le push et déploiera l'application.

### 4. Vérifier les variables d'environnement
1. Aller sur le dashboard Vercel
2. Sélectionner votre projet
3. Aller dans Settings > Environment Variables
4. Vérifier que `BLOB_READ_WRITE_TOKEN` est bien configuré

### 5. Tester en production

#### Test 1 : Créer une nouvelle facture
1. Se connecter à l'application en production
2. Créer une nouvelle facture
3. Vérifier que :
   - Le PDF est généré sans erreur
   - Le PDF est uploadé vers Blob Storage
   - L'URL blob est stockée en base de données
   - Le PDF est téléchargeable

#### Test 2 : Télécharger une facture
1. Aller dans la liste des factures
2. Cliquer sur "Télécharger" pour une facture
3. Vérifier que :
   - Le PDF se télécharge correctement
   - L'accès est sécurisé (authentification requise)

#### Test 3 : Vérifier les logs
1. Aller dans Vercel Dashboard > Deployments
2. Cliquer sur le dernier déploiement
3. Aller dans l'onglet "Functions"
4. Vérifier les logs de `/api/invoices/create`
5. S'assurer qu'il n'y a pas d'erreurs Chrome/Puppeteer

## Rollback en cas de problème

Si quelque chose ne fonctionne pas :

1. Aller sur Vercel Dashboard
2. Sélectionner le déploiement précédent
3. Cliquer sur "Promote to Production"

## Monitoring

Après le déploiement, surveiller :
- Les logs Vercel pour les erreurs
- Les métriques de performance (temps de génération PDF)
- L'utilisation du Blob Storage

## Support

En cas de problème :
1. Vérifier les logs Vercel
2. Vérifier que `BLOB_READ_WRITE_TOKEN` est bien configuré
3. Vérifier que le timeout de la fonction est suffisant (30s configuré dans `vercel.json`)

## Fichiers de documentation

- `CHROMIUM_SETUP.md` : Configuration Chromium pour Vercel
- `VERCEL_BLOB_SETUP.md` : Configuration Vercel Blob Storage
- `.kiro/specs/fix-production-invoice-creation/CHROMIUM_FIX.md` : Détails du fix Chrome
