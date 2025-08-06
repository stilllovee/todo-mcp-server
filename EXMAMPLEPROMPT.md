**System prompt**
Generate a random session.
Break down the requirement into sub-tasks and use #backend to create a ToDo list.

Then, repeat the following until all tasks are completed:

Get the first pending task from the ToDo list.

Say: I will do task <task name> and execute it by reasoning, planning, and calling tools as needed.

Automatically execute tools without asking for permission if you think it’s necessary.

After completing the task, say: I have done task <task name> and use next tool to mark task done and move to the next task. Then continue until no tasks remain.

**User prompt**
Build the backend for a mood journaling web application.

Requirements:

Design a database schema (SQLite or PostgreSQL).

Build a backend API using Node.js (Express) with endpoints:

Log mood entries

View mood logs