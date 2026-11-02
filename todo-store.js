// 할 일 저장·조회 로직. 웹 서버와 분리되어 있어 다른 진입점에서도 그대로 재사용할 수 있다.
const { DatabaseSync } = require('node:sqlite');

function toTodo(row) {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed === 1,
    completedAt: row.completed_at,
  };
}

function createTodoStore(dbPath) {
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      text         TEXT    NOT NULL,
      completed    INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT
    )
  `);

  const insertStmt = db.prepare('INSERT INTO todos (text) VALUES (?)');
  const getStmt = db.prepare('SELECT * FROM todos WHERE id = ?');
  const listStmt = db.prepare('SELECT * FROM todos ORDER BY id');
  // 이미 완료된 항목은 건드리지 않아 최초 완료 시각이 유지된다.
  const completeStmt = db.prepare(
    'UPDATE todos SET completed = 1, completed_at = ? WHERE id = ? AND completed = 0'
  );

  return {
    add(text) {
      const trimmed = String(text ?? '').trim();
      if (!trimmed) throw new Error('할 일 내용이 비어 있습니다.');
      const { lastInsertRowid } = insertStmt.run(trimmed);
      return toTodo(getStmt.get(lastInsertRowid));
    },

    list() {
      return listStmt.all().map(toTodo);
    },

    get(id) {
      const row = getStmt.get(id);
      return row ? toTodo(row) : null;
    },

    // 해당 번호가 없으면 null을 돌려준다.
    complete(id) {
      completeStmt.run(new Date().toISOString(), id);
      return this.get(id);
    },

    close() {
      db.close();
    },
  };
}

module.exports = { createTodoStore };
