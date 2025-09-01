/**
 * Firebase MCP Client Tests
 *
 * Tests for the Firebase MCP client functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirebaseMcpClient, createFirebaseMcpClient } from '../firebase-mcp-client.js';

// Mock the MCP SDK client
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    callTool: vi.fn().mockImplementation((request) => {
      // Mock different tool responses based on the tool name
      const mockResponses: Record<string, any> = {
        'tools/list': {
          content: [{ type: 'text', text: JSON.stringify({ tools: ['firestore_add_document', 'auth_get_user'] }) }],
        },
        'firestore_add_document': {
          content: [{ type: 'text', text: JSON.stringify({ id: 'test-id', path: 'users/test-id' }) }],
        },
        'firestore_get_document': {
          content: [{ type: 'text', text: JSON.stringify({ id: 'test-id', path: 'users/test-id', data: { name: 'Test User' } }) }],
        },
        'firestore_list_documents': {
          content: [{ type: 'text', text: JSON.stringify({ documents: [{ id: 'test-id', path: 'users/test-id', data: { name: 'Test User' } }] }) }],
        },
        'firestore_update_document': {
          content: [{ type: 'text', text: JSON.stringify({ id: 'test-id', path: 'users/test-id', updated: true }) }],
        },
        'firestore_delete_document': {
          content: [{ type: 'text', text: JSON.stringify({ id: 'test-id', path: 'users/test-id', deleted: true }) }],
        },
        'firestore_list_collections': {
          content: [{ type: 'text', text: JSON.stringify({ collections: [{ id: 'users', path: 'users', url: 'https://console.firebase.google.com/project/test/firestore/data/users' }] }) }],
        },
        'firestore_query_collection_group': {
          content: [{ type: 'text', text: JSON.stringify({ documents: [{ id: 'test-id', path: 'users/test-id/posts/post-id', data: { title: 'Test Post' } }] }) }],
        },
        'auth_get_user': {
          content: [{ type: 'text', text: JSON.stringify({ user: { uid: 'test-uid', email: 'test@example.com' } }) }],
        },
        'storage_list_files': {
          content: [{ type: 'text', text: JSON.stringify({ files: [{ name: 'test.txt', size: '100', contentType: 'text/plain' }] }) }],
        },
        'storage_get_file_info': {
          content: [{ type: 'text', text: JSON.stringify({ name: 'test.txt', bucket: 'test-bucket', size: '100', downloadUrl: 'https://example.com/test.txt' }) }],
        },
        'storage_upload': {
          content: [{ type: 'text', text: JSON.stringify({ name: 'test.txt', size: '100', bucket: 'test-bucket' }) }],
        },
        'storage_upload_from_url': {
          content: [{ type: 'text', text: JSON.stringify({ name: 'test.txt', size: '100', bucket: 'test-bucket', sourceUrl: 'https://example.com/source.txt' }) }],
        },
      };

      return Promise.resolve(mockResponses[request.name] || {
        content: [{ type: 'text', text: JSON.stringify({ error: 'Unknown tool' }) }],
      });
    }),
  })),
}));

describe('FirebaseMcpClient', () => {
  let client: FirebaseMcpClient;

  beforeEach(() => {
    client = new FirebaseMcpClient({
      transport: 'stdio',
    });
  });

  afterEach(async () => {
    await client.disconnect();
  });

  describe('constructor', () => {
    it('should create a client with default configuration', () => {
      expect(client).toBeInstanceOf(FirebaseMcpClient);
    });

    it('should create a client with custom configuration', () => {
      const customClient = new FirebaseMcpClient({
        transport: 'http',
        http: {
          port: 3000,
          host: 'localhost',
          path: '/mcp',
        },
      });
      expect(customClient).toBeInstanceOf(FirebaseMcpClient);
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      await expect(client.connect()).resolves.toBeUndefined();
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await client.connect();
      await expect(client.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('listTools', () => {
    it('should list available tools', async () => {
      await client.connect();
      const result = await client.listTools();
      expect(result).toEqual({ tools: ['firestore_add_document', 'auth_get_user'] });
    });
  });

  describe('Firestore operations', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should add a document', async () => {
      const result = await client.addDocument('users', { name: 'Test User' });
      expect(result).toEqual({ id: 'test-id', path: 'users/test-id' });
    });

    it('should get a document', async () => {
      const result = await client.getDocument('users', 'test-id');
      expect(result).toEqual({
        id: 'test-id',
        path: 'users/test-id',
        data: { name: 'Test User' },
      });
    });

    it('should list documents', async () => {
      const result = await client.listDocuments('users');
      expect(result).toEqual({
        documents: [{ id: 'test-id', path: 'users/test-id', data: { name: 'Test User' } }],
      });
    });

    it('should update a document', async () => {
      const result = await client.updateDocument('users', 'test-id', { age: 30 });
      expect(result).toEqual({ id: 'test-id', path: 'users/test-id', updated: true });
    });

    it('should delete a document', async () => {
      const result = await client.deleteDocument('users', 'test-id');
      expect(result).toEqual({ id: 'test-id', path: 'users/test-id', deleted: true });
    });

    it('should list collections', async () => {
      const result = await client.listCollections();
      expect(result).toEqual({
        collections: [{ id: 'users', path: 'users', url: 'https://console.firebase.google.com/project/test/firestore/data/users' }],
      });
    });

    it('should query collection group', async () => {
      const result = await client.queryCollectionGroup('posts');
      expect(result).toEqual({
        documents: [{ id: 'test-id', path: 'users/test-id/posts/post-id', data: { title: 'Test Post' } }],
      });
    });
  });

  describe('Authentication operations', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should get user by identifier', async () => {
      const result = await client.getUser('test@example.com');
      expect(result).toEqual({ user: { uid: 'test-uid', email: 'test@example.com' } });
    });
  });

  describe('Storage operations', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should list storage files', async () => {
      const result = await client.listStorageFiles();
      expect(result).toEqual({
        files: [{ name: 'test.txt', size: '100', contentType: 'text/plain' }],
      });
    });

    it('should get file info', async () => {
      const result = await client.getStorageFileInfo('test.txt');
      expect(result).toEqual({
        name: 'test.txt',
        bucket: 'test-bucket',
        size: '100',
        downloadUrl: 'https://example.com/test.txt',
      });
    });

    it('should upload file', async () => {
      const result = await client.uploadFile('test.txt', 'file content', 'text/plain');
      expect(result).toEqual({
        name: 'test.txt',
        size: '100',
        bucket: 'test-bucket',
      });
    });

    it('should upload file from URL', async () => {
      const result = await client.uploadFileFromUrl('test.txt', 'https://example.com/source.txt', 'text/plain');
      expect(result).toEqual({
        name: 'test.txt',
        size: '100',
        bucket: 'test-bucket',
        sourceUrl: 'https://example.com/source.txt',
      });
    });
  });

  describe('Static methods', () => {
    it('should create server timestamp', () => {
      const timestamp = FirebaseMcpClient.serverTimestamp();
      expect(timestamp).toEqual({ __serverTimestamp: true });
    });

    it('should create filter', () => {
      const filter = FirebaseMcpClient.filter('name', '==', 'Test');
      expect(filter).toEqual({ field: 'name', operator: '==', value: 'Test' });
    });

    it('should create orderBy', () => {
      const orderBy = FirebaseMcpClient.orderBy('name', 'asc');
      expect(orderBy).toEqual({ field: 'name', direction: 'asc' });
    });

    it('should create orderBy with default direction', () => {
      const orderBy = FirebaseMcpClient.orderBy('name');
      expect(orderBy).toEqual({ field: 'name', direction: 'asc' });
    });
  });
});

describe('createFirebaseMcpClient', () => {
  it('should create a client with default configuration', () => {
    const client = createFirebaseMcpClient();
    expect(client).toBeInstanceOf(FirebaseMcpClient);
  });

  it('should create a client with custom configuration', () => {
    const client = createFirebaseMcpClient({
      transport: 'http',
      http: {
        port: 3000,
        host: 'localhost',
        path: '/mcp',
      },
    });
    expect(client).toBeInstanceOf(FirebaseMcpClient);
  });
});
