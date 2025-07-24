# Backend MCP Server

A Model Context Protocol (MCP) server that executes curl commands with automatic Bearer token injection and PowerShell compatibility for Windows environments.

## Features

- **Automatic Bearer Token Injection**: Adds a hardcoded Bearer token to curl commands that don't already have Authorization headers
- **PowerShell Compatibility**: Modifies curl syntax to work properly with PowerShell on Windows
- **Command Execution**: Executes the modified curl commands and returns both stdout and stderr
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

#### `execute_curl`

Executes a curl command with automatic modifications.

**Parameters:**
- `command` (string, required): The curl command to execute

**Example:**
```json
{
  "command": "curl -X GET https://api.example.com/data"
}
```

## How It Works

1. **Receives curl command** from MCP client
2. **Modifies the command** by:
   - Adding `Authorization: Bearer <token>` header if not present
   - Converting `curl` to `curl.exe` for PowerShell compatibility
   - Adjusting quote handling for PowerShell
3. **Executes** the modified command
4. **Returns** the execution results including:
   - Original command
   - Modified command
   - stdout output
   - stderr output
   - Success/failure status

## Configuration

The Bearer token is currently hardcoded in the source code. In a production environment, you should:

1. Load the token from environment variables
2. Use a secure configuration management system
3. Implement proper token rotation

To modify the token, edit the `BEARER_TOKEN` constant in `index.js`:

```javascript
const BEARER_TOKEN = 'your-actual-bearer-token-here';
```

## PowerShell Compatibility

The server makes several adjustments for Windows PowerShell compatibility:

- Uses `curl.exe` instead of `curl` to avoid PowerShell aliases
- Handles quote escaping properly for PowerShell
- Ensures proper header formatting

## Error Handling

The server handles various error conditions:

- Invalid curl commands
- Command execution timeouts (30 seconds)
- Network errors
- PowerShell execution errors

All errors are captured and returned to the MCP client with detailed information.

## Development

The server is built using:

- **Node.js**: Runtime environment
- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **child_process**: Command execution

## License

ISC