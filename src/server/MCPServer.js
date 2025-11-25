const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

const { TaskDatabase } = require('../database/sqlite');
const { generateRandomString } = require('../tools/utils');
const { TaskManager } = require('../tools/tasks');

class MCPServer {
  constructor() {
    this.server = new Server(
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

      if (name === 'generate_random_string') {
        return await generateRandomString();
      }

      if (name === 'add') {
        return await this.taskManager.addTask(args.session_id, args.title, args.description);
      }

      if (name === 'next') {
        return await this.taskManager.nextTask(args.session_id);
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
}

module.exports = {
  MCPServer: MCPServer,
};