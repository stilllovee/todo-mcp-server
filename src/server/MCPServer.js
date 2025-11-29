const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema, InitializeRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { randomUUID } = require('crypto');

const { TaskDatabase } = require('../database/sqlite');
const { generateRandomString } = require('../tools/utils');
const { TaskManager } = require('../tools/tasks');

const SESSION_ID_HEADER_NAME = 'mcp-session-id';
const JSON_RPC = '2.0';

class MCPServer {
  constructor(server = null) {
    this.server = server || new Server(
      {
        name: 'todo-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // To support multiple simultaneous connections (for HTTP mode)
    this.transports = {};

    // Initialize database and task manager
    this.database = new TaskDatabase();
    this.taskManager = new TaskManager(this.database);

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate_random_string',
            description: 'Generate a random 6-character alphanumeric string',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'add',
            description: 'Add a new task to the current session\'s list.',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'The session identifier for the task, generated randomly string and passed by the Agent',
                },
                title: {
                  type: 'string',
                  description: 'The task title',
                },
                description: {
                  type: 'string',
                  description: 'The task description (optional)',
                },
              },
              required: ['session_id', 'title'],
            },
          },
          {
            name: 'next',
            description: 'Returns next pending task. On subsequent calls, marks previously returned task as completed and returns next pending task.',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'The session identifier for the task, generated randomly string and passed by the Agent',
                },
              },
              required: ['session_id'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'generate_random_string') {
          return await generateRandomString();
        }

        if (name === 'add') {
          return await this.taskManager.addTask(args.session_id, args.title, args.description);
        }

        if (name === 'next') {
          return await this.taskManager.nextTask(args.session_id);
        }
      } catch (error) {
        console.error(`[MCP Server] Error executing tool ${name}:`, error);
        throw new Error(`Tool execution failed: ${error.message}`);
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      if (this.database) {
        this.database.close();
      }
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP Server] MCP Server running on stdio');
  }

  // ===== HTTP Transport Methods =====

  /**
   * Handle GET requests for SSE streams (Server-Sent Events)
   */
  async handleGetRequest(req, res) {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).json(
        this.createErrorResponse('Bad Request: invalid session ID or method.')
      );
      return;
    }

    console.log(`[MCP Server] Establishing SSE stream for session ${sessionId}`);
    const transport = this.transports[sessionId];
    await transport.handleRequest(req, res);

    // Optional: Send streaming messages if needed
    // await this.streamMessages(transport);
  }

  /**
   * Handle POST requests for MCP messages
   */
  async handlePostRequest(req, res) {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME];
    let transport;

    try {
      // Reuse existing transport
      if (sessionId && this.transports[sessionId]) {
        transport = this.transports[sessionId];
        await transport.handleRequest(req, res, req.body);
        return;
      }

      // Create new transport for initialize request
      if (!sessionId && this.isInitializeRequest(req.body)) {
        // Dynamically import StreamableHTTPServerTransport
        const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
        });

        await this.server.connect(transport);
        await transport.handleRequest(req, res, req.body);

        // Session ID will only be available (if not in Stateless-Mode)
        // after handling the first request
        const newSessionId = transport.sessionId;
        if (newSessionId) {
          this.transports[newSessionId] = transport;
          console.log(`[MCP Server] New session created: ${newSessionId}`);
        }

        return;
      }

      res.status(400).json(
        this.createErrorResponse('Bad Request: invalid session ID or method.')
      );
    } catch (error) {
      console.error('[MCP Server] Error handling MCP request:', error);
      res.status(500).json(this.createErrorResponse('Internal server error.'));
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.server.close();
    if (this.database) {
      this.database.close();
    }
  }

  /**
   * Send notification through transport
   */
  async sendNotification(transport, notification) {
    const rpcNotification = {
      ...notification,
      jsonrpc: JSON_RPC,
    };
    await transport.send(rpcNotification);
  }

  /**
   * Create a JSON-RPC error response
   */
  createErrorResponse(message) {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: message,
      },
      id: randomUUID(),
    };
  }

  /**
   * Check if the request body is an initialize request
   */
  isInitializeRequest(body) {
    const isInitial = (data) => {
      const result = InitializeRequestSchema.safeParse(data);
      return result.success;
    };

    if (Array.isArray(body)) {
      return body.some((request) => isInitial(request));
    }
    return isInitial(body);
  }

  /**
   * Optional: Stream messages for SSE demo
   */
  async streamMessages(transport) {
    try {
      const message = {
        method: 'notifications/message',
        params: { level: 'info', data: 'SSE Connection established' },
      };

      await this.sendNotification(transport, message);

      let messageCount = 0;
      const interval = setInterval(async () => {
        messageCount++;
        const data = `Message ${messageCount} at ${new Date().toISOString()}`;

        const notification = {
          method: 'notifications/message',
          params: { level: 'info', data: data },
        };

        try {
          await this.sendNotification(transport, notification);

          if (messageCount >= 3) {
            clearInterval(interval);
            await this.sendNotification(transport, {
              method: 'notifications/message',
              params: { level: 'info', data: 'Streaming complete!' },
            });
          }
        } catch (error) {
          console.error('[MCP Server] Error sending message:', error);
          clearInterval(interval);
        }
      }, 1000);
    } catch (error) {
      console.error('[MCP Server] Error in streamMessages:', error);
    }
  }
}

module.exports = {
  MCPServer: MCPServer,
};