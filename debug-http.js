#!/usr/bin/env node

// Debug script to test HTTP transport security
import config from './dist/src/config.js';
import { createSecurityUtils, extractClientId } from './dist/src/utils/security.js';

console.log('Testing HTTP transport security...');
console.log('Config:', JSON.stringify(config, null, 2));

const security = createSecurityUtils(config);

console.log('\nSecurity utilities created:');
console.log('API Key Validator enabled:', security.apiKeyValidator.isEnabled());
console.log('Rate Limiter config:', security.rateLimiter.config);
console.log('Request Logger enabled:', security.requestLogger.enabled);

// Test with mock request
const mockReq = {
    headers: {
        'x-api-key': 'test-api-key-123',
        'user-agent': 'test-agent',
        'mcp-session-id': 'test-session'
    },
    ip: '127.0.0.1',
    body: {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
                name: 'test-client',
                version: '1.0.0'
            }
        }
    }
};

console.log('\nTesting with mock request:');
const clientId = extractClientId(mockReq);
console.log('Client ID:', clientId);

const apiKey = mockReq.headers['x-api-key'];
console.log('API Key validation:', security.apiKeyValidator.validate(apiKey));
console.log('Rate limit check:', security.rateLimiter.checkLimit(clientId));

console.log('\nHTTP transport security test completed.');

