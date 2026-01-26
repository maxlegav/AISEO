# Audit de Sécurité API - Recommandations

## 🚨 Problèmes Critiques Identifiés

### 1. **Exposition d'informations sensibles dans les erreurs**

#### Fichiers concernés avec fuites d'informations :

- `pages/api/invoices/create.ts` - **CRITIQUE**
- `pages/api/invoices/decrypt-preview.ts` - **CRITIQUE**
- `pages/api/invoices/preview-pdf.ts` - **CRITIQUE**
- `pages/api/invoices/preview-html.ts` - **CRITIQUE**
- `pages/api/stripe/create-checkout.ts` - **CRITIQUE**
- `pages/api/invoices/update-recurring.ts` - **CRITIQUE**

#### Problèmes :
```typescript
// ❌ MAUVAIS - Expose des détails internes
return res.status(500).json({
  error: String(error),
  errorMessage: error.message,
  errorName: error.name,
  errorCode: error.code,
  validationErrors: error.errors,
  details: error.message,
  stack: error.stack  // Encore pire !
});
```

**Risques :**
- Révèle la structure de la base de données
- Expose les chemins de fichiers du serveur
- Donne des indices sur les vulnérabilités
- Révèle les versions des dépendances

### 2. **Logs excessifs en production**

Tous les fichiers API contiennent des `console.log` détaillés qui :
- Exposent les IDs utilisateurs
- Montrent les requêtes SQL/MongoDB
- Révèlent la logique métier
- Peuvent ralentir l'application

### 3. **Messages d'erreur trop descriptifs**

Exemples problématiques :
- "Configuration base de données manquante" → Révèle l'architecture
- "Échec de connexion à la base de données" → Révèle l'infrastructure
- Erreurs de validation MongoDB → Révèle le schéma de données

## ✅ Solutions Recommandées

### Solution 1 : Créer un gestionnaire d'erreurs centralisé

Créer `lib/error-handler.ts` :


## ✅ Corrections Appliquées

### Fichiers corrigés :
1. ✅ `lib/error-handler.ts` - Créé (gestionnaire centralisé)
2. ✅ `pages/api/invoices/create.ts` - Sécurisé
3. ✅ `pages/api/invoices/decrypt-preview.ts` - Sécurisé

### Fichiers restants à corriger (PRIORITÉ HAUTE) :

#### 1. `pages/api/invoices/preview-pdf.ts`
```typescript
// ❌ AVANT
res.status(500).json({
  error: "Erreur lors de la génération du PDF",
  details: error.message,
});

// ✅ APRÈS
import { handleApiError } from "@/lib/error-handler";
return handleApiError(error, res);
```

#### 2. `pages/api/invoices/preview-html.ts`
```typescript
// ❌ AVANT
res.status(500).json({
  error: "Erreur lors de la génération de l'aperçu HTML",
  details: error.message,
});

// ✅ APRÈS
return handleApiError(error, res);
```

#### 3. `pages/api/stripe/create-checkout.ts`
```typescript
// ❌ AVANT - TRÈS DANGEREUX
return res.status(500).json({ error: e });

// ✅ APRÈS
return handleApiError(error, res);
```

#### 4. `pages/api/invoices/update-recurring.ts`
```typescript
// ❌ AVANT
return res.status(500).json({ success: false, message: String(error) });

// ✅ APRÈS
return handleApiError(error, res);
```

#### 5. `pages/api/invoices/index.ts`
- Supprimer tous les console.log détaillés
- Remplacer par secureLog.info()
- Utiliser handleApiError pour les erreurs

#### 6. `pages/api/enterprise/index.ts`
```typescript
// ❌ AVANT
return res.status(500).json({
  success: false,
  message: "Configuration base de données manquante",
});

// ✅ APRÈS
return handleApiError(error, res, "Erreur de configuration");
```

## 🔒 Recommandations Supplémentaires

### 1. Variables d'environnement
Vérifier que ces variables ne sont JAMAIS exposées :
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`

### 2. Rate Limiting
Ajouter un rate limiter pour :
- `/api/auth/signup` - Max 5 tentatives/heure
- `/api/invoices/create` - Max 100/heure
- `/api/emails/send-invoice` - Max 50/heure

### 3. Validation des entrées
Toujours valider :
- Format des emails
- Longueur des chaînes
- Types de données
- Plages de valeurs numériques

### 4. Logs en production
```typescript
// ✅ BON - Utiliser secureLog
secureLog.error("Erreur création facture", error);

// ❌ MAUVAIS - Ne jamais faire en production
console.log("User data:", user);
console.error("Full error:", error);
```

### 5. Headers de sécurité
Ajouter dans `next.config.js` :
```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ],
    },
  ];
}
```

## 📊 Résumé des Risques

### Avant corrections :
- 🔴 **Critique** : 6 fichiers exposent des stack traces
- 🔴 **Critique** : 3 fichiers exposent des erreurs MongoDB complètes
- 🟠 **Élevé** : 15+ fichiers avec logs excessifs
- 🟠 **Élevé** : Messages d'erreur trop descriptifs

### Après corrections :
- 🟢 **Résolu** : Gestionnaire d'erreurs centralisé
- 🟢 **Résolu** : Logs conditionnels (dev only)
- 🟢 **Résolu** : Messages d'erreur génériques
- 🟡 **En cours** : Reste 10+ fichiers à corriger

## 🎯 Prochaines Étapes

1. **Immédiat** : Corriger les 6 fichiers critiques listés ci-dessus
2. **Court terme** : Ajouter rate limiting
3. **Moyen terme** : Audit complet de tous les endpoints
4. **Long terme** : Mettre en place un système de monitoring des erreurs (Sentry)

## 🧪 Tests de Sécurité

Pour tester les corrections :
```bash
# 1. Tester les erreurs génériques
curl -X POST http://localhost:3000/api/invoices/create \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Devrait retourner :
# {"success": false, "error": "VALIDATION_ERROR", "message": "Données invalides"}
# PAS de stack trace, PAS de détails MongoDB

# 2. Vérifier les logs
# En production : Aucun log détaillé ne devrait apparaître
# En dev : Les logs détaillés sont OK
```
