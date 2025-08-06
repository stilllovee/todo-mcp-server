const { DEFAULT_PATHS } = require('../config/constants');
const { executePowerShellCommand } = require('../utils/powershell');

/**
 * Kill any process using port 3000 and start a new Node.js process
 */
async function restartNodeProcess(args = {}) {
  try {
    // Use hardcoded paths as requested, with fallback to args
    const entrypoint = args.entrypoint || DEFAULT_PATHS.entrypoint;
    const logFile = args.logFile || DEFAULT_PATHS.logFile;
    const errorLogFile = args.errorLogFile || DEFAULT_PATHS.errorLogFile;

    console.log('[MCP Server] Restarting Node.js process...');
    console.log('[MCP Server] Entrypoint:', entrypoint);
    console.log('[MCP Server] Log file:', logFile);
    console.log('[MCP Server] Error log file:', errorLogFile);

    // Step 1: Kill any process using port 3000
    const killCommand = `npx kill-port 3000`;

    const killResult = await executePowerShellCommand(killCommand);
    console.log('[MCP Server] Kill command result:', killResult);

    // Step 2: Start a new Node.js process
    const startCommand = `Start-Process node "${entrypoint}" -RedirectStandardOutput "${logFile}" -RedirectStandardError "${errorLogFile}"`;
    executePowerShellCommand(startCommand).catch((error) => {
      console.error('[MCP Server] Failed to start Node.js process:', error);
    });
    console.log('[MCP Server] Start command result:');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            entrypoint,
            logFile,
            errorLogFile,
            killStep: {
              command: killCommand,
              output: killResult.stdout,
              error: killResult.stderr,
            },
            startStep: {
              command: startCommand,
              output: "oke",
              error: "",
            },
          }, null, 2),
        },
      ],
    };

  } catch (error) {
    console.error('[MCP Server] Error in restartNodeProcess:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack,
          }, null, 2),
        },
      ],
    };
  }
}

module.exports = {
  restartNodeProcess,
};