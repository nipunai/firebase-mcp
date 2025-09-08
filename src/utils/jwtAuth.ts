/**
 * JWT Authentication Utilities for Firebase MCP Server
 *
 * This module provides JWT token-based authentication utilities including
 * token generation, validation, and user context management.
 *
 * @module firebase-mcp/utils/jwtAuth
 */

import jwt from 'jsonwebtoken';
import { logger } from './logger.js';
import type { ServerConfig } from '../config.js';

/**
 * JWT payload interface
 */
export interface JWTPayload {
    /** User ID */
    userId: string;
    /** User email */
    email?: string;
    /** User roles/permissions */
    roles?: string[];
    /** Token issued at */
    iat?: number;
    /** Token expiration */
    exp?: number;
    /** Token issuer */
    iss?: string;
    /** Token audience */
    aud?: string;
}

/**
 * JWT authentication result
 */
export interface AuthResult {
    /** Whether authentication was successful */
    valid: boolean;
    /** User payload if valid */
    payload?: JWTPayload;
    /** Error message if invalid */
    error?: string;
}

/**
 * JWT Authentication Manager
 */
export class JWTAuthManager {
    private config: ServerConfig['security']['jwt'];

    constructor(config: ServerConfig['security']['jwt']) {
        this.config = config;

        if (!config.secret || config.secret === 'your-secret-key-change-this-in-production') {
            logger.warn('JWT secret is using default value - change JWT_SECRET in production!');
        }

        logger.info('JWT authentication manager initialized', {
            issuer: config.issuer,
            audience: config.audience,
            expiresIn: config.expiresIn
        });
    }

    /**
     * Generate a JWT token for a user
     * @param payload User payload to include in token
     * @returns Signed JWT token
     */
    generateToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
        const tokenPayload: JWTPayload = {
            ...payload,
            iss: this.config.issuer,
            aud: this.config.audience,
        };

        const token = jwt.sign(tokenPayload, this.config.secret, {
            expiresIn: this.config.expiresIn,
        });

        logger.debug('JWT token generated', {
            userId: payload.userId,
            email: payload.email,
            expiresIn: this.config.expiresIn
        });

        return token;
    }

    /**
     * Validate a JWT token
     * @param token JWT token to validate
     * @returns Authentication result
     */
    validateToken(token: string): AuthResult {
        try {
            if (!token) {
                return {
                    valid: false,
                    error: 'No token provided'
                };
            }

            // Remove 'Bearer ' prefix if present
            const cleanToken = token.replace(/^Bearer\s+/i, '');

            const payload = jwt.verify(cleanToken, this.config.secret, {
                issuer: this.config.issuer,
                audience: this.config.audience,
            }) as JWTPayload;

            logger.debug('JWT token validated successfully', {
                userId: payload.userId,
                email: payload.email,
                roles: payload.roles
            });

            return {
                valid: true,
                payload
            };

        } catch (error) {
            let errorMessage = 'Invalid token';

            if (error instanceof jwt.TokenExpiredError) {
                errorMessage = 'Token expired';
            } else if (error instanceof jwt.JsonWebTokenError) {
                errorMessage = 'Invalid token format';
            } else if (error instanceof jwt.NotBeforeError) {
                errorMessage = 'Token not active yet';
            }

            logger.warn('JWT token validation failed', {
                error: errorMessage,
                tokenPrefix: token?.substring(0, 20) + '...'
            });

            return {
                valid: false,
                error: errorMessage
            };
        }
    }

    /**
     * Extract user ID from token without full validation (for logging)
     * @param token JWT token
     * @returns User ID if extractable, undefined otherwise
     */
    extractUserId(token: string): string | undefined {
        try {
            const cleanToken = token.replace(/^Bearer\s+/i, '');
            const decoded = jwt.decode(cleanToken) as JWTPayload;
            return decoded?.userId;
        } catch {
            return undefined;
        }
    }

    /**
     * Check if authentication is enabled
     * @returns True if JWT authentication is properly configured
     */
    isEnabled(): boolean {
        return !!(this.config.secret && this.config.secret !== 'your-secret-key-change-this-in-production');
    }
}

/**
 * Create JWT authentication manager
 * @param config JWT configuration
 * @returns JWT authentication manager instance
 */
export function createJWTAuthManager(config: ServerConfig['security']['jwt']): JWTAuthManager {
    return new JWTAuthManager(config);
}

