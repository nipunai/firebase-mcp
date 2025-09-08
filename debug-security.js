#!/usr/bin/env node

// Debug script to test security utilities
import { createSecurityUtils } from './dist/src/utils/security.js';
import jwt from 'jsonwebtoken';

// Use actual config from environment
const config = {
    security: {
        authType: process.env.AUTH_TYPE || 'jwt',
        jwt: {
            secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
            issuer: process.env.JWT_ISSUER || 'firebase-mcp',
            audience: process.env.JWT_AUDIENCE || 'firebase-mcp-clients',
            expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600', 10)
        },
        allowedApiKeys: process.env.ALLOWED_API_KEYS?.split(',').map(key => key.trim()) || [],
        rateLimit: {
            requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '3', 10),
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10)
        },
        enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false'
    }
};

console.log('Testing security utilities...');

const security = createSecurityUtils(config);

// Test authentication
console.log('\nTesting authentication:');
console.log('Auth type:', security.authManager.getAuthType());
console.log('Auth enabled:', security.authManager.isEnabled());

// Test JWT authentication
const testToken = jwt.sign({
    userId: 'test-user-123',
    email: 'test@example.com',
    roles: ['user']
}, 'test-jwt-secret-key-for-testing-only', {
    issuer: 'firebase-mcp',
    audience: 'firebase-mcp-clients',
    expiresIn: '1h'
});

console.log('Valid JWT token:', security.authManager.authenticate(`Bearer ${testToken}`).valid);
console.log('Invalid JWT token:', security.authManager.authenticate('invalid-token').valid);
console.log('Missing token:', security.authManager.authenticate(undefined).valid);

// Test rate limiting
console.log('\nTesting rate limiting:');
const clientId = 'test-client';
for (let i = 1; i <= 5; i++) {
    const allowed = security.rateLimiter.checkLimit(clientId);
    console.log(`Request ${i}: ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
}

console.log('\nSecurity utilities test completed.');
