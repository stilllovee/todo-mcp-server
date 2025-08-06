const { spawn } = require('child_process');
const { TIMEOUTS } = require('../config/constants');

/**
 * Execute a PowerShell command using child_process.spawn
 */
async function executePowerShellCommand(command) {
  return new Promise((resolve, reject) => {
    console.log('[MCP Server] Executing PowerShell command:', command);

    // Check if we're on Windows platform
    if (process.platform !== 'win32') {
      const message = `PowerShell commands are only supported on Windows platform. Current platform: ${process.platform}`;
      console.log('[MCP Server]', message);
      resolve({
        exitCode: -1,
        stdout: '',
        stderr: message,
      });
      return;
    }

    const powershell = spawn('powershell.exe', ['-Command', command], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    powershell.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    powershell.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    powershell.on('close', (code) => {
      console.log('[MCP Server] PowerShell command exit code:', code);
      console.log('[MCP Server] PowerShell stdout:', stdout);
      console.log('[MCP Server] PowerShell stderr:', stderr);

      resolve({
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });

    powershell.on('error', (error) => {
      console.error('[MCP Server] PowerShell command error:', error);
      reject(error);
    });

    // Set a timeout for the PowerShell command
    setTimeout(() => {
      powershell.kill();
      reject(new Error(`PowerShell command timed out after ${TIMEOUTS.powershell / 1000} seconds`));
    }, TIMEOUTS.powershell);
  });
}

module.exports = {
  executePowerShellCommand,
};