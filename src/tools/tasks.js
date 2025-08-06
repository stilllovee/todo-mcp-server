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

  /**
   * Get next task for a session. On first call, returns first pending task.
   * On subsequent calls, marks previously returned task as completed and returns next.
   */
  async nextTask(sessionId) {
    try {
      console.log('[MCP Server] Getting next task for session:', sessionId);

      // Get current next task ID for this session
      const currentTaskId = await this.db.getCurrentNextTask(sessionId);

      // If there's a current task, mark it as completed
      if (currentTaskId) {
        console.log('[MCP Server] Marking previous task as completed:', currentTaskId);
        await this.db.updateTaskStatus(currentTaskId, 'completed');
      }

      // Get the first pending task
      const nextTask = await this.db.getFirstPendingTask(sessionId);

      if (!nextTask) {
        // No tasks remaining, clear current next task
        await this.db.setCurrentNextTask(sessionId, null);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                session_id: sessionId,
                task: null,
                message: 'No pending tasks remaining'
              }, null, 2),
            },
          ],
        };
      }

      // Set this task as the current next task
      await this.db.setCurrentNextTask(sessionId, nextTask.task_id);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              session_id: sessionId,
              task: nextTask,
              message: 'Next task retrieved'
            }, null, 2),
          },
        ],
      };

    } catch (error) {
      console.error('[MCP Server] Error in nextTask:', error);
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
}

module.exports = {
  TaskManager,
};