/**
 * Generate a random 6-character alphanumeric string
 */
async function generateRandomString() {
  try {
    // Character set: A-Z, a-z, 0-9 (62 characters total)
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    // Generate 6 random characters
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }

    console.log('[MCP Server] Generated random string:', result);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            randomString: result,
            length: result.length,
            characters: 'alphanumeric (A-Z, a-z, 0-9)',
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
            error: error.message,
          }, null, 2),
        },
      ],
    };
  }
}

module.exports = {
  generateRandomString,
};