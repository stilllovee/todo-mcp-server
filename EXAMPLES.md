# Example MCP Client Interactions

This document shows examples of how to interact with the Backend MCP Server.

## Tool Definitions

The server provides two tools:

### execute_curl
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

### read_logs
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

## Example Requests and Responses

### Curl Tool Examples

#### Example 1: Simple GET Request

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