#!/usr/bin/env node

const { CurlMCPServer } = require('./src/server');

// Start the server
const server = new CurlMCPServer();
server.run().catch((error) => {
  console.error('[MCP Server] Failed to start server:', error);
  process.exit(1);
});