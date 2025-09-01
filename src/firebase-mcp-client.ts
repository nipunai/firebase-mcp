/**
 * Firebase MCP Client
 *
 * A comprehensive client for interacting with the Firebase MCP server.
 * Provides methods for all available Firebase operations including Firestore,
 * Authentication, and Storage services.
 *
 * @module firebase-mcp-client
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Configuration options for the Firebase MCP client
 */
export interface FirebaseMcpClientConfig {
  /** Transport type to use */
  transport: 'stdio' | 'http';
  /** HTTP transport configuration */
  http?: {
    /** HTTP port */
    port: number;
    /** HTTP host */
    host: string;
    /** HTTP path */
    path: string;
  };
}

/**
 * Filter condition for Firestore queries
 */
export interface FirestoreFilter {
  /** Field name to filter */
  field: string;
  /** Comparison operator */
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';
  /** Value to compare against */
  value: string | number | boolean | string[];
}

/**
 * Ordering configuration for Firestore queries
 */
export interface FirestoreOrderBy {
  /** Field name to order by */
  field: string;
  /** Sort direction */
  direction?: 'asc' | 'desc';
}

/**
 * Document data for Firestore operations
 */
export interface FirestoreDocument {
  [key: string]: any;
}

/**
 * Response from Firestore list documents operation
 */
export interface FirestoreListResponse {
  documents: Array<{
    id: string;
    path: string;
    data: Record<string, any>;
  }>;
  nextPageToken?: string;
}

/**
 * Response from Firestore collections list operation
 */
export interface FirestoreCollectionsResponse {
  collections: Array<{
    id: string;
    path: string;
    url: string;
  }>;
  path: string;
  projectId: string;
}

/**
 * Storage file information
 */
export interface StorageFileInfo {
  name: string;
  bucket: string;
  size: string;
  contentType: string | null;
  updated: string | null;
  md5Hash: string | null;
  downloadUrl: string;
}

/**
 * Storage file list response
 */
export interface StorageListResponse {
  files: Array<{
    name: string;
    size: string;
    contentType: string | null;
    updated: string | null;
    md5Hash: string | null;
  }>;
}

/**
 * Authentication user information
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  disabled: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

/**
 * Main Firebase MCP Client class
 */
export class FirebaseMcpClient {
  private client: Client;
  private config: FirebaseMcpClientConfig;

  /**
   * Creates a new Firebase MCP client
   * @param config Configuration options
   */
  constructor(config: FirebaseMcpClientConfig) {
    this.config = config;
    this.client = new Client({
      name: 'firebase-mcp-client',
      version: '1.0.0',
    });
  }

  /**
   * Connects to the Firebase MCP server
   */
  async connect(): Promise<void> {
    if (this.config.transport === 'http' && this.config.http) {
      const url = `http://${this.config.http.host}:${this.config.http.port}${this.config.http.path}`;
      await this.client.connect({
        transport: {
          type: 'http',
          url,
        },
      });
    } else {
      // Default to stdio transport
      await this.client.connect({
        transport: {
          type: 'stdio',
        },
      });
    }
  }

  /**
   * Disconnects from the Firebase MCP server
   */
  async disconnect(): Promise<void> {
    await this.client.close();
  }

  /**
   * Lists all available tools from the server
   */
  async listTools(): Promise<any> {
    const response = await this.client.callTool({
      name: 'tools/list',
      arguments: {},
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Adds a document to a Firestore collection
   * @param collection Collection name
   * @param data Document data
   * @returns Document reference with ID and path
   */
  async addDocument(collection: string, data: FirestoreDocument): Promise<{ id: string; path: string }> {
    const response = await this.client.callTool({
      name: 'firestore_add_document',
      arguments: {
        collection,
        data,
      },
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Lists documents from a Firestore collection with filtering and ordering
   * @param collection Collection name
   * @param options Query options
   * @returns List of documents with pagination
   */
  async listDocuments(
    collection: string,
    options: {
      filters?: FirestoreFilter[];
      limit?: number;
      pageToken?: string;
      orderBy?: FirestoreOrderBy[];
    } = {}
  ): Promise<FirestoreListResponse> {
    const response = await this.client.callTool({
      name: 'firestore_list_documents',
      arguments: {
        collection,
        ...options,
      },
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Gets a specific document from Firestore
   * @param collection Collection name
   * @param id Document ID
   * @returns Document data
   */
  async getDocument(collection: string, id: string): Promise<{ id: string; path: string; data: Record<string, any> }> {
    const response = await this.client.callTool({
      name: 'firestore_get_document',
      arguments: {
        collection,
        id,
      },
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Updates a document in Firestore
   * @param collection Collection name
   * @param id Document ID
   * @param data Data to update
   * @returns Update confirmation
   */
  async updateDocument(collection: string, id: string, data: FirestoreDocument): Promise<{ id: string; path: string; updated: boolean }> {
    const response = await this.client.callTool({
      name: 'firestore_update_document',
      arguments: {
        collection,
        id,
        data,
      },
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Deletes a document from Firestore
   * @param collection Collection name
   * @param id Document ID
   * @returns Deletion confirmation
   */
  async deleteDocument(collection: string, id: string): Promise<{ id: string; path: string; deleted: boolean }> {
    const response = await this.client.callTool({
      name: 'firestore_delete_document',
      arguments: {
        collection,
        id,
      },
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Lists root collections in Firestore
   * @returns List of collections with URLs
   */
  async listCollections(): Promise<FirestoreCollectionsResponse> {
    const response = await this.client.callTool({
      name: 'firestore_list_collections',
      arguments: {},
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Queries documents across all subcollections with the same name
   * @param collectionId Collection ID to query
   * @param options Query options
   * @returns List of documents with pagination
   */
  async queryCollectionGroup(
    collectionId: string,
    options: {
      filters?: FirestoreFilter[];
      orderBy?: FirestoreOrderBy[];
      limit?: number;
      pageToken?: string;
    } = {}
  ): Promise<FirestoreListResponse> {
    const response = await this.client.callTool({
      name: 'firestore_query_collection_group',
      arguments: {
        collectionId,
        ...options,
      },
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Gets a user by ID or email from Firebase Authentication
   * @param identifier User ID or email address
   * @returns User information
   */
  async getUser(identifier: string): Promise<{ user: AuthUser }> {
    const response = await this.client.callTool({
      name: 'auth_get_user',
      arguments: {
        identifier,
      },
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Lists files in Firebase Storage
   * @param directoryPath Optional directory path to list files from
   * @returns List of files
   */
  async listStorageFiles(directoryPath?: string): Promise<StorageListResponse> {
    const response = await this.client.callTool({
      name: 'storage_list_files',
      arguments: {
        directoryPath,
      },
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Gets file information from Firebase Storage
   * @param filePath File path in storage
   * @returns File information with download URL
   */
  async getStorageFileInfo(filePath: string): Promise<StorageFileInfo> {
    const response = await this.client.callTool({
      name: 'storage_get_file_info',
      arguments: {
        filePath,
      },
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Uploads a file to Firebase Storage
   * @param filePath Destination path in storage
   * @param content File content (local path, data URL, or plain text)
   * @param contentType Optional MIME type
   * @param metadata Optional additional metadata
   * @returns Upload result with file details
   */
  async uploadFile(
    filePath: string,
    content: string,
    contentType?: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    const response = await this.client.callTool({
      name: 'storage_upload',
      arguments: {
        filePath,
        content,
        contentType,
        metadata,
      },
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Uploads a file to Firebase Storage from a URL
   * @param filePath Destination path in storage
   * @param url Source URL to download from
   * @param contentType Optional MIME type
   * @param metadata Optional additional metadata
   * @returns Upload result with file details
   */
  async uploadFileFromUrl(
    filePath: string,
    url: string,
    contentType?: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    const response = await this.client.callTool({
      name: 'storage_upload_from_url',
      arguments: {
        filePath,
        url,
        contentType,
        metadata,
      },
    });
    return JSON.parse(response.content[0].text);
  }

  /**
   * Creates a server timestamp for Firestore
   * @returns Server timestamp object
   */
  static serverTimestamp(): { __serverTimestamp: true } {
    return { __serverTimestamp: true };
  }

  /**
   * Creates a Firestore filter condition
   * @param field Field name
   * @param operator Comparison operator
   * @param value Value to compare against
   * @returns Filter condition
   */
  static filter(field: string, operator: FirestoreFilter['operator'], value: any): FirestoreFilter {
    return { field, operator, value };
  }

  /**
   * Creates a Firestore ordering condition
   * @param field Field name
   * @param direction Sort direction
   * @returns Ordering condition
   */
  static orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): FirestoreOrderBy {
    return { field, direction };
  }
}

/**
 * Utility function to create a Firebase MCP client with default configuration
 * @param config Optional configuration overrides
 * @returns Configured client instance
 */
export function createFirebaseMcpClient(config?: Partial<FirebaseMcpClientConfig>): FirebaseMcpClient {
  const defaultConfig: FirebaseMcpClientConfig = {
    transport: 'stdio',
    http: {
      port: 3000,
      host: 'localhost',
      path: '/mcp',
    },
  };

  return new FirebaseMcpClient({ ...defaultConfig, ...config });
}

// Export types for external use
export type {
  FirebaseMcpClientConfig,
  FirestoreFilter,
  FirestoreOrderBy,
  FirestoreDocument,
  FirestoreListResponse,
  FirestoreCollectionsResponse,
  StorageFileInfo,
  StorageListResponse,
  AuthUser,
};
