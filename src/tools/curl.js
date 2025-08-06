const { exec } = require('child_process');
const { promisify } = require('util');
const { BEARER_TOKEN, TIMEOUTS } = require('../config/constants');

const execAsync = promisify(exec);

/**
 * Modify curl command to add Bearer token and make it PowerShell compatible
 */
function modifyCurlCommand(curlCommand) {
  let modifiedCommand = curlCommand.trim();

  // Ensure it starts with curl
  if (!modifiedCommand.toLowerCase().startsWith('curl')) {
    throw new Error('Command must start with curl');
  }

  // Add Bearer token if not already present
  if (!modifiedCommand.includes('Authorization:') && !modifiedCommand.includes('authorization:')) {
    // Find a good place to insert the header
    // Look for existing -H headers to insert near them, or add before the URL
    const headerRegex = /-H\s+["']([^"']+)["']/g;
    const hasHeaders = headerRegex.test(modifiedCommand);

    if (hasHeaders) {
      // Insert after the last -H header
      const lastHeaderMatch = [...modifiedCommand.matchAll(/-H\s+["']([^"']+)["']/g)].pop();
      if (lastHeaderMatch) {
        const insertPos = lastHeaderMatch.index + lastHeaderMatch[0].length;
        modifiedCommand =
          modifiedCommand.slice(0, insertPos) +
          ` -H "Authorization: Bearer ${BEARER_TOKEN}"` +
          modifiedCommand.slice(insertPos);
      }
    } else {
      // No existing headers, add before the URL (typically the last argument)
      const parts = modifiedCommand.split(' ');
      const curlIndex = parts.findIndex(part => part.toLowerCase() === 'curl');
      
      // Insert the header after 'curl' and before the URL
      // URL is typically the last argument that doesn't start with -
      let urlIndex = parts.length - 1;
      for (let i = parts.length - 1; i > curlIndex; i--) {
        if (!parts[i].startsWith('-') && parts[i].trim() !== '') {
          urlIndex = i;
          break;
        }
      }
      
      parts.splice(urlIndex, 0, '-H', `"Authorization: Bearer ${BEARER_TOKEN}"`);
      modifiedCommand = parts.join(' ');
    }
  }

  // Make PowerShell compatible
  // On Windows, we might need to use curl.exe to avoid PowerShell aliases
  // Only do this on Windows platform
  if (process.platform === 'win32') {
    modifiedCommand = modifiedCommand.replace(/^curl\b/, 'curl.exe');
  }

  // Fix quoting for PowerShell - ensure double quotes are properly escaped
  // PowerShell handles single quotes differently, so convert to double quotes
  modifiedCommand = modifiedCommand.replace(/'/g, '"');

  return modifiedCommand;
}

/**
 * Execute the modified curl command
 */
async function executeCurl(originalCommand) {
  try {
    // Modify the curl command
    const modifiedCommand = modifyCurlCommand(originalCommand);

    console.log('[MCP Server] Original command:', originalCommand);
    console.log('[MCP Server] Modified command:', modifiedCommand);

    // Execute the command
    const { stdout, stderr } = await execAsync(modifiedCommand, {
      timeout: TIMEOUTS.curl,
      encoding: 'utf8',
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            originalCommand,
            modifiedCommand,
            stdout: stdout || '',
            stderr: stderr || '',
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            originalCommand,
            error: error.message,
            stdout: error.stdout || '',
            stderr: error.stderr || '',
          }, null, 2),
        },
      ],
    };
  }
}

module.exports = {
  modifyCurlCommand,
  executeCurl,
};