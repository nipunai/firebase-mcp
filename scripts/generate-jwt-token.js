#!/usr/bin/env node

/**
 * JWT Token Generator Utility
 * 
 * This script generates JWT tokens for testing and development purposes.
 * It can be used to create tokens with different user payloads and expiration times.
 */

import jwt from 'jsonwebtoken';
import config from '../dist/src/config.js';

/**
 * Generate a JWT token with the given payload
 */
function generateToken(payload = {}) {
    const defaultPayload = {
        userId: 'test-user-123',
        email: 'test@example.com',
        roles: ['user'],
        ...payload
    };

    const token = jwt.sign(defaultPayload, config.security.jwt.secret, {
        issuer: config.security.jwt.issuer,
        audience: config.security.jwt.audience,
        expiresIn: config.security.jwt.expiresIn
    });

    return token;
}

/**
 * Decode and display token information
 */
function displayTokenInfo(token) {
    try {
        const decoded = jwt.decode(token, { complete: true });
        console.log('📋 Token Information:');
        console.log('  Header:', JSON.stringify(decoded.header, null, 2));
        console.log('  Payload:', JSON.stringify(decoded.payload, null, 2));

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (decoded.payload.exp && decoded.payload.exp < now) {
            console.log('  ⚠️  Token is EXPIRED');
        } else if (decoded.payload.exp) {
            const expiresIn = decoded.payload.exp - now;
            console.log(`  ✅ Token expires in ${expiresIn} seconds`);
        }
    } catch (error) {
        console.error('❌ Error decoding token:', error.message);
    }
}

/**
 * Main function
 */
function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
JWT Token Generator for Firebase MCP Server

Usage:
  node scripts/generate-jwt-token.js [options]

Options:
  --user-id <id>        Set user ID (default: test-user-123)
  --email <email>       Set user email (default: test@example.com)
  --roles <roles>       Set user roles (comma-separated, default: user)
  --expires-in <time>   Set expiration time (default: 1h)
  --decode <token>      Decode and display token information
  --help, -h            Show this help message

Examples:
  # Generate a basic token
  node scripts/generate-jwt-token.js

  # Generate a token for a specific user
  node scripts/generate-jwt-token.js --user-id admin-123 --email admin@example.com --roles admin,user

  # Generate a token that expires in 30 minutes
  node scripts/generate-jwt-token.js --expires-in 30m

  # Decode an existing token
  node scripts/generate-jwt-token.js --decode "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
`);
        return;
    }

    // Handle decode option
    const decodeIndex = args.indexOf('--decode');
    if (decodeIndex !== -1 && args[decodeIndex + 1]) {
        const token = args[decodeIndex + 1];
        console.log('🔍 Decoding JWT token...\n');
        displayTokenInfo(token);
        return;
    }

    // Parse command line arguments
    const payload = {};
    let expiresIn = config.security.jwt.expiresIn;

    for (let i = 0; i < args.length; i += 2) {
        const option = args[i];
        const value = args[i + 1];

        switch (option) {
            case '--user-id':
                payload.userId = value;
                break;
            case '--email':
                payload.email = value;
                break;
            case '--roles':
                payload.roles = value.split(',').map(role => role.trim());
                break;
            case '--expires-in':
                expiresIn = value;
                break;
        }
    }

    // Generate token
    console.log('🔑 Generating JWT token...\n');

    const token = jwt.sign(payload, config.security.jwt.secret, {
        issuer: config.security.jwt.issuer,
        audience: config.security.jwt.audience,
        expiresIn: expiresIn
    });

    console.log('✅ JWT Token Generated:');
    console.log('─'.repeat(80));
    console.log(token);
    console.log('─'.repeat(80));

    console.log('\n📋 Token Details:');
    console.log(`  User ID: ${payload.userId || 'test-user-123'}`);
    console.log(`  Email: ${payload.email || 'test@example.com'}`);
    console.log(`  Roles: ${(payload.roles || ['user']).join(', ')}`);
    console.log(`  Expires In: ${expiresIn}`);
    console.log(`  Issuer: ${config.security.jwt.issuer}`);
    console.log(`  Audience: ${config.security.jwt.audience}`);

    console.log('\n🔧 Usage Examples:');
    console.log('  # Test with curl:');
    console.log(`  curl -H "Authorization: Bearer ${token}" \\`);
    console.log('       -H "Content-Type: application/json" \\');
    console.log('       -H "Accept: application/json, text/event-stream" \\');
    console.log('       -X POST http://localhost:3000/mcp \\');
    console.log('       -d \'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}\'');

    console.log('\n  # Test with the test script:');
    console.log(`  JWT_TOKEN="${token}" node scripts/test-jwt-auth.js`);
}

// Run the main function
main();

