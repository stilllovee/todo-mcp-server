const { v4: uuidv4 } = require('uuid');

/**
 * Task management functionality
 */
class TaskManager {
  constructor(database) {
    this.db = database;
  }

  /**
   * Retrieve all existing tasks of the current session
   */
  async listTasks(sessionId) {
    try {
      console.log('[MCP Server] Listing tasks for session:', sessionId);

      const tasks = await this.db.getTasks(sessionId);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              session_id: sessionId,
              total_tasks: tasks.length,
              tasks: tasks
            }, null, 2),
          },
        ],
      };

    } catch (error) {
      console.error('[MCP Server] Error in listTasks:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              session_id: sessionId,
              error: error.message
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Add a new task to the current session's list
   */
  async addTask(sessionId, title, description = '') {
    try {
      console.log('[MCP Server] Adding task to session:', sessionId);

      const taskId = uuidv4();
      const task = await this.db.createTask(taskId, sessionId, title, description);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              task_id: taskId,
              task: task
            }, null, 2),
          },
        ],
      };

    } catch (error) {
      console.error('[MCP Server] Error in addTask:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              session_id: sessionId,
              title: title,
              error: error.message
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Remove a task from the list by its task_id
   */
  async removeTask(taskId) {
    try {
      console.log('[MCP Server] Removing task:', taskId);

      const success = await this.db.deleteTask(taskId);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: success,
              task_id: taskId,
              message: success ? 'Task removed successfully' : 'Task not found'
            }, null, 2),
          },
        ],
      };

    } catch (error) {
      console.error('[MCP Server] Error in removeTask:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              task_id: taskId,
              error: error.message
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Mark a task as completed
   */
  async completeTask(taskId) {
    try {
      console.log('[MCP Server] Completing task:', taskId);

      const success = await this.db.updateTaskStatus(taskId, 'completed');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: success,
              task_id: taskId,
              status: 'completed',
              message: success ? 'Task marked as completed' : 'Task not found'
            }, null, 2),
          },
        ],
      };

    } catch (error) {
      console.error('[MCP Server] Error in completeTask:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              task_id: taskId,
              error: error.message
            }, null, 2),
          },
        ],
      };
    }
  }
}

module.exports = {
  TaskManager,
};