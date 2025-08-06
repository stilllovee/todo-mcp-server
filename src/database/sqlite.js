const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class TaskDatabase {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(process.cwd(), 'tasks.db');
    this.db = new sqlite3.Database(this.dbPath);
    this.initializeDatabase();
  }

  /**
   * Initialize SQLite database for task management
   */
  initializeDatabase() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS tasks (
        task_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createTableSQL, (err) => {
      if (err) {
        console.error('[MCP Server] Error creating tasks table:', err);
      } else {
        console.error('[MCP Server] Tasks database initialized');
      }
    });
  }

  /**
   * Create a task in the database
   */
  async createTask(taskId, sessionId, title, description = '') {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO tasks (task_id, session_id, title, description, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
      `;

      this.db.run(sql, [taskId, sessionId, title, description], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            task_id: taskId,
            session_id: sessionId,
            title: title,
            description: description,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
    });
  }

  /**
   * Get all tasks for a session from database
   */
  async getTasks(sessionId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT task_id, session_id, title, description, status, created_at, updated_at
        FROM tasks
        WHERE session_id = ?
        ORDER BY created_at ASC
      `;

      this.db.all(sql, [sessionId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Delete a task from database
   */
  async deleteTask(taskId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM tasks WHERE task_id = ?';

      this.db.run(sql, [taskId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Update task status in database
   */
  async updateTaskStatus(taskId, status) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE tasks 
        SET status = ?, updated_at = datetime('now')
        WHERE task_id = ?
      `;

      this.db.run(sql, [status, taskId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('[MCP Server] Error closing database:', err);
        } else {
          console.log('[MCP Server] Database connection closed');
        }
      });
    }
  }
}

module.exports = {
  TaskDatabase,
};