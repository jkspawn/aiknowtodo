# 할 일 예제 앱 (로컬 SQLite)

이 폴더의 `todo.db` 파일에 할 일을 저장하는 아주 작은 웹 앱입니다.
외부 계정이나 클라우드 DB는 쓰지 않고, Node.js에 내장된 `node:sqlite`만 사용합니다(외부 패키지 없음).

## 요구 사항

- Node.js 22.13 이상 (확인한 버전: v24.22.1)

## 설치와 실행

```bash
npm install
npm start
```

브라우저에서 http://localhost:3000 을 엽니다. 종료는 `Ctrl+C`입니다.

- 포트 변경: `PORT=4000 npm start` (PowerShell에서는 `$env:PORT=4000; npm start`)
- DB 파일 경로 변경: `TODO_DB` 환경 변수 (기본값은 이 폴더의 `todo.db`)

## 터미널 명령 (todo)

웹 앱과 같은 `todo-store.js`와 같은 `todo.db`를 사용합니다. 웹에서 추가한 할 일이 터미널에서도 보이고, 터미널에서 바꾼 내용은 웹 화면을 새로 고치면 반영됩니다.

```bash
node cli.js add 장보기 목록 정리   # 추가 (공백이 있어도 따옴표 없이 됨)
node cli.js list                   # 목록
node cli.js done 3                 # 완료 처리
node cli.js summary                # 오늘(로컬 날짜 기준) 완료한 할 일 요약
```

`npm run todo -- list`처럼 실행해도 됩니다. 어디서든 `todo list`로 쓰려면 이 폴더에서 `npm link`를 한 번 실행하세요(전역 명령이 등록됨, 해제는 `npm unlink -g todo-sqlite-example`).
오류가 나면 종료 코드 1을 돌려줍니다. `TODO_DB` 환경 변수로 다른 DB 파일을 지정할 수 있습니다.

## 구성

| 파일 | 역할 |
| --- | --- |
| `todo-store.js` | 저장·조회 로직 (`createTodoStore(dbPath)`) — 웹과 무관하게 재사용 가능 |
| `server.js` | 웹 화면과 JSON API 제공 |
| `cli.js` | 터미널용 `todo` 명령 (저장 로직은 `todo-store.js` 재사용) |
| `public/index.html` | 할 일 추가·목록·완료 처리 화면 |

### 저장 형식 (`todos` 테이블)

| 열 | 내용 |
| --- | --- |
| `id` | 고유 번호 (자동 증가) |
| `text` | 내용 |
| `completed` | 완료 여부 (0/1) |
| `completed_at` | 완료 시각 (ISO 8601, UTC), 미완료면 NULL |

### 저장 로직 재사용 예

```js
const { createTodoStore } = require('./todo-store');
const store = createTodoStore('todo.db');
store.add('우유 사기');   // { id, text, completed, completedAt }
store.list();
store.complete(1);       // 없는 번호면 null
store.close();
```

### API

- `GET /api/todos` — 목록
- `POST /api/todos` — `{ "text": "..." }`로 추가
- `POST /api/todos/:id/complete` — 완료 처리 (이미 완료된 항목은 최초 완료 시각 유지)
