# Backend MCP Server

A Model Context Protocol (MCP) server that provides backend utilities including curl command execution with automatic Bearer token injection and log file reading capabilities.

## Features

- **Automatic Bearer Token Injection**: Adds a hardcoded Bearer token to curl commands that don't already have Authorization headers
- **PowerShell Compatibility**: Modifies curl syntax to work properly with PowerShell on Windows
- **Command Execution**: Executes the modified curl commands and returns both stdout and stderr
- **Log File Reading**: Reads logs from a hardcoded log file with multiple reading modes
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

#### `read_logs`

Reads logs from a hardcoded log file with different modes.

**Parameters:**
- `mode` (string, required): Reading mode with the following options:
  - `"full"` - Return the entire file
  - `"head:<n>"` - Return the first n lines (e.g., "head:10")
  - `"tail:<n>"` - Return the last n lines (e.g., "tail:5")
  - `"middle:<n>"` - Return n lines from the middle of the file (e.g., "middle:8")

**Example:**
```json
{
  "mode": "tail:50"
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

### Bearer Token

The Bearer token is currently hardcoded in the source code. In a production environment, you should:

1. Load the token from environment variables
2. Use a secure configuration management system
3. Implement proper token rotation

To modify the token, edit the `BEARER_TOKEN` constant in `index.js`:

```javascript
const BEARER_TOKEN = 'your-actual-bearer-token-here';
```

### Log File Path

The log file path is currently hardcoded in the source code. The default paths are:
- **Windows**: `C:\logs\application.log`
- **Linux/Unix**: `/var/log/application.log`

To modify the path, edit the `LOG_FILE_PATH` constant in `index.js`:

```javascript
const LOG_FILE_PATH = '/path/to/your/log/file.log';
```

### Using Environment Variables (Recommended)

For production use, modify the code to use environment variables:

```javascript
const BEARER_TOKEN = process.env.BEARER_TOKEN || 'default-token';
```

Then set the environment variable before starting the server:

**Windows PowerShell:**
```powershell
$env:BEARER_TOKEN = "your-actual-token"
npm start
```

**Windows Command Prompt:**
```cmd
set BEARER_TOKEN=your-actual-token
npm start
```

**Unix/Linux:**
```bash
export BEARER_TOKEN="your-actual-token"
npm start
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