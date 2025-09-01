#!/usr/bin/env node

/**
 * Firebase MCP CLI Tool
 *
 * A command-line interface for the Firebase MCP client.
 * Provides easy access to Firebase services through simple commands.
 *
 * @module firebase-mcp-cli
 */

import { Command } from 'commander';
import { FirebaseMcpClient, createFirebaseMcpClient } from './firebase-mcp-client.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const program = new Command();

program
  .name('firebase-mcp-cli')
  .description('CLI tool for interacting with Firebase services via MCP')
  .version('1.0.0');

// Global options
program
  .option('-t, --transport <type>', 'Transport type (stdio|http)', 'stdio')
  .option('-p, --port <number>', 'HTTP port', '3000')
  .option('-h, --host <host>', 'HTTP host', 'localhost')
  .option('--path <path>', 'HTTP path', '/mcp')
  .option('-v, --verbose', 'Enable verbose logging');

/**
 * Creates and connects a Firebase MCP client
 */
async function createClient(options: any): Promise<FirebaseMcpClient> {
  const config = {
    transport: options.transport as 'stdio' | 'http',
    http: {
      port: parseInt(options.port),
      host: options.host,
      path: options.path,
    },
  };

  const client = createFirebaseMcpClient(config);
  await client.connect();
  return client;
}

/**
 * Formats output based on options
 */
function formatOutput(data: any, options: any): string {
  if (options.verbose) {
    return JSON.stringify(data, null, 2);
  }
  return JSON.stringify(data);
}

// Firestore Commands
const firestore = program.command('firestore').description('Firestore operations');

firestore
  .command('add <collection> <data>')
  .description('Add a document to a collection')
  .action(async (collection: string, data: string, options: any) => {
    try {
      const client = await createClient(options);
      const documentData = JSON.parse(data);
      const result = await client.addDocument(collection, documentData);
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

firestore
  .command('get <collection> <id>')
  .description('Get a document by ID')
  .action(async (collection: string, id: string, options: any) => {
    try {
      const client = await createClient(options);
      const result = await client.getDocument(collection, id);
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

firestore
  .command('list <collection>')
  .description('List documents in a collection')
  .option('-f, --filters <filters>', 'JSON string of filters')
  .option('-l, --limit <number>', 'Limit number of results', '20')
  .option('-o, --orderBy <orderBy>', 'JSON string of ordering')
  .option('-p, --pageToken <token>', 'Pagination token')
  .action(async (collection: string, options: any) => {
    try {
      const client = await createClient(options);
      const queryOptions: any = {
        limit: parseInt(options.limit),
      };

      if (options.filters) {
        queryOptions.filters = JSON.parse(options.filters);
      }

      if (options.orderBy) {
        queryOptions.orderBy = JSON.parse(options.orderBy);
      }

      if (options.pageToken) {
        queryOptions.pageToken = options.pageToken;
      }

      const result = await client.listDocuments(collection, queryOptions);
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

firestore
  .command('update <collection> <id> <data>')
  .description('Update a document')
  .action(async (collection: string, id: string, data: string, options: any) => {
    try {
      const client = await createClient(options);
      const documentData = JSON.parse(data);
      const result = await client.updateDocument(collection, id, documentData);
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

firestore
  .command('delete <collection> <id>')
  .description('Delete a document')
  .action(async (collection: string, id: string, options: any) => {
    try {
      const client = await createClient(options);
      const result = await client.deleteDocument(collection, id);
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

firestore
  .command('collections')
  .description('List root collections')
  .action(async (options: any) => {
    try {
      const client = await createClient(options);
      const result = await client.listCollections();
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

firestore
  .command('query-group <collectionId>')
  .description('Query collection group')
  .option('-f, --filters <filters>', 'JSON string of filters')
  .option('-l, --limit <number>', 'Limit number of results', '20')
  .option('-o, --orderBy <orderBy>', 'JSON string of ordering')
  .option('-p, --pageToken <token>', 'Pagination token')
  .action(async (collectionId: string, options: any) => {
    try {
      const client = await createClient(options);
      const queryOptions: any = {
        limit: parseInt(options.limit),
      };

      if (options.filters) {
        queryOptions.filters = JSON.parse(options.filters);
      }

      if (options.orderBy) {
        queryOptions.orderBy = JSON.parse(options.orderBy);
      }

      if (options.pageToken) {
        queryOptions.pageToken = options.pageToken;
      }

      const result = await client.queryCollectionGroup(collectionId, queryOptions);
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

// Authentication Commands
const auth = program.command('auth').description('Authentication operations');

auth
  .command('get-user <identifier>')
  .description('Get user by ID or email')
  .action(async (identifier: string, options: any) => {
    try {
      const client = await createClient(options);
      const result = await client.getUser(identifier);
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

// Storage Commands
const storage = program.command('storage').description('Storage operations');

storage
  .command('list')
  .description('List files in storage')
  .option('-d, --directory <path>', 'Directory path to list')
  .action(async (options: any) => {
    try {
      const client = await createClient(options);
      const result = await client.listStorageFiles(options.directory);
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

storage
  .command('info <filePath>')
  .description('Get file information')
  .action(async (filePath: string, options: any) => {
    try {
      const client = await createClient(options);
      const result = await client.getStorageFileInfo(filePath);
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

storage
  .command('upload <filePath> <content>')
  .description('Upload a file')
  .option('-t, --contentType <type>', 'Content type')
  .option('-m, --metadata <metadata>', 'JSON string of metadata')
  .action(async (filePath: string, content: string, options: any) => {
    try {
      const client = await createClient(options);
      const metadata = options.metadata ? JSON.parse(options.metadata) : undefined;
      const result = await client.uploadFile(filePath, content, options.contentType, metadata);
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

storage
  .command('upload-url <filePath> <url>')
  .description('Upload a file from URL')
  .option('-t, --contentType <type>', 'Content type')
  .option('-m, --metadata <metadata>', 'JSON string of metadata')
  .action(async (filePath: string, url: string, options: any) => {
    try {
      const client = await createClient(options);
      const metadata = options.metadata ? JSON.parse(options.metadata) : undefined;
      const result = await client.uploadFileFromUrl(filePath, url, options.contentType, metadata);
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

// Utility Commands
program
  .command('tools')
  .description('List available tools')
  .action(async (options: any) => {
    try {
      const client = await createClient(options);
      const result = await client.listTools();
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

// File upload helper
program
  .command('upload-file <filePath> <localPath>')
  .description('Upload a local file to storage')
  .option('-t, --contentType <type>', 'Content type')
  .option('-m, --metadata <metadata>', 'JSON string of metadata')
  .action(async (filePath: string, localPath: string, options: any) => {
    try {
      const client = await createClient(options);
      const content = readFileSync(localPath, 'utf8');
      const metadata = options.metadata ? JSON.parse(options.metadata) : undefined;
      const result = await client.uploadFile(filePath, content, options.contentType, metadata);
      console.log(formatOutput(result, options));
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

// Interactive mode
program
  .command('interactive')
  .description('Start interactive mode')
  .action(async (options: any) => {
    try {
      const client = await createClient(options);
      console.log('🔥 Firebase MCP Interactive Mode');
      console.log('Type "help" for available commands, "exit" to quit\n');

      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const askQuestion = (question: string): Promise<string> => {
        return new Promise((resolve) => {
          rl.question(question, resolve);
        });
      };

      while (true) {
        try {
          const input = await askQuestion('firebase-mcp> ');
          const trimmedInput = input.trim();

          if (trimmedInput === 'exit' || trimmedInput === 'quit') {
            break;
          }

          if (trimmedInput === 'help') {
            console.log(`
Available commands:
- firestore add <collection> <json-data>
- firestore get <collection> <id>
- firestore list <collection>
- firestore update <collection> <id> <json-data>
- firestore delete <collection> <id>
- firestore collections
- firestore query-group <collectionId>
- auth get-user <identifier>
- storage list
- storage info <filePath>
- storage upload <filePath> <content>
- storage upload-url <filePath> <url>
- tools
- exit
            `);
            continue;
          }

          // Parse and execute command
          const parts = trimmedInput.split(' ');
          const command = parts[0];
          const args = parts.slice(1);

          switch (command) {
            case 'firestore':
              if (args[0] === 'add' && args.length >= 3) {
                const result = await client.addDocument(args[1], JSON.parse(args[2]));
                console.log(formatOutput(result, options));
              } else if (args[0] === 'get' && args.length >= 3) {
                const result = await client.getDocument(args[1], args[2]);
                console.log(formatOutput(result, options));
              } else if (args[0] === 'list' && args.length >= 2) {
                const result = await client.listDocuments(args[1]);
                console.log(formatOutput(result, options));
              } else if (args[0] === 'collections') {
                const result = await client.listCollections();
                console.log(formatOutput(result, options));
              } else {
                console.log('Invalid firestore command. Type "help" for usage.');
              }
              break;

            case 'auth':
              if (args[0] === 'get-user' && args.length >= 2) {
                const result = await client.getUser(args[1]);
                console.log(formatOutput(result, options));
              } else {
                console.log('Invalid auth command. Type "help" for usage.');
              }
              break;

            case 'storage':
              if (args[0] === 'list') {
                const result = await client.listStorageFiles();
                console.log(formatOutput(result, options));
              } else if (args[0] === 'info' && args.length >= 2) {
                const result = await client.getStorageFileInfo(args[1]);
                console.log(formatOutput(result, options));
              } else {
                console.log('Invalid storage command. Type "help" for usage.');
              }
              break;

            case 'tools':
              const result = await client.listTools();
              console.log(formatOutput(result, options));
              break;

            default:
              console.log('Unknown command. Type "help" for available commands.');
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }

      rl.close();
      await client.disconnect();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
