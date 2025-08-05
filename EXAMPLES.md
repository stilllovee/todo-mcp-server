# Example MCP Client Interactions

This document shows examples of how to interact with the Backend MCP Server, including both the original tools and the new task management system.

## Tool Definitions

The server provides the following tools:

### Original Tools

#### execute_curl
```json
{
  "name": "execute_curl",
  "description": "Execute a curl command with automatic Bearer token injection and PowerShell compatibility",
  "inputSchema": {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "description": "The curl command to execute"
      }
    },
    "required": ["command"]
  }
}
```

#### read_logs
```json
{
  "name": "read_logs",
  "description": "Read logs from a hardcoded log file with different modes (head, tail, full, middle)",
  "inputSchema": {
    "type": "object",
    "properties": {
      "mode": {
        "type": "string",
        "description": "Reading mode: \"head:<n>\" (first n lines), \"tail:<n>\" (last n lines), \"full\" (entire file), \"middle:<n>\" (n lines from middle)"
      }
    },
    "required": ["mode"]
  }
}
```

### Task Management Tools

#### plan
```json
{
  "name": "plan",
  "description": "Create a new task list based on the Agent's request.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "session_id": {
        "type": "string",
        "description": "The session identifier for the task list"
      },
      "request": {
        "type": "string",
        "description": "The original request content to create tasks from (optional)"
      }
    },
    "required": ["session_id"]
  }
}
```

#### list
```json
{
  "name": "list",
  "description": "Retrieve all existing tasks of the current session.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "session_id": {
        "type": "string",
        "description": "The session identifier to retrieve tasks for"
      }
    },
    "required": ["session_id"]
  }
}
```

#### add
```json
{
  "name": "add",
  "description": "Add a new task to the current session's list.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "session_id": {
        "type": "string",
        "description": "The session identifier for the task"
      },
      "title": {
        "type": "string",
        "description": "The task title"
      },
      "description": {
        "type": "string",
        "description": "The task description (optional)"
      }
    },
    "required": ["session_id", "title"]
  }
}
```

#### remove
```json
{
  "name": "remove",
  "description": "Remove a task from the list by its task_id.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "The unique identifier of the task to remove"
      }
    },
    "required": ["task_id"]
  }
}
```

#### complete
```json
{
  "name": "complete",
  "description": "Mark a task as completed.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "The unique identifier of the task to mark as completed"
      }
    },
    "required": ["task_id"]
  }
}
```

## Task Management Examples

### Example 1: Create a Task Plan

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "plan",
    "arguments": {
      "session_id": "webapp-project-2024",
      "request": "Create a Node.js web application with user authentication and a REST API"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"session_id\": \"webapp-project-2024\",\n  \"request\": \"Create a Node.js web application with user authentication and a REST API\",\n  \"tasks_created\": 7,\n  \"tasks\": [\n    {\n      \"task_id\": \"550e8400-e29b-41d4-a716-446655440000\",\n      \"session_id\": \"webapp-project-2024\",\n      \"title\": \"Understand the coding requirements\",\n      \"description\": \"Auto-generated task from plan\",\n      \"status\": \"pending\",\n      \"created_at\": \"2024-01-15T10:30:00.000Z\",\n      \"updated_at\": \"2024-01-15T10:30:00.000Z\"\n    },\n    {\n      \"task_id\": \"550e8400-e29b-41d4-a716-446655440001\",\n      \"session_id\": \"webapp-project-2024\",\n      \"title\": \"Set up development environment\",\n      \"description\": \"Auto-generated task from plan\",\n      \"status\": \"pending\",\n      \"created_at\": \"2024-01-15T10:30:01.000Z\",\n      \"updated_at\": \"2024-01-15T10:30:01.000Z\"\n    }\n  ]\n}"
      }
    ]
  }
}
```

### Example 2: List All Tasks

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "list",
    "arguments": {
      "session_id": "webapp-project-2024"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"session_id\": \"webapp-project-2024\",\n  \"total_tasks\": 7,\n  \"tasks\": [\n    {\n      \"task_id\": \"550e8400-e29b-41d4-a716-446655440000\",\n      \"session_id\": \"webapp-project-2024\",\n      \"title\": \"Understand the coding requirements\",\n      \"description\": \"Auto-generated task from plan\",\n      \"status\": \"pending\",\n      \"created_at\": \"2024-01-15T10:30:00\",\n      \"updated_at\": \"2024-01-15T10:30:00\"\n    }\n  ]\n}"
      }
    ]
  }
}
```

### Example 3: Add a Custom Task

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "add",
    "arguments": {
      "session_id": "webapp-project-2024",
      "title": "Configure database connection",
      "description": "Set up MongoDB connection with connection pooling and error handling"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"task_id\": \"550e8400-e29b-41d4-a716-446655440008\",\n  \"task\": {\n    \"task_id\": \"550e8400-e29b-41d4-a716-446655440008\",\n    \"session_id\": \"webapp-project-2024\",\n    \"title\": \"Configure database connection\",\n    \"description\": \"Set up MongoDB connection with connection pooling and error handling\",\n    \"status\": \"pending\",\n    \"created_at\": \"2024-01-15T10:35:00.000Z\",\n    \"updated_at\": \"2024-01-15T10:35:00.000Z\"\n  }\n}"
      }
    ]
  }
}
```

### Example 4: Complete a Task

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "complete",
    "arguments": {
      "task_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"task_id\": \"550e8400-e29b-41d4-a716-446655440000\",\n  \"status\": \"completed\",\n  \"message\": \"Task marked as completed\"\n}"
      }
    ]
  }
}
```

### Example 5: Remove a Task

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "remove",
    "arguments": {
      "task_id": "550e8400-e29b-41d4-a716-446655440008"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"task_id\": \"550e8400-e29b-41d4-a716-446655440008\",\n  \"message\": \"Task removed successfully\"\n}"
      }
    ]
  }
}
```

### Example 6: Error Cases

#### Task Not Found
**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "complete",
    "arguments": {
      "task_id": "nonexistent-task-id"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": false,\n  \"task_id\": \"nonexistent-task-id\",\n  \"message\": \"Task not found\"\n}"
      }
    ]
  }
}
```

## Task Management Workflow Example

Here's a complete workflow showing how an AI Agent might use the task management system:

```javascript
// 1. Agent receives a request
const userRequest = "Build a weather app with location services";

// 2. Create a task plan
await callTool('plan', {
  session_id: 'weather-app-2024',
  request: userRequest
});

// 3. List tasks to see what was created
const tasks = await callTool('list', {
  session_id: 'weather-app-2024'
});

// 4. Add specific tasks as needed
await callTool('add', {
  session_id: 'weather-app-2024',
  title: 'Integrate weather API',
  description: 'Research and integrate OpenWeatherMap API'
});

// 5. As work progresses, mark tasks complete
await callTool('complete', {
  task_id: tasks.tasks[0].task_id
});

// 6. Remove tasks that are no longer needed
await callTool('remove', {
  task_id: 'some-task-id'
});

// 7. Check final status
await callTool('list', {
  session_id: 'weather-app-2024'
});
```

## Original Tool Examples (Curl and Log Reading)

### Example 1: Simple GET Request

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "execute_curl",
    "arguments": {
      "command": "curl https://httpbin.org/get"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"originalCommand\": \"curl https://httpbin.org/get\",\n  \"modifiedCommand\": \"curl.exe -H \\\"Authorization: Bearer your-bearer-token-here\\\" https://httpbin.org/get\",\n  \"stdout\": \"{\\\"args\\\":{},\\\"headers\\\":{\\\"Authorization\\\":\\\"Bearer your-bearer-token-here\\\",\\\"Host\\\":\\\"httpbin.org\\\"},\\\"origin\\\":\\\"1.2.3.4\\\",\\\"url\\\":\\\"https://httpbin.org/get\\\"}\",\n  \"stderr\": \"\"\n}"
      }
    ]
  }
}
```

### Log Reading Tool Examples

#### Example 2: Read Full Log File

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "read_logs",
    "arguments": {
      "mode": "full"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"mode\": \"full\",\n  \"logFilePath\": \"/var/log/application.log\",\n  \"totalLines\": 150,\n  \"returnedLines\": 150,\n  \"lines\": [\"2024-01-01 10:00:01 INFO Application started\", \"2024-01-01 10:00:02 INFO Loading configuration\", ...]\n}"
      }
    ]
  }
}
```

#### Example 3: Read Last 10 Lines (Tail)

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "read_logs",
    "arguments": {
      "mode": "tail:10"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"mode\": \"tail:10\",\n  \"logFilePath\": \"/var/log/application.log\",\n  \"totalLines\": 150,\n  \"returnedLines\": 10,\n  \"lines\": [\"2024-01-01 10:25:00 INFO Scheduled backup started\", \"2024-01-01 10:25:30 INFO Backup completed successfully\", ...]\n}"
      }
    ]
  }
}
```

#### Example 4: Read First 5 Lines (Head)

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "read_logs",
    "arguments": {
      "mode": "head:5"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"mode\": \"head:5\",\n  \"logFilePath\": \"/var/log/application.log\",\n  \"totalLines\": 150,\n  \"returnedLines\": 5,\n  \"lines\": [\"2024-01-01 10:00:01 INFO Application started\", \"2024-01-01 10:00:02 INFO Loading configuration\", ...]\n}"
      }
    ]
  }
}
```

#### Example 5: Read 8 Lines from Middle

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "read_logs",
    "arguments": {
      "mode": "middle:8"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"mode\": \"middle:8\",\n  \"logFilePath\": \"/var/log/application.log\",\n  \"totalLines\": 150,\n  \"returnedLines\": 8,\n  \"lines\": [\"2024-01-01 10:10:30 WARN High memory usage detected: 85%\", \"2024-01-01 10:10:31 INFO Garbage collection triggered\", ...]\n}"
      }
    ]
  }
}
```

#### Example 6: Error Case - Log File Not Found

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "read_logs",
    "arguments": {
      "mode": "full"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": false,\n  \"mode\": \"full\",\n  \"logFilePath\": \"/var/log/application.log\",\n  \"error\": \"Log file not found: /var/log/application.log\",\n  \"lines\": []\n}"
      }
    ]
  }
}
```

#### Example 7: Error Case - Invalid Mode Format

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "read_logs",
    "arguments": {
      "mode": "invalid_mode"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": false,\n  \"mode\": \"invalid_mode\",\n  \"logFilePath\": \"/var/log/application.log\",\n  \"error\": \"Invalid mode format. Use \\\"head:<n>\\\", \\\"tail:<n>\\\", \\\"full\\\", or \\\"middle:<n>\\\"\",\n  \"lines\": []\n}"
      }
    ]
  }
}
```

### Example 2: POST Request with Existing Headers

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "execute_curl",
    "arguments": {
      "command": "curl -X POST -H \"Content-Type: application/json\" -d '{\"name\":\"test\"}' https://httpbin.org/post"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"originalCommand\": \"curl -X POST -H \\\"Content-Type: application/json\\\" -d '{\\\"name\\\":\\\"test\\\"}' https://httpbin.org/post\",\n  \"modifiedCommand\": \"curl.exe -X POST -H \\\"Content-Type: application/json\\\" -H \\\"Authorization: Bearer your-bearer-token-here\\\" -d '{\\\"name\\\":\\\"test\\\"}' https://httpbin.org/post\",\n  \"stdout\": \"{...response data...}\",\n  \"stderr\": \"\"\n}"
      }
    ]
  }
}
```

### Example 3: Command with Existing Authorization (No Modification)

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "execute_curl",
    "arguments": {
      "command": "curl -H \"Authorization: Bearer existing-token\" https://httpbin.org/get"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"originalCommand\": \"curl -H \\\"Authorization: Bearer existing-token\\\" https://httpbin.org/get\",\n  \"modifiedCommand\": \"curl.exe -H \\\"Authorization: Bearer existing-token\\\" https://httpbin.org/get\",\n  \"stdout\": \"{...response with existing token...}\",\n  \"stderr\": \"\"\n}"
      }
    ]
  }
}
```

### Example 4: Error Case - Invalid Command

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "execute_curl",
    "arguments": {
      "command": "wget https://example.com"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": false,\n  \"originalCommand\": \"wget https://example.com\",\n  \"error\": \"Command must start with curl\",\n  \"stdout\": \"\",\n  \"stderr\": \"\"\n}"
      }
    ]
  }
}
```

## Log Reading Tool Features

The `read_logs` tool provides several modes for reading log files:

### Supported Modes

1. **full**: Returns the entire log file
2. **head:<n>**: Returns the first n lines of the log file
3. **tail:<n>**: Returns the last n lines of the log file  
4. **middle:<n>**: Returns n lines from the middle of the log file

### Edge Case Handling

- **File not found**: Returns error message with file path
- **Large files**: Prevents reading files larger than 100MB
- **Invalid mode**: Validates mode format and parameters
- **Fewer lines than requested**: Returns all available lines
- **Empty files**: Handles gracefully with empty results
- **Invalid line counts**: Rejects zero or negative line numbers

## PowerShell Compatibility Features

The server automatically makes these adjustments for Windows PowerShell:

1. **curl to curl.exe**: Converts `curl` to `curl.exe` to avoid PowerShell aliases
2. **Quote handling**: Converts single quotes to double quotes for PowerShell compatibility
3. **Header injection**: Properly formats the Authorization header for PowerShell execution

## Bearer Token Behavior

- **Automatic injection**: If no Authorization header is present, adds `Authorization: Bearer <token>`
- **Preservation**: If an Authorization header already exists, leaves it unchanged
- **Position**: Inserts the header after existing headers or before the URL if no headers exist

## Error Handling

The server handles various error scenarios:

- Invalid commands (not starting with curl)
- Command execution timeouts (30 seconds)
- Network connectivity issues
- PowerShell execution errors
- Log file access issues
- Invalid log reading modes
- File size limitations