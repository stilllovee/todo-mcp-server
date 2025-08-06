const fs = require('fs').promises;
const { LOG_FILE_PATH, LIMITS } = require('../config/constants');

/**
 * Parse the mode parameter to extract command and number
 */
function parseMode(mode) {
  if (mode === 'full') {
    return { command: 'full', number: null };
  }

  const modePattern = /^(head|tail|middle):(\d+)$/;
  const match = mode.match(modePattern);
  
  if (!match) {
    throw new Error('Invalid mode format. Use "head:<n>", "tail:<n>", "full", or "middle:<n>"');
  }

  const [, command, numberStr] = match;
  const number = parseInt(numberStr, 10);

  if (number <= 0) {
    throw new Error('Number of lines must be greater than 0');
  }

  return { command, number };
}

/**
 * Read logs from the hardcoded log file with specified mode
 */
async function readLogs(mode) {
  try {
    console.log('[MCP Server] Reading logs with mode:', mode);

    // Parse the mode
    const { command, number } = parseMode(mode);

    // Check if file exists
    try {
      await fs.access(LOG_FILE_PATH);
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              mode,
              logFilePath: LOG_FILE_PATH,
              error: `Log file not found: ${LOG_FILE_PATH}`,
              lines: [],
            }, null, 2),
          },
        ],
      };
    }

    // Get file stats to check size
    const stats = await fs.stat(LOG_FILE_PATH);
    const fileSizeInMB = stats.size / (1024 * 1024);

    // For very large files, limit processing
    if (fileSizeInMB > LIMITS.maxLogFileSizeMB) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              mode,
              logFilePath: LOG_FILE_PATH,
              error: `File too large (${fileSizeInMB.toFixed(2)}MB). Maximum supported size is ${LIMITS.maxLogFileSizeMB}MB.`,
              lines: [],
            }, null, 2),
          },
        ],
      };
    }

    // Read the file content
    const fileContent = await fs.readFile(LOG_FILE_PATH, 'utf8');
    const allLines = fileContent.split('\n');
    
    // Remove the last empty line if it exists (common when files end with newline)
    if (allLines.length > 0 && allLines[allLines.length - 1] === '') {
      allLines.pop();
    }

    let resultLines = [];

    // Process based on command
    switch (command) {
      case 'full':
        resultLines = allLines;
        break;

      case 'head':
        resultLines = allLines.slice(0, number);
        break;

      case 'tail':
        resultLines = allLines.slice(-number);
        break;

      case 'middle':
        const totalLines = allLines.length;
        if (totalLines === 0) {
          resultLines = [];
        } else if (number >= totalLines) {
          // If requested lines >= total lines, return all lines
          resultLines = allLines;
        } else {
          // Calculate middle position
          const startIndex = Math.floor((totalLines - number) / 2);
          resultLines = allLines.slice(startIndex, startIndex + number);
        }
        break;

      default:
        throw new Error(`Unsupported command: ${command}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            mode,
            logFilePath: LOG_FILE_PATH,
            totalLines: allLines.length,
            returnedLines: resultLines.length,
            lines: resultLines,
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
            mode,
            logFilePath: LOG_FILE_PATH,
            error: error.message,
            lines: [],
          }, null, 2),
        },
      ],
    };
  }
}

module.exports = {
  parseMode,
  readLogs,
};