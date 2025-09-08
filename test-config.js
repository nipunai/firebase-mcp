#!/usr/bin/env node

// Test script to verify configuration loading
import config from './dist/src/config.js';

console.log('Configuration loaded:');
console.log('Transport:', config.transport);
console.log('HTTP Port:', config.http.port);
console.log('Security Config:');
console.log('  Allowed API Keys:', config.security.allowedApiKeys);
console.log('  Rate Limit Requests:', config.security.rateLimit.requests);
console.log('  Rate Limit Window:', config.security.rateLimit.windowMs);
console.log('  Request Logging:', config.security.enableRequestLogging);
