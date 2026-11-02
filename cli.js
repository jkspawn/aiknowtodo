#!/usr/bin/env node
// 터미널용 todo 명령. 저장·조회는 웹 앱과 같은 todo-store.js와 todo.db를 쓴다.
const path = require('node:path');
const { createTodoStore } = require('./todo-store');

const DB_PATH = process.env.TODO_DB || path.join(__dirname, 'todo.db');

const USAGE = `사용법:
  todo add <내용>    할 일 추가
  todo list          목록 보기
  todo done <번호>   완료 처리
  todo summary       오늘 완료한 할 일 요약`;

function formatTodo(todo) {
  const mark = todo.completed ? '[x]' : '[ ]';
  const time = todo.completed ? `  (완료 ${new Date(todo.completedAt).toLocaleString()})` : '';
  return `${mark} #${todo.id} ${todo.text}${time}`;
}

// 완료 시각은 UTC로 저장되므로 로컬 날짜 기준으로 오늘인지 판단한다.
function isToday(isoString) {
  return new Date(isoString).toDateString() === new Date().toDateString();
}

const commands = {
  add(store, args) {
    const todo = store.add(args.join(' '));
    console.log(`추가됨: #${todo.id} ${todo.text}`);
  },

  list(store) {
    const todos = store.list();
    if (todos.length === 0) return console.log('할 일이 없습니다.');
    todos.forEach((todo) => console.log(formatTodo(todo)));
  },

  done(store, [idArg]) {
    const id = Number(idArg);
    if (!Number.isInteger(id) || id < 1) throw new Error('완료할 번호를 숫자로 입력하세요. 예: todo done 3');
    const before = store.get(id);
    if (!before) throw new Error(`#${id} 할 일이 없습니다.`);
    if (before.completed) return console.log(`이미 완료됨: ${formatTodo(before)}`);
    console.log(`완료: ${formatTodo(store.complete(id))}`);
  },

  summary(store) {
    const todos = store.list();
    const doneToday = todos.filter((todo) => todo.completed && isToday(todo.completedAt));
    const remaining = todos.filter((todo) => !todo.completed).length;
    console.log(`오늘(${new Date().toLocaleDateString()}) 완료: ${doneToday.length}개, 남은 할 일: ${remaining}개`);
    doneToday.forEach((todo) => console.log(`  ${formatTodo(todo)}`));
  },
};

function main() {
  const [name, ...args] = process.argv.slice(2);
  const command = commands[name];
  if (!command) {
    console.log(USAGE);
    process.exitCode = name ? 1 : 0;
    return;
  }

  const store = createTodoStore(DB_PATH);
  try {
    command(store, args);
  } catch (err) {
    console.error(`오류: ${err.message}`);
    process.exitCode = 1;
  } finally {
    store.close();
  }
}

main();
