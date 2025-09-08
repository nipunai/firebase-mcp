/**
 * HTTP Transport for Firebase MCP Server
 *
 * This module implements the StreamableHTTPServerTransport for the Firebase MCP server.
 * It provides an Express server that handles MCP protocol requests over HTTP.
 *
 * @module firebase-mcp/transports/http
 */

import express from 'express';
import { randomUUID } from 'node:crypto';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import type { ServerConfig } from '../config.js';
import { createSecurityUtils, extractClientId } from '../utils/security.js';

/**
 * Initialize HTTP transport for the MCP server
 * @param server MCP server instance
 * @param config Server configuration
 * @returns Promise that resolves when the server is started
 */
export async function initializeHttpTransport(server: Server, config: ServerConfig): Promise<void> {
  const app = express();
  app.use(express.json());

  // Initialize security utilities
  const security = createSecurityUtils(config);

  // Map to store transports by session ID
  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  // Handle POST requests for client-to-server communication
  app.post(config.http.path, async (req, res): Promise<void> => {
    // Extract client identifier
    const clientId = extractClientId(req);

    // Check authentication (JWT or API key)
    const authHeader = req.headers['authorization'] as string;
    const apiKey = req.headers['x-api-key'] as string;
    const tokenOrKey = authHeader || apiKey;

    const authResult = security.authManager.authenticate(tokenOrKey);
    if (!authResult.valid) {
      security.requestLogger.logSecurityEvent('auth_failed', clientId, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        authType: security.authManager.getAuthType(),
        error: authResult.error
      });

      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: `Unauthorized: ${authResult.error || 'Authentication failed'}`,
        },
        id: null,
      });
      return;
    }

    // Check rate limiting
    if (!security.rateLimiter.checkLimit(clientId)) {
      security.requestLogger.logSecurityEvent('rate_limit_exceeded', clientId, {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(429).json({
        jsonrpc: '2.0',
        error: {
          code: -32002,
          message: 'Rate limit exceeded',
        },
        id: null,
      });
      return;
    }

    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
      security.requestLogger.logRequest(sessionId, clientId, 'session_reuse', {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: sessionId => {
          // Store the transport by session ID
          transports[sessionId] = transport;
          logger.debug(`Initialized new session: ${sessionId}`);

          security.requestLogger.logRequest(sessionId, clientId, 'session_init', {
            ip: req.ip,
            userAgent: req.headers['user-agent']
          });
        },
      });

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          logger.debug(`Closing session: ${transport.sessionId}`);
          security.requestLogger.logRequest(transport.sessionId, clientId, 'session_close', {
            ip: req.ip,
            userAgent: req.headers['user-agent']
          });
          delete transports[transport.sessionId];
        }
      };

      // Connect to the MCP server
      await server.connect(transport);
    } else {
      // Invalid request
      logger.error('Invalid request: No valid session ID provided');
      security.requestLogger.logSecurityEvent('invalid_session', clientId, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: sessionId || 'none'
      });

      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
    return;
  });

  // Reusable handler for GET and DELETE requests
  const handleSessionRequest = async (
    req: express.Request,
    res: express.Response
  ): Promise<void> => {
    const clientId = extractClientId(req);

    // Check authentication (JWT or API key)
    const authHeader = req.headers['authorization'] as string;
    const apiKey = req.headers['x-api-key'] as string;
    const tokenOrKey = authHeader || apiKey;

    const authResult = security.authManager.authenticate(tokenOrKey);
    if (!authResult.valid) {
      security.requestLogger.logSecurityEvent('auth_failed', clientId, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        method: req.method,
        authType: security.authManager.getAuthType(),
        error: authResult.error
      });

      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: `Unauthorized: ${authResult.error || 'Authentication failed'}`,
        },
        id: null,
      });
      return;
    }

    // Check rate limiting
    if (!security.rateLimiter.checkLimit(clientId)) {
      security.requestLogger.logSecurityEvent('rate_limit_exceeded', clientId, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        method: req.method
      });

      res.status(429).json({
        jsonrpc: '2.0',
        error: {
          code: -32002,
          message: 'Rate limit exceeded',
        },
        id: null,
      });
      return;
    }

    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      logger.error(`Invalid or missing session ID: ${sessionId}`);
      security.requestLogger.logSecurityEvent('invalid_session', clientId, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: sessionId || 'none',
        method: req.method
      });

      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Invalid or missing session ID',
        },
        id: null,
      });
      return;
    }

    security.requestLogger.logRequest(sessionId, clientId, `session_${req.method.toLowerCase()}`, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
    return;
  };

  // Handle GET requests for server-to-client notifications via SSE
  app.get(config.http.path, handleSessionRequest);

  // Handle DELETE requests for session termination
  app.delete(config.http.path, handleSessionRequest);

  // Start the HTTP server
  const serverInstance = app.listen(config.http.port, config.http.host, () => {
    logger.info(
      `HTTP transport listening on ${config.http.host}:${config.http.port}${config.http.path}`
    );
  });

  // Handle server errors (if the server instance has an 'on' method)
  if (serverInstance && typeof serverInstance.on === 'function') {
    serverInstance.on('error', error => {
      logger.error('HTTP server error', error);
    });
  }

  // Handle graceful shutdown
  const sigintHandler = async (): Promise<void> => {
    logger.info('Shutting down HTTP server');
    if (serverInstance && typeof serverInstance.close === 'function') {
      serverInstance.close();
    }
  };

  // Add SIGINT handler (avoid adding duplicate handlers in tests)
  const existingListeners = process.listenerCount('SIGINT');
  if (existingListeners < 10) {
    process.on('SIGINT', sigintHandler);
  }
}
