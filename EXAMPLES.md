# Example MCP Client Interactions

This document shows examples of how to interact with the Backend MCP Server.

## Tool Definition

The server provides one tool:

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

## Example Requests and Responses

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

All errors are returned with detailed information including the original command, error message, and any available stdout/stderr output.