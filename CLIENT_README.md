# Firebase MCP Client

A comprehensive client library for interacting with Firebase services through the Model Context Protocol (MCP). This client provides a clean, type-safe interface for all Firebase operations including Firestore, Authentication, and Storage.

## Features

- 🔥 **Full Firebase Support**: Firestore, Authentication, and Storage operations
- 🚀 **TypeScript Support**: Complete type definitions for all operations
- 🔌 **Multiple Transports**: Support for both stdio and HTTP transports
- 🛠️ **CLI Tool**: Command-line interface for easy interaction
- 📚 **Comprehensive Examples**: Detailed examples for all operations
- 🎯 **Error Handling**: Robust error handling and validation

## Installation

```bash
npm install @gannonh/firebase-mcp
```

## Prerequisites

1. **Firebase MCP Server**: The Firebase MCP server must be running
2. **Firebase Project**: A configured Firebase project with service account
3. **Environment Variables**:
   - `SERVICE_ACCOUNT_KEY_PATH`: Path to Firebase service account key
   - `FIREBASE_STORAGE_BUCKET`: Firebase Storage bucket name (optional)

## Quick Start

### 1. Start the Firebase MCP Server

```bash
# Install and start the server
npm install @gannonh/firebase-mcp
npm run start

# Or with HTTP transport
npm run start:http
```

### 2. Use the Client

```typescript
import { createFirebaseMcpClient } from '@gannonh/firebase-mcp';

async function main() {
  // Create client
  const client = createFirebaseMcpClient({
    transport: 'stdio', // or 'http'
  });

  // Connect to server
  await client.connect();

  // Add a document to Firestore
  const result = await client.addDocument('users', {
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: FirebaseMcpClient.serverTimestamp(),
  });

  console.log('Document added:', result);

  // Disconnect
  await client.disconnect();
}

main().catch(console.error);
```

## API Reference

### Client Configuration

```typescript
interface FirebaseMcpClientConfig {
  transport: 'stdio' | 'http';
  http?: {
    port: number;
    host: string;
    path: string;
  };
}
```

### Firestore Operations

#### Add Document

```typescript
const result = await client.addDocument('users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  isActive: true,
  createdAt: FirebaseMcpClient.serverTimestamp(),
});

// Returns: { id: string; path: string }
```

#### Get Document

```typescript
const result = await client.getDocument('users', 'document-id');

// Returns: { id: string; path: string; data: Record<string, any> }
```

#### List Documents

```typescript
const result = await client.listDocuments('users', {
  filters: [
    FirebaseMcpClient.filter('isActive', '==', true),
    FirebaseMcpClient.filter('age', '>=', 18),
  ],
  orderBy: [FirebaseMcpClient.orderBy('name', 'asc')],
  limit: 10,
  pageToken: 'next-page-token',
});

// Returns: { documents: Array<{id, path, data}>; nextPageToken?: string }
```

#### Update Document

```typescript
const result = await client.updateDocument('users', 'document-id', {
  age: 31,
  lastUpdated: FirebaseMcpClient.serverTimestamp(),
});

// Returns: { id: string; path: string; updated: boolean }
```

#### Delete Document

```typescript
const result = await client.deleteDocument('users', 'document-id');

// Returns: { id: string; path: string; deleted: boolean }
```

#### List Collections

```typescript
const result = await client.listCollections();

// Returns: { collections: Array<{id, path, url}>; path: string; projectId: string }
```

#### Query Collection Group

```typescript
const result = await client.queryCollectionGroup('posts', {
  filters: [
    FirebaseMcpClient.filter('tags', 'array-contains', 'tech'),
  ],
  orderBy: [FirebaseMcpClient.orderBy('title', 'asc')],
  limit: 5,
});

// Returns: { documents: Array<{id, path, data}>; nextPageToken?: string }
```

### Authentication Operations

#### Get User

```typescript
const result = await client.getUser('user-id-or-email');

// Returns: { user: AuthUser }
```

### Storage Operations

#### List Files

```typescript
const result = await client.listStorageFiles('optional/directory/path');

// Returns: { files: Array<{name, size, contentType, updated, md5Hash}> }
```

#### Get File Info

```typescript
const result = await client.getStorageFileInfo('path/to/file.txt');

// Returns: { name, bucket, size, contentType, updated, md5Hash, downloadUrl }
```

#### Upload File

```typescript
const result = await client.uploadFile(
  'path/to/file.txt',
  'file content or local file path',
  'text/plain',
  { description: 'Optional metadata' }
);

// Returns: Upload result with file details
```

#### Upload File from URL

```typescript
const result = await client.uploadFileFromUrl(
  'path/to/image.png',
  'https://example.com/image.png',
  'image/png',
  { source: 'External URL' }
);

// Returns: Upload result with file details
```

## CLI Tool

The Firebase MCP client includes a command-line interface for easy interaction:

### Installation

```bash
npm install -g @gannonh/firebase-mcp
```

### Usage

```bash
# List available tools
firebase-mcp-cli tools

# Firestore operations
firebase-mcp-cli firestore add users '{"name":"John","email":"john@example.com"}'
firebase-mcp-cli firestore get users document-id
firebase-mcp-cli firestore list users --limit 10
firebase-mcp-cli firestore update users document-id '{"age":31}'
firebase-mcp-cli firestore delete users document-id
firebase-mcp-cli firestore collections

# Authentication
firebase-mcp-cli auth get-user user-id-or-email

# Storage
firebase-mcp-cli storage list
firebase-mcp-cli storage info path/to/file.txt
firebase-mcp-cli storage upload path/to/file.txt "file content"
firebase-mcp-cli storage upload-url path/to/file.txt https://example.com/file.txt

# Interactive mode
firebase-mcp-cli interactive
```

### CLI Options

```bash
# Transport options
firebase-mcp-cli --transport http --port 3000 --host localhost --path /mcp

# Verbose output
firebase-mcp-cli --verbose

# Help
firebase-mcp-cli --help
```

## Examples

### Complete Example

```typescript
import { createFirebaseMcpClient, FirebaseMcpClient } from '@gannonh/firebase-mcp';

async function completeExample() {
  const client = createFirebaseMcpClient({
    transport: 'stdio',
  });

  try {
    await client.connect();

    // 1. Add a user document
    const userResult = await client.addDocument('users', {
      name: 'Jane Doe',
      email: 'jane@example.com',
      age: 25,
      isActive: true,
      createdAt: FirebaseMcpClient.serverTimestamp(),
      tags: ['developer', 'designer'],
    });

    console.log('User added:', userResult);

    // 2. Query users with filters
    const users = await client.listDocuments('users', {
      filters: [
        FirebaseMcpClient.filter('isActive', '==', true),
        FirebaseMcpClient.filter('age', '>=', 18),
      ],
      orderBy: [FirebaseMcpClient.orderBy('name', 'asc')],
      limit: 10,
    });

    console.log('Active users:', users);

    // 3. Upload a file
    const uploadResult = await client.uploadFile(
      'documents/readme.txt',
      'This is a test file uploaded via MCP client',
      'text/plain',
      { description: 'Test file' }
    );

    console.log('File uploaded:', uploadResult);

    // 4. Get file information
    const fileInfo = await client.getStorageFileInfo('documents/readme.txt');
    console.log('File info:', fileInfo);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

completeExample();
```

### Error Handling

```typescript
async function errorHandlingExample() {
  const client = createFirebaseMcpClient();

  try {
    await client.connect();

    // Try to get a non-existent document
    try {
      await client.getDocument('users', 'non-existent-id');
    } catch (error) {
      console.log('Expected error for non-existent document:', error);
    }

    // Try to delete a non-existent document
    try {
      await client.deleteDocument('users', 'non-existent-id');
    } catch (error) {
      console.log('Expected error for non-existent document:', error);
    }

  } catch (error) {
    console.error('Client error:', error);
  } finally {
    await client.disconnect();
  }
}
```

### HTTP Transport

```typescript
async function httpTransportExample() {
  const client = createFirebaseMcpClient({
    transport: 'http',
    http: {
      port: 3000,
      host: 'localhost',
      path: '/mcp',
    },
  });

  try {
    await client.connect();
    
    // Use the client normally
    const collections = await client.listCollections();
    console.log('Collections:', collections);

  } catch (error) {
    console.error('HTTP transport error:', error);
  } finally {
    await client.disconnect();
  }
}
```

## Advanced Usage

### Custom Filters and Ordering

```typescript
// Create complex queries
const result = await client.listDocuments('users', {
  filters: [
    FirebaseMcpClient.filter('status', '==', 'active'),
    FirebaseMcpClient.filter('age', '>=', 18),
    FirebaseMcpClient.filter('tags', 'array-contains', 'developer'),
  ],
  orderBy: [
    FirebaseMcpClient.orderBy('lastName', 'asc'),
    FirebaseMcpClient.orderBy('createdAt', 'desc'),
  ],
  limit: 50,
});
```

### Server Timestamps

```typescript
// Use server timestamps for consistent timing
const document = {
  name: 'John Doe',
  createdAt: FirebaseMcpClient.serverTimestamp(),
  updatedAt: FirebaseMcpClient.serverTimestamp(),
};
```

### Collection Group Queries

```typescript
// Query across all subcollections with the same name
const posts = await client.queryCollectionGroup('posts', {
  filters: [
    FirebaseMcpClient.filter('published', '==', true),
    FirebaseMcpClient.filter('tags', 'array-contains', 'tech'),
  ],
  orderBy: [FirebaseMcpClient.orderBy('createdAt', 'desc')],
  limit: 20,
});
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure the Firebase MCP server is running
   - Check transport configuration (stdio vs HTTP)
   - Verify environment variables are set

2. **Authentication Errors**
   - Verify `SERVICE_ACCOUNT_KEY_PATH` is correct
   - Ensure the service account has proper permissions
   - Check Firebase project configuration

3. **Firestore Errors**
   - Verify collection/document paths
   - Check Firestore security rules
   - Ensure proper data types for queries

4. **Storage Errors**
   - Verify `FIREBASE_STORAGE_BUCKET` is set
   - Check Storage security rules
   - Ensure file paths are valid

### Debug Mode

Enable verbose logging:

```typescript
const client = createFirebaseMcpClient({
  transport: 'stdio',
  // Add debug options as needed
});
```

Or use the CLI with verbose flag:

```bash
firebase-mcp-cli --verbose firestore list users
```

## Contributing

Contributions are welcome! Please see the main project repository for contribution guidelines.

## License

MIT License - see the main project repository for details.

## Support

For issues and questions:
- GitHub Issues: [firebase-mcp repository](https://github.com/gannonh/firebase-mcp)
- Documentation: [Firebase MCP Documentation](https://github.com/gannonh/firebase-mcp#readme)
