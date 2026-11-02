// 웹 화면과 JSON API를 제공하는 서버. 저장 로직은 todo-store.js에 있다.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createTodoStore } = require('./todo-store');

const PORT = Number(process.env.PORT) || 3000;
const DB_PATH = process.env.TODO_DB || path.join(__dirname, 'todo.db');
const INDEX_HTML = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));

const store = createTodoStore(DB_PATH);

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('잘못된 JSON입니다.'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  try {
    if (req.method === 'GET' && pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(INDEX_HTML);
    }

    if (req.method === 'GET' && pathname === '/api/todos') {
      return sendJson(res, 200, store.list());
    }

    if (req.method === 'POST' && pathname === '/api/todos') {
      const { text } = await readJson(req);
      return sendJson(res, 201, store.add(text));
    }

    const match = pathname.match(/^\/api\/todos\/(\d+)\/complete$/);
    if (req.method === 'POST' && match) {
      const todo = store.complete(Number(match[1]));
      return todo
        ? sendJson(res, 200, todo)
        : sendJson(res, 404, { error: '해당 번호의 할 일이 없습니다.' });
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    sendJson(res, 400, { error: err.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`할 일 앱: http://localhost:${PORT}  (DB: ${DB_PATH})`);
});

function shutdown() {
  server.close(() => {
    store.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
