# Phase 1 Security Setup Guide

This guide explains how to configure and use the Phase 1 security features implemented in the Firebase MCP server.

## Overview

Phase 1 security includes:
- ✅ **JWT Token Authentication** - Secure token-based authentication
- ✅ **API Key Authentication** - Fallback authentication method
- ✅ **Rate Limiting** - Protect against abuse and DoS attacks
- ✅ **Request Logging** - Enable monitoring and audit trails

## Environment Variables

Set the following environment variables to configure Phase 1 security:

### Required Configuration

```bash
# Firebase Configuration (Required)
SERVICE_ACCOUNT_KEY_PATH=/path/to/your/firebase-service-account.json
FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app

# Transport Configuration
MCP_TRANSPORT=http
MCP_HTTP_PORT=3000
MCP_HTTP_HOST=localhost
MCP_HTTP_PATH=/mcp
```

### Security Configuration

```bash
# Authentication Type
# Options: 'jwt', 'api-key', 'none' (default: 'jwt')
AUTH_TYPE=jwt

# JWT Configuration
# JWT secret for signing/verifying tokens (REQUIRED for JWT auth)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
# JWT issuer (default: 'firebase-mcp')
JWT_ISSUER=firebase-mcp
# JWT audience (default: 'firebase-mcp-clients')
JWT_AUDIENCE=firebase-mcp-clients
# Token expiration time in seconds (default: 3600 = 1 hour)
JWT_EXPIRES_IN=3600

# API Key Authentication (fallback)
# Comma-separated list of allowed API keys
ALLOWED_API_KEYS=test-api-key-123,production-key-456,admin-key-789

# Rate Limiting
# Maximum requests per window (default: 100)
RATE_LIMIT_REQUESTS=100
# Time window in milliseconds (default: 60000 = 1 minute)
RATE_LIMIT_WINDOW_MS=60000

# Request Logging
# Enable/disable request logging (default: true)
ENABLE_REQUEST_LOGGING=true
```

## Starting the Server

1. **Set environment variables:**
   ```bash
   export ALLOWED_API_KEYS="test-api-key-123,production-key-456"
   export RATE_LIMIT_REQUESTS=50
   export RATE_LIMIT_WINDOW_MS=60000
   export ENABLE_REQUEST_LOGGING=true
   ```

2. **Start the server:**
   ```bash
   npm run start:http
   ```

3. **Verify the server is running:**
   ```bash
   curl -H "x-api-key: test-api-key-123" http://localhost:3000/mcp
   ```

## Client Configuration

### Using the Firebase MCP Client

```typescript
import { createFirebaseMcpClient } from '@gannonh/firebase-mcp';

const client = createFirebaseMcpClient({
  transport: 'http',
  http: {
    port: 3000,
    host: 'localhost',
    path: '/mcp'
  }
});

// The client will need to include the API key in requests
// This is handled automatically by the HTTP transport
```

### Using curl for Testing

```bash
# Valid API key
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key-123" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}' \
  http://localhost:3000/mcp

# Invalid API key (should return 401)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid-key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}' \
  http://localhost:3000/mcp
```

## Testing Phase 1 Security

Run the included test script to verify all security features:

```bash
# Make sure the server is running first
npm run start:http

# Run the test script
node scripts/test-phase1-security.js
```

The test script will verify:
- ✅ Valid API keys are accepted
- ✅ Invalid API keys are rejected
- ✅ Missing API keys are rejected
- ✅ Rate limiting is working
- ✅ Request logging is active

## Security Features Details

### API Key Authentication

- **Purpose**: Prevent unauthorized access to the MCP server
- **Implementation**: Validates `x-api-key` header on all requests
- **Configuration**: Set `ALLOWED_API_KEYS` environment variable
- **Behavior**: 
  - Valid keys: Request proceeds normally
  - Invalid/missing keys: Returns 401 Unauthorized

### Rate Limiting

- **Purpose**: Prevent abuse and DoS attacks
- **Implementation**: Tracks requests per client ID in time windows
- **Configuration**: Set `RATE_LIMIT_REQUESTS` and `RATE_LIMIT_WINDOW_MS`
- **Behavior**:
  - Within limits: Request proceeds normally
  - Exceeds limits: Returns 429 Too Many Requests

### Request Logging

- **Purpose**: Enable monitoring and audit trails
- **Implementation**: Logs all requests, responses, and security events
- **Configuration**: Set `ENABLE_REQUEST_LOGGING` environment variable
- **Log Types**:
  - Request logs: Normal operations
  - Security events: Authentication failures, rate limiting, etc.

## Monitoring and Debugging

### Viewing Logs

The server logs all security events. Look for these log entries:

```
[INFO] MCP Request - session_init
[INFO] MCP Request - session_reuse
[WARN] Security Event - auth_failed
[WARN] Security Event - rate_limit_exceeded
[DEBUG] Rate limit check for client: api:test-api
```

### Rate Limit Status

You can check rate limit status by examining the logs:

```
[DEBUG] Rate limit check for client: api:test-api-123
  clientId: "api:test-api-123"
  count: 5
  limit: 100
  remaining: 95
```

## Troubleshooting

### Common Issues

1. **"Unauthorized: Invalid or missing API key"**
   - Check that `ALLOWED_API_KEYS` is set correctly
   - Verify the client is sending the `x-api-key` header
   - Ensure the API key is in the allowed list

2. **"Rate limit exceeded"**
   - Check `RATE_LIMIT_REQUESTS` and `RATE_LIMIT_WINDOW_MS` settings
   - Verify the client isn't making too many requests
   - Wait for the rate limit window to reset

3. **Server not starting**
   - Check that all required environment variables are set
   - Verify the Firebase service account path is correct
   - Check that the port isn't already in use

### Debug Mode

Enable debug logging to see detailed security information:

```bash
export DEBUG=firebase-mcp:*
npm run start:http
```

## Next Steps

Phase 1 provides basic security. For enhanced security, consider implementing:

- **Phase 2**: JWT token authentication and user context
- **Phase 3**: Data isolation and permission-based operations
- **Phase 4**: Multi-tenant support and advanced features

## Usage Examples

### JWT Authentication (Recommended)

#### 1. Generate a JWT Token

```bash
# Generate a basic token
node scripts/generate-jwt-token.js

# Generate a token for a specific user
node scripts/generate-jwt-token.js --user-id admin-123 --email admin@example.com --roles admin,user

# Generate a token that expires in 30 minutes
node scripts/generate-jwt-token.js --expires-in 30m
```

#### 2. Use JWT Token in Requests

```bash
# Using curl with JWT token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -X POST http://localhost:3000/mcp \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```

#### 3. JavaScript/Node.js Example

```javascript
const jwt = require('jsonwebtoken');

// Generate token
const token = jwt.sign({
  userId: 'user-123',
  email: 'user@example.com',
  roles: ['user']
}, 'your-jwt-secret', {
  issuer: 'firebase-mcp',
  audience: 'firebase-mcp-clients',
  expiresIn: '1h'
});

// Use token in request
fetch('http://localhost:3000/mcp', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  })
});
```

### API Key Authentication (Fallback)

```bash
curl -H "x-api-key: your-api-key" \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -X POST http://localhost:3000/mcp \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```

## Security Best Practices

1. **JWT Token Management**:
   - Use strong, random JWT secrets
   - Set appropriate expiration times
   - Include user context in tokens
   - Validate tokens on every request

2. **API Key Management** (Fallback):
   - Use strong, random API keys
   - Rotate keys regularly
   - Store keys securely (environment variables, not in code)
   - Use different keys for different environments

3. **Rate Limiting**:
   - Set appropriate limits based on expected usage
   - Monitor rate limit violations
   - Consider different limits for different operations

4. **Logging**:
   - Monitor security events regularly
   - Set up alerts for authentication failures
   - Keep logs for audit purposes
   - Consider log aggregation for production

4. **Network Security**:
   - Use HTTPS in production
   - Consider IP whitelisting
   - Implement proper firewall rules
   - Use a reverse proxy for additional security layers
