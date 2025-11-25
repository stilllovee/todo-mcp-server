# Todo MCP Server

A Model Context Protocol (MCP) server that provides an autonomous task management system

## Features
- **Random String Generation**: Generates random 6-character alphanumeric strings
- **Task Management**: AI Agent can autonomously create, manage, and execute task lists with SQLite persistence
- **MCP Standard Compliance**: Uses stdio transport as per MCP specifications

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Running the Server

```bash
npm start
```

The server runs on stdio transport and communicates via standard input/output.

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