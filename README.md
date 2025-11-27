# Todo MCP Server

A Model Context Protocol (MCP) server that provides an autonomous task management system with support for both **stdio** and **HTTP (Streamable)** transports.

## Features
- **Random String Generation**: Generates random 6-character alphanumeric strings
- **Task Management**: AI Agent can autonomously create, manage, and execute task lists with SQLite persistence
- **Multiple Transport Modes**: 
  - **Stdio Transport**: Standard MCP communication via stdin/stdout
  - **HTTP Transport**: RESTful API with Server-Sent Events (SSE) support for real-time notifications
- **MCP Standard Compliance**: Fully compliant with MCP specifications
   
## Usage

### Stdio Transport (Default)

#### Claude Desktop
```json
//use directly with npx
{
  "mcpServers": {
    "todo":{
      "command": "npx",
      "args": ["github:stilllovee/todo-mcp-server"]
    }
  }
}

//or use after clone repo
{
  "mcpServers": {
    "todo":{
      "command": "node",
      "args": ["PATH_TO_YOUR_FOLDER"]
    }
  }
}
```

#### Github Copilot
```json
//use directly with npx
{
    "servers": {
        "todo": {
            "type": "stdio",
            "command": "npx",
            "args": ["github:stilllovee/todo-mcp-server"]
        },
    },
    "inputs": []
}

//or use after clone repo
{
    "servers": {
        "todo": {
            "type": "stdio",
            "command": "node",
            "args": ["PATH_TO_YOUR_FOLDER"]
        }
    },
    "inputs": []
}
```

The server runs on stdio transport and communicates via standard input/output.

### HTTP Transport (Streamable)

Start the HTTP server:

```bash
# Default port (8123)
npm run start:http

# Custom port
node http-server.js --port=3000
```

The server will be available at: `http://localhost:8123/mcp`

#### Github Copilot Configuration (HTTP)

```json
{
    "servers": {
        "todo-http": {
            "type": "http",
            "url": "http://localhost:8123/mcp"
        }
    },
    "inputs": []
}
```

### Available Tools

#### Task Management Tools

##### `add`

Add a new task to the current session's list.


##### `next`

Get the next task from the session.


## Task Management System

The server includes an autonomous task management system that allows AI Agents to:

1. **Create Task Lists**: Generate comprehensive task lists from high-level requests
2. **Manage Tasks**: Add, and move to next tasks in a session
3. **Session Isolation**: Each session maintains its own separate task list
4. **Persistent Storage**: All tasks are stored in SQLite database for persistence
