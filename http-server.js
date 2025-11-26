#!/usr/bin/env node

const express = require('express');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { MCPServer } = require('./src/server');

// Default port
let PORT = 8123;

// Parse command-line arguments for --port=XXXX
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg.startsWith('--port=')) {
    const value = parseInt(arg.split('=')[1], 10);
    if (!isNaN(value)) {
      PORT = value;
    } else {
      console.error('[HTTP Server] Invalid value for --port');
      process.exit(1);
    }
  }
}

// Create MCP server with custom Server instance
const serverInstance = new Server(
  {
    name: 'todo-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      logging: {},
    },
  }
);

const mcpServer = new MCPServer(serverInstance);

// Create Express app
const app = express();
app.use(express.json());

const router = express.Router();

// Single endpoint for the client to send messages to
const MCP_ENDPOINT = '/mcp';

router.post(MCP_ENDPOINT, async (req, res) => {
  await mcpServer.handlePostRequest(req, res);
});

router.get(MCP_ENDPOINT, async (req, res) => {
  await mcpServer.handleGetRequest(req, res);
});

app.use('/', router);

app.listen(PORT, () => {
  console.log(`[HTTP Server] MCP Streamable HTTP Server listening on port ${PORT}`);
  console.log(`[HTTP Server] Endpoint: http://localhost:${PORT}${MCP_ENDPOINT}`);
});

process.on('SIGINT', async () => {
  console.log('[HTTP Server] Shutting down server...');
  await mcpServer.cleanup();
  process.exit(0);
});
