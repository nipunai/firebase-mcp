/**
 * Firebase MCP Client Example
 *
 * This example demonstrates how to use the Firebase MCP client
 * to interact with Firebase services through the MCP server.
 *
 * Prerequisites:
 * 1. Firebase MCP server must be running
 * 2. Firebase project must be configured with service account
 * 3. Environment variables must be set:
 *    - SERVICE_ACCOUNT_KEY_PATH: Path to Firebase service account key
 *    - FIREBASE_STORAGE_BUCKET: Firebase Storage bucket name (optional)
 *
 * @example
 * // Start the Firebase MCP server first:
 * // npm run start
 * 
 * // Then run this example:
 * // npx ts-node examples/firebase-mcp-client-example.ts
 */

import { FirebaseMcpClient, createFirebaseMcpClient } from '../src/firebase-mcp-client.js';

/**
 * Main example function demonstrating Firebase MCP client usage
 */
async function main() {
  console.log('🚀 Firebase MCP Client Example');
  console.log('================================\n');

  // Create client with stdio transport (default)
  const client = createFirebaseMcpClient({
    transport: 'stdio',
  });

  try {
    // Connect to the MCP server
    console.log('📡 Connecting to Firebase MCP server...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // List available tools
    console.log('🔧 Available tools:');
    const tools = await client.listTools();
    console.log(JSON.stringify(tools, null, 2));
    console.log('\n');

    // Example 1: Firestore Operations
    await demonstrateFirestoreOperations(client);

    // Example 2: Authentication Operations
    await demonstrateAuthOperations(client);

    // Example 3: Storage Operations
    await demonstrateStorageOperations(client);

    // Example 4: Advanced Firestore Queries
    await demonstrateAdvancedFirestoreQueries(client);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Disconnect from the server
    console.log('\n🔌 Disconnecting...');
    await client.disconnect();
    console.log('✅ Disconnected');
  }
}

/**
 * Demonstrates basic Firestore operations
 */
async function demonstrateFirestoreOperations(client: FirebaseMcpClient) {
  console.log('📚 Firestore Operations Example');
  console.log('==============================\n');

  const collectionName = 'users';

  try {
    // 1. Add a document
    console.log('1️⃣ Adding a new user document...');
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: 30,
      isActive: true,
      createdAt: FirebaseMcpClient.serverTimestamp(),
      tags: ['developer', 'admin'],
    };

    const addResult = await client.addDocument(collectionName, userData);
    console.log('✅ Document added:', addResult);
    const documentId = addResult.id;

    // 2. Get the document
    console.log('\n2️⃣ Retrieving the document...');
    const getResult = await client.getDocument(collectionName, documentId);
    console.log('✅ Document retrieved:', JSON.stringify(getResult, null, 2));

    // 3. Update the document
    console.log('\n3️⃣ Updating the document...');
    const updateData = {
      age: 31,
      lastUpdated: FirebaseMcpClient.serverTimestamp(),
    };
    const updateResult = await client.updateDocument(collectionName, documentId, updateData);
    console.log('✅ Document updated:', updateResult);

    // 4. List documents with filtering
    console.log('\n4️⃣ Listing documents with filters...');
    const listResult = await client.listDocuments(collectionName, {
      filters: [
        FirebaseMcpClient.filter('isActive', '==', true),
        FirebaseMcpClient.filter('age', '>=', 25),
      ],
      orderBy: [FirebaseMcpClient.orderBy('name', 'asc')],
      limit: 10,
    });
    console.log('✅ Documents listed:', JSON.stringify(listResult, null, 2));

    // 5. Delete the document
    console.log('\n5️⃣ Deleting the document...');
    const deleteResult = await client.deleteDocument(collectionName, documentId);
    console.log('✅ Document deleted:', deleteResult);

  } catch (error) {
    console.error('❌ Firestore operation failed:', error);
  }

  console.log('\n');
}

/**
 * Demonstrates Authentication operations
 */
async function demonstrateAuthOperations(client: FirebaseMcpClient) {
  console.log('👤 Authentication Operations Example');
  console.log('===================================\n');

  try {
    // Note: This requires a valid user ID or email that exists in your Firebase project
    const testUserId = 'test-user-id'; // Replace with actual user ID
    const testEmail = 'test@example.com'; // Replace with actual email

    console.log('1️⃣ Getting user by ID...');
    try {
      const userById = await client.getUser(testUserId);
      console.log('✅ User by ID:', JSON.stringify(userById, null, 2));
    } catch (error) {
      console.log('ℹ️ User not found by ID (expected if user does not exist)');
    }

    console.log('\n2️⃣ Getting user by email...');
    try {
      const userByEmail = await client.getUser(testEmail);
      console.log('✅ User by email:', JSON.stringify(userByEmail, null, 2));
    } catch (error) {
      console.log('ℹ️ User not found by email (expected if user does not exist)');
    }

  } catch (error) {
    console.error('❌ Authentication operation failed:', error);
  }

  console.log('\n');
}

/**
 * Demonstrates Storage operations
 */
async function demonstrateStorageOperations(client: FirebaseMcpClient) {
  console.log('📁 Storage Operations Example');
  console.log('=============================\n');

  try {
    // 1. List files in storage
    console.log('1️⃣ Listing files in storage...');
    const filesList = await client.listStorageFiles();
    console.log('✅ Files in storage:', JSON.stringify(filesList, null, 2));

    // 2. Upload a text file
    console.log('\n2️⃣ Uploading a text file...');
    const textContent = 'Hello from Firebase MCP Client!\nThis is a test file uploaded via MCP.';
    const uploadResult = await client.uploadFile(
      'examples/test-file.txt',
      textContent,
      'text/plain',
      { description: 'Test file uploaded via MCP client' }
    );
    console.log('✅ File uploaded:', JSON.stringify(uploadResult, null, 2));

    // 3. Get file information
    console.log('\n3️⃣ Getting file information...');
    const fileInfo = await client.getStorageFileInfo('examples/test-file.txt');
    console.log('✅ File info:', JSON.stringify(fileInfo, null, 2));

    // 4. Upload file from URL (example with a public image)
    console.log('\n4️⃣ Uploading file from URL...');
    const urlUploadResult = await client.uploadFileFromUrl(
      'examples/logo.png',
      'https://raw.githubusercontent.com/firebase/firebase-js-sdk/main/packages/firebase/logo.png',
      'image/png',
      { source: 'Firebase GitHub repository' }
    );
    console.log('✅ File uploaded from URL:', JSON.stringify(urlUploadResult, null, 2));

  } catch (error) {
    console.error('❌ Storage operation failed:', error);
  }

  console.log('\n');
}

/**
 * Demonstrates advanced Firestore queries
 */
async function demonstrateAdvancedFirestoreQueries(client: FirebaseMcpClient) {
  console.log('🔍 Advanced Firestore Queries Example');
  console.log('=====================================\n');

  try {
    // 1. List collections
    console.log('1️⃣ Listing root collections...');
    const collections = await client.listCollections();
    console.log('✅ Collections:', JSON.stringify(collections, null, 2));

    // 2. Create some test data for collection group query
    console.log('\n2️⃣ Creating test data for collection group query...');
    const postsData = [
      {
        title: 'First Post',
        content: 'This is the first post',
        author: 'user1',
        tags: ['general'],
        createdAt: FirebaseMcpClient.serverTimestamp(),
      },
      {
        title: 'Second Post',
        content: 'This is the second post',
        author: 'user2',
        tags: ['tech', 'general'],
        createdAt: FirebaseMcpClient.serverTimestamp(),
      },
    ];

    // Add posts to different collections to demonstrate collection group query
    for (const postData of postsData) {
      await client.addDocument('users/user1/posts', postData);
      await client.addDocument('users/user2/posts', postData);
    }

    // 3. Query collection group
    console.log('\n3️⃣ Querying collection group...');
    const collectionGroupResult = await client.queryCollectionGroup('posts', {
      filters: [
        FirebaseMcpClient.filter('tags', 'array-contains', 'tech'),
      ],
      orderBy: [FirebaseMcpClient.orderBy('title', 'asc')],
      limit: 5,
    });
    console.log('✅ Collection group query result:', JSON.stringify(collectionGroupResult, null, 2));

    // 4. Complex query with multiple filters and ordering
    console.log('\n4️⃣ Complex query with multiple filters...');
    const complexQueryResult = await client.listDocuments('users', {
      filters: [
        FirebaseMcpClient.filter('isActive', '==', true),
        FirebaseMcpClient.filter('age', '>=', 18),
      ],
      orderBy: [
        FirebaseMcpClient.orderBy('name', 'asc'),
        FirebaseMcpClient.orderBy('createdAt', 'desc'),
      ],
      limit: 10,
    });
    console.log('✅ Complex query result:', JSON.stringify(complexQueryResult, null, 2));

  } catch (error) {
    console.error('❌ Advanced Firestore query failed:', error);
  }

  console.log('\n');
}

/**
 * Demonstrates error handling and edge cases
 */
async function demonstrateErrorHandling(client: FirebaseMcpClient) {
  console.log('⚠️ Error Handling Example');
  console.log('==========================\n');

  try {
    // 1. Try to get a non-existent document
    console.log('1️⃣ Getting non-existent document...');
    try {
      await client.getDocument('users', 'non-existent-id');
    } catch (error) {
      console.log('✅ Expected error caught:', error);
    }

    // 2. Try to delete a non-existent document
    console.log('\n2️⃣ Deleting non-existent document...');
    try {
      await client.deleteDocument('users', 'non-existent-id');
    } catch (error) {
      console.log('✅ Expected error caught:', error);
    }

    // 3. Try to get file info for non-existent file
    console.log('\n3️⃣ Getting info for non-existent file...');
    try {
      await client.getStorageFileInfo('non-existent-file.txt');
    } catch (error) {
      console.log('✅ Expected error caught:', error);
    }

  } catch (error) {
    console.error('❌ Error handling demonstration failed:', error);
  }

  console.log('\n');
}

/**
 * Demonstrates HTTP transport usage
 */
async function demonstrateHttpTransport() {
  console.log('🌐 HTTP Transport Example');
  console.log('=========================\n');

  // Create client with HTTP transport
  const httpClient = createFirebaseMcpClient({
    transport: 'http',
    http: {
      port: 3000,
      host: 'localhost',
      path: '/mcp',
    },
  });

  try {
    console.log('📡 Connecting via HTTP transport...');
    await httpClient.connect();
    console.log('✅ Connected via HTTP!');

    // Test a simple operation
    const collections = await httpClient.listCollections();
    console.log('✅ HTTP transport test successful:', collections);

  } catch (error) {
    console.error('❌ HTTP transport failed:', error);
    console.log('ℹ️ Make sure the Firebase MCP server is running with HTTP transport:');
    console.log('   npm run start:http');
  } finally {
    await httpClient.disconnect();
  }

  console.log('\n');
}

// Run the main example
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export functions for use in other modules
export {
  main,
  demonstrateFirestoreOperations,
  demonstrateAuthOperations,
  demonstrateStorageOperations,
  demonstrateAdvancedFirestoreQueries,
  demonstrateErrorHandling,
  demonstrateHttpTransport,
};
