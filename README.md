# Todo MCP Server

A Model Context Protocol (MCP) server that provides an autonomous task management system with support for both **stdio** and **HTTP (Streamable)** transports.

## Features
- **Random String Generation**: Generates random 6-character alphanumeric strings
- **Task Management**: AI Agent can autonomously create, manage, and execute task lists with SQLite persistence
- **Multiple Transport Modes**: 
  - **Stdio Transport**: Standard MCP communication via stdin/stdout
  - **HTTP Transport**: RESTful API with Server-Sent Events (SSE) support for real-time notifications
- **MCP Standard Compliance**: Fully compliant with MCP specifications

## Installation

### Local Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Docker Deployment

#### Quick Start with Docker Compose (Recommended)

```bash
# Start the server
docker-compose up -d

# Stop the server
docker-compose down
```

#### Manual Docker Commands

```bash
# Build the Docker image
docker build -t todo-mcp-server .

# Run the container
docker run -d \
  --name todo-mcp-server \
  -p 8123:8123 \
  -v todo-mcp-data:/app/data \
  --restart unless-stopped \
  todo-mcp-server

# Stop the container
docker stop todo-mcp-server && docker rm todo-mcp-server
```

#### PowerShell Script (Windows)

Use the included PowerShell script for easy management:

```powershell
# Build the image
./docker.ps1 build

# Run the container
./docker.ps1 run

# Start with docker-compose
./docker.ps1 compose-up

# View logs
./docker.ps1 logs

# Stop the container
./docker.ps1 stop

# Clean up all resources
./docker.ps1 clean
```

The Docker container:
- Runs on port 8123 by default
- Persists data in a Docker volume
- Includes health checks
- Runs as a non-root user for security
- Automatically restarts unless manually stopped

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

#### HTTP Endpoints

- **POST /mcp**: Send MCP requests (initialize, tool calls, etc.)
- **GET /mcp**: Establish SSE stream for real-time notifications (requires valid session ID)

#### Session Management

The HTTP transport supports stateful sessions:
1. Client sends an `initialize` request without session ID
2. Server creates a new session and returns session ID in response headers
3. Client includes `mcp-session-id` header in subsequent requests
4. Server maintains separate task lists per session

#### Example Usage with curl

```bash
# Initialize session
curl -X POST http://localhost:8123/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'

# Use tools with session ID (get from initialize response)
curl -X POST http://localhost:8123/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "add",
      "arguments": {
        "session_id": "test-123",
        "title": "Test Task"
      }
    }
  }'

# Establish SSE stream
curl -N -H "mcp-session-id: YOUR_SESSION_ID" \
  http://localhost:8123/mcp
```

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

**Parameters:**
- `session_id` (string, required): The session identifier for the task
- `title` (string, required): The task title
- `description` (string, optional): The task description

**Example:**
```json
{
  "session_id": "my-session-123",
  "title": "Implement user registration",
  "description": "Create registration form and validation logic"
}
```

##### `next`

Get the next task from the session. This tool implements a workflow where:
- On the first call, it returns the first pending task without marking anything as done
- On subsequent calls, it marks the previously returned task as completed, then returns the next pending task
- If no tasks remain, it returns empty

**Parameters:**
- `session_id` (string, required): The session identifier for the task

**Example:**
```json
{
  "session_id": "my-session-123"
}
```

**Response for available task:**
```json
{
  "success": true,
  "session_id": "my-session-123",
  "task": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "session_id": "my-session-123",
    "title": "Implement user registration",
    "description": "Create registration form",
    "status": "pending",
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  "message": "Next task retrieved"
}
```

**Response when no tasks remain:**
```json
{
  "success": true,
  "session_id": "my-session-123", 
  "task": null,
  "message": "No pending tasks remaining"
}
```

## Task Management System

The server includes an autonomous task management system that allows AI Agents to:

1. **Create Task Lists**: Generate comprehensive task lists from high-level requests
2. **Manage Tasks**: Add, and move to next tasks in a session
3. **Session Isolation**: Each session maintains its own separate task list
4. **Persistent Storage**: All tasks are stored in SQLite database for persistence
