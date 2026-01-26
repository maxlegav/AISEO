import { NextApiResponse } from 'next';

/**
 * Types d'erreurs standardisés
 */
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT_EXCEEDED',
  INTERNAL = 'INTERNAL_SERVER_ERROR',
}

/**
 * Messages d'erreur génériques pour l'utilisateur
 */
const ERROR_MESSAGES = {
  [ErrorType.AUTHENTICATION]: 'Authentification requise',
  [ErrorType.AUTHORIZATION]: 'Accès non autorisé',
  [ErrorType.VALIDATION]: 'Données invalides',
  [ErrorType.NOT_FOUND]: 'Ressource non trouvée',
  [ErrorType.CONFLICT]: 'Conflit de données',
  [ErrorType.RATE_LIMIT]: 'Trop de requêtes, veuillez réessayer plus tard',
  [ErrorType.INTERNAL]: 'Une erreur est survenue',
};

/**
 * Codes HTTP correspondants
 */
const ERROR_STATUS_CODES = {
  [ErrorType.AUTHENTICATION]: 401,
  [ErrorType.AUTHORIZATION]: 403,
  [ErrorType.VALIDATION]: 400,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.CONFLICT]: 409,
  [ErrorType.RATE_LIMIT]: 429,
  [ErrorType.INTERNAL]: 500,
};

/**
 * Interface pour les erreurs personnalisées
 */
export class ApiError extends Error {
  type: ErrorType;
  statusCode: number;
  isOperational: boolean;

  constructor(type: ErrorType, message?: string, isOperational = true) {
    super(message || ERROR_MESSAGES[type]);
    this.type = type;
    this.statusCode = ERROR_STATUS_CODES[type];
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Logger sécurisé qui ne log que en développement
 */
export const secureLog = {
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error);
    } else {
      // En production, logger uniquement le message sans détails
      console.error(`[ERROR] ${message}`);
    }
  },
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, data);
    }
  },
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data);
    }
  },
};

/**
 * Gestionnaire d'erreurs centralisé
 */
export function handleApiError(
  error: any,
  res: NextApiResponse,
  customMessage?: string
) {
  // Si c'est une ApiError personnalisée
  if (error instanceof ApiError) {
    secureLog.error(error.message, error);
    return res.status(error.statusCode).json({
      success: false,
      error: error.type,
      message: customMessage || error.message,
    });
  }

  // Erreurs de validation MongoDB
  if (error.name === 'ValidationError') {
    secureLog.error('Validation error', error);
    return res.status(400).json({
      success: false,
      error: ErrorType.VALIDATION,
      message: customMessage || 'Données invalides',
    });
  }

  // Erreurs de duplication MongoDB
  if (error.code === 11000) {
    secureLog.error('Duplicate key error', error);
    return res.status(409).json({
      success: false,
      error: ErrorType.CONFLICT,
      message: customMessage || 'Cette ressource existe déjà',
    });
  }

  // Erreurs de cast MongoDB (ID invalide)
  if (error.name === 'CastError') {
    secureLog.error('Cast error', error);
    return res.status(400).json({
      success: false,
      error: ErrorType.VALIDATION,
      message: customMessage || 'Identifiant invalide',
    });
  }

  // Erreur générique - NE PAS exposer les détails
  secureLog.error('Unhandled error', error);
  return res.status(500).json({
    success: false,
    error: ErrorType.INTERNAL,
    message: customMessage || ERROR_MESSAGES[ErrorType.INTERNAL],
  });
}

/**
 * Middleware pour vérifier l'authentification
 */
export function requireAuth(session: any): void {
  if (!session || !session.user?.id) {
    throw new ApiError(ErrorType.AUTHENTICATION);
  }
}

/**
 * Middleware pour vérifier les permissions
 */
export function requirePermission(condition: boolean, message?: string): void {
  if (!condition) {
    throw new ApiError(ErrorType.AUTHORIZATION, message);
  }
}

/**
 * Valider les données d'entrée
 */
export function validateInput(condition: boolean, message?: string): void {
  if (!condition) {
    throw new ApiError(ErrorType.VALIDATION, message);
  }
}
