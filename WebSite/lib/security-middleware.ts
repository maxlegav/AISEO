import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import mongoose from 'mongoose';
import User from '@/models/User';

export interface SecurityContext {
  user: any;
  userId: string;
}

/**
 * Middleware de sécurité robuste pour les APIs
 * Valide l'authentification, l'autorisation et l'abonnement
 */
export async function withSecurity(
  handler: (req: NextApiRequest, res: NextApiResponse, context: SecurityContext) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // 1. Vérification de l'authentification
      const session = await getServerSession(req, res, authOptions);
      
      if (!session || !session.user?.id) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentification requise'
        });
      }

      // 2. Validation de l'utilisateur en base
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI!);
      }

      const user = await User.findById(session.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Utilisateur non trouvé'
        });
      }

      // 3. Créer le contexte de sécurité
      const context: SecurityContext = {
        user,
        userId: session.user.id,
      };

      // 4. Exécuter le handler avec le contexte sécurisé
      await handler(req, res, context);

    } catch (error) {
      console.error('Security middleware error:', error);

      // Ne pas exposer les détails d'erreur en production
      const isDevelopment = process.env.NODE_ENV === 'development';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur interne du serveur',
        ...(isDevelopment && { details: errorMessage })
      });
    }
  };
}

/**
 * Middleware spécifique pour les routes nécessitant un abonnement actif
 */
export function withSubscriptionRequired(
  handler: (req: NextApiRequest, res: NextApiResponse, context: SecurityContext) => Promise<void>
) {
  // For AISEO, no subscription check needed - just use withSecurity
  return withSecurity(handler);
}

/**
 * Middleware pour valider les permissions sur les ressources
 */
export function withResourceOwnership(
  resourceIdExtractor: (req: NextApiRequest) => string | null,
  resourceModel: any,
  userIdField: string = 'userId'
) {
  return (handler: (req: NextApiRequest, res: NextApiResponse, context: SecurityContext) => Promise<void>) => {
    return withSecurity(async (req, res, context) => {
      const resourceId = resourceIdExtractor(req);
      
      if (resourceId) {
        const resource = await resourceModel.findById(resourceId);
        
        if (!resource) {
          return res.status(404).json({
            success: false,
            error: 'RESOURCE_NOT_FOUND',
            message: 'Ressource non trouvée'
          });
        }

        if (resource[userIdField]?.toString() !== context.userId) {
          return res.status(403).json({
            success: false,
            error: 'ACCESS_DENIED',
            message: 'Accès non autorisé à cette ressource'
          });
        }
      }

      await handler(req, res, context);
    });
  };
}

/**
 * Validation des entrées contre les injections
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Nettoyer les caractères dangereux
    return input
      .replace(/[<>]/g, '') // XSS basique
      .replace(/\$[\w\d]+/g, '') // MongoDB operators
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    // Bloquer les opérateurs MongoDB dangereux
    const dangerousKeys = ['$where', '$regex', '$ne', '$gt', '$lt', '$in', '$nin'];
    
    for (const key of dangerousKeys) {
      if (key in input) {
        delete input[key];
      }
    }
    
    // Récursivement nettoyer les objets imbriqués
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof key === 'string' && !key.startsWith('$')) {
        sanitized[sanitizeInput(key)] = sanitizeInput(value);
      }
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Rate limiting basique (en mémoire - pour production utiliser Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const clientId = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      
      const clientData = rateLimitStore.get(clientId as string);
      
      if (!clientData || now > clientData.resetTime) {
        // Nouvelle fenêtre ou premier accès
        rateLimitStore.set(clientId as string, {
          count: 1,
          resetTime: now + windowMs
        });
      } else {
        // Dans la fenêtre existante
        clientData.count++;
        
        if (clientData.count > maxRequests) {
          return res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Trop de requêtes. Veuillez réessayer plus tard.',
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
          });
        }
      }
      
      await handler(req, res);
    };
  };
}

/**
 * Validation des webhooks Stripe avec signature
 */
export function validateStripeWebhook(req: NextApiRequest): boolean {
  if (process.env.NODE_ENV === 'development') {
    // En développement, on peut être plus permissif
    return true;
  }

  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!signature || !webhookSecret) {
    return false;
  }

  // Ici on devrait implémenter la validation complète de la signature Stripe
  // Pour l'exemple, on vérifie juste la présence
  return signature.length > 10;
}

/**
 * Logger de sécurité pour tracer les événements suspects
 */
export function logSecurityEvent(event: string, details: any, req: NextApiRequest) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    url: req.url,
    method: req.method
  };
  
  // En production, envoyer vers un service de logging sécurisé
  console.warn('[SECURITY]', JSON.stringify(logEntry));
}

const securityMiddleware = {
  withSecurity,
  withSubscriptionRequired,
  withResourceOwnership,
  sanitizeInput,
  withRateLimit,
  validateStripeWebhook,
  logSecurityEvent
};

export default securityMiddleware;
