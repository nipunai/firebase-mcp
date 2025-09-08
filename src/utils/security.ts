/**
 * Security Utilities for Firebase MCP Server
 *
 * This module provides security-related utilities including API key validation,
 * rate limiting, and request logging for multi-client scenarios.
 *
 * @module firebase-mcp/utils/security
 */

import { logger } from './logger.js';
import type { ServerConfig } from '../config.js';
import { createJWTAuthManager, type AuthResult } from './jwtAuth.js';

/**
 * Rate limiter class for managing client request limits
 */
export class RateLimiter {
    private limits: Map<string, { count: number; resetTime: number }> = new Map();
    private config: ServerConfig['security']['rateLimit'];

    constructor(config: ServerConfig['security']['rateLimit']) {
        this.config = config;

        // Clean up expired entries every 5 minutes
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 5 * 60 * 1000);
    }

    /**
     * Check if a client has exceeded the rate limit
     * @param clientId Unique identifier for the client
     * @returns True if request is allowed, false if rate limited
     */
    checkLimit(clientId: string): boolean {
        const now = Date.now();
        const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
        const key = `${clientId}:${windowStart}`;

        const current = this.limits.get(key) || { count: 0, resetTime: windowStart + this.config.windowMs };

        if (current.count >= this.config.requests) {
            logger.warn(`Rate limit exceeded for client: ${clientId}`, {
                clientId,
                count: current.count,
                limit: this.config.requests,
                windowMs: this.config.windowMs
            });
            return false;
        }

        current.count++;
        this.limits.set(key, current);

        logger.debug(`Rate limit check for client: ${clientId}`, {
            clientId,
            count: current.count,
            limit: this.config.requests,
            remaining: this.config.requests - current.count
        });

        return true;
    }

    /**
     * Get current rate limit status for a client
     * @param clientId Unique identifier for the client
     * @returns Rate limit status information
     */
    getStatus(clientId: string): { count: number; limit: number; remaining: number; resetTime: number } {
        const now = Date.now();
        const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
        const key = `${clientId}:${windowStart}`;

        const current = this.limits.get(key) || { count: 0, resetTime: windowStart + this.config.windowMs };

        return {
            count: current.count,
            limit: this.config.requests,
            remaining: Math.max(0, this.config.requests - current.count),
            resetTime: current.resetTime
        };
    }

    /**
     * Clean up expired rate limit entries
     */
    private cleanupExpiredEntries(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [key, entry] of this.limits.entries()) {
            if (now > entry.resetTime) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => this.limits.delete(key));

        if (expiredKeys.length > 0) {
            logger.debug(`Cleaned up ${expiredKeys.length} expired rate limit entries`);
        }
    }
}

/**
 * Authentication Manager class for handling multiple authentication methods
 */
export class AuthenticationManager {
    private jwtAuth: ReturnType<typeof createJWTAuthManager>;
    private apiKeyValidator: ApiKeyValidator;
    private authType: ServerConfig['security']['authType'];

    constructor(config: ServerConfig['security']) {
        this.authType = config.authType;
        this.jwtAuth = createJWTAuthManager(config.jwt);
        this.apiKeyValidator = new ApiKeyValidator(config.allowedApiKeys);

        logger.info(`Authentication manager initialized with type: ${this.authType}`);
    }

    /**
     * Authenticate a request using the configured authentication method
     * @param tokenOrKey JWT token or API key
     * @returns Authentication result
     */
    authenticate(tokenOrKey: string | undefined): AuthResult {
        switch (this.authType) {
            case 'jwt':
                return this.jwtAuth.validateToken(tokenOrKey || '');

            case 'api-key':
                const isValid = this.apiKeyValidator.validate(tokenOrKey);
                return {
                    valid: isValid,
                    error: isValid ? undefined : 'Invalid API key'
                };

            case 'none':
                return { valid: true };

            default:
                return {
                    valid: false,
                    error: 'Unknown authentication type'
                };
        }
    }

    /**
     * Generate a JWT token (only available for JWT auth type)
     * @param payload User payload
     * @returns JWT token
     */
    generateToken(payload: any): string | null {
        if (this.authType === 'jwt') {
            return this.jwtAuth.generateToken(payload);
        }
        return null;
    }

    /**
     * Check if authentication is enabled
     * @returns True if authentication is enabled
     */
    isEnabled(): boolean {
        return this.authType !== 'none';
    }

    /**
     * Get authentication type
     * @returns Current authentication type
     */
    getAuthType(): string {
        return this.authType;
    }
}

/**
 * API Key validator for client authentication
 */
export class ApiKeyValidator {
    private allowedKeys: Set<string>;

    constructor(allowedKeys: string[]) {
        this.allowedKeys = new Set(allowedKeys);

        if (allowedKeys.length === 0) {
            logger.warn('No API keys configured - authentication is disabled');
        } else {
            logger.info(`API key authentication enabled with ${allowedKeys.length} keys`);
        }
    }

    /**
     * Validate an API key
     * @param apiKey The API key to validate
     * @returns True if the API key is valid
     */
    validate(apiKey: string | undefined): boolean {
        if (!apiKey) {
            logger.debug('No API key provided in request');
            return this.allowedKeys.size === 0; // Allow if no keys configured
        }

        const isValid = this.allowedKeys.has(apiKey);

        if (!isValid) {
            logger.warn('Invalid API key provided', {
                providedKey: apiKey.substring(0, 8) + '...', // Log only first 8 chars for security
                timestamp: new Date().toISOString()
            });
        } else {
            logger.debug('Valid API key provided', {
                keyPrefix: apiKey.substring(0, 8) + '...',
                timestamp: new Date().toISOString()
            });
        }

        return isValid;
    }

    /**
     * Check if authentication is enabled
     * @returns True if API key authentication is enabled
     */
    isEnabled(): boolean {
        return this.allowedKeys.size > 0;
    }
}

/**
 * Request logger for audit trails
 */
export class RequestLogger {
    private enabled: boolean;

    constructor(enabled: boolean) {
        this.enabled = enabled;

        if (enabled) {
            logger.info('Request logging enabled');
        } else {
            logger.info('Request logging disabled');
        }
    }

    /**
     * Log a client request
     * @param sessionId Session ID
     * @param clientId Client identifier
     * @param operation Operation being performed
     * @param details Additional details about the request
     */
    logRequest(
        sessionId: string,
        clientId: string,
        operation: string,
        details: Record<string, any> = {}
    ): void {
        if (!this.enabled) return;

        const logEntry = {
            type: 'request',
            sessionId,
            clientId,
            operation,
            timestamp: new Date().toISOString(),
            ...details
        };

        logger.info('MCP Request', logEntry);
    }

    /**
     * Log a client response
     * @param sessionId Session ID
     * @param clientId Client identifier
     * @param operation Operation that was performed
     * @param success Whether the operation was successful
     * @param details Additional details about the response
     */
    logResponse(
        sessionId: string,
        clientId: string,
        operation: string,
        success: boolean,
        details: Record<string, any> = {}
    ): void {
        if (!this.enabled) return;

        const logEntry = {
            type: 'response',
            sessionId,
            clientId,
            operation,
            success,
            timestamp: new Date().toISOString(),
            ...details
        };

        logger.info('MCP Response', logEntry);
    }

    /**
     * Log a security event
     * @param event Security event type
     * @param clientId Client identifier
     * @param details Additional details about the event
     */
    logSecurityEvent(
        event: 'auth_failed' | 'rate_limit_exceeded' | 'invalid_session' | 'unauthorized_access',
        clientId: string,
        details: Record<string, any> = {}
    ): void {
        const logEntry = {
            type: 'security_event',
            event,
            clientId,
            timestamp: new Date().toISOString(),
            ...details
        };

        logger.warn('Security Event', logEntry);
    }
}

/**
 * Extract client identifier from request
 * @param req Express request object
 * @returns Client identifier
 */
export function extractClientId(req: any): string {
    // Try to get client ID from various sources
    const authHeader = req.headers['authorization'] as string;
    const apiKey = req.headers['x-api-key'] as string;
    const userAgent = req.headers['user-agent'] as string;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    // Use JWT token if available
    if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, '');
        // Try to extract user ID from JWT without full validation
        try {
            const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            if (decoded.userId) {
                return `jwt:${decoded.userId}`;
            }
        } catch {
            // Fall through to other methods
        }
    }

    // Use API key prefix if available
    if (apiKey) {
        return `api:${apiKey.substring(0, 8)}`;
    }

    // Create a simple hash of IP + user agent for anonymous clients
    const combined = `${ip}:${userAgent}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return `anon:${Math.abs(hash).toString(36)}`;
}

/**
 * Create security utilities from configuration
 * @param config Server configuration
 * @returns Security utilities instance
 */
export function createSecurityUtils(config: ServerConfig) {
    return {
        rateLimiter: new RateLimiter(config.security.rateLimit),
        authManager: new AuthenticationManager(config.security),
        requestLogger: new RequestLogger(config.security.enableRequestLogging)
    };
}
