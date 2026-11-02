// ===== 길찾기 격자 =====
// 격자 데이터(grid)와 화면의 칸(cellEls)을 따로 두고, 화면은 데이터를 따라 그린다.
// (정렬 화면에서 배열과 막대를 나눈 것과 같은 구조)

const CELL_TARGET_SIZE = 26; // 칸 하나의 목표 크기(px). 화면 폭을 이 크기로 나눠 열 개수를 정한다.
const MIN_COLS = 12;
const MAX_COLS = 40;
const RANDOM_WALL_RATE = 0.28; // '랜덤 벽'에서 벽이 될 확률

const gridEl = document.getElementById('grid');
const clearWallsBtn = document.getElementById('clear-walls-btn');
const randomWallsBtn = document.getElementById('random-walls-btn');

// 격자 데이터
//   rows, cols   행·열 개수
//   walls[r][c]  벽이면 true
//   start, end   { r, c } 출발점과 도착점
const grid = { rows: 0, cols: 0, walls: [], start: null, end: null };
let cellEls = []; // cellEls[r][c] = 화면의 칸(div)

// 격자를 편집했을 때 부를 함수. #11에서 "탐색 결과 지우기"를 연결한다.
let onGridEdit = () => {};

// ===== 크기 정하기 =====

// 지금 화면 폭에 맞는 행·열 개수
function measureSize() {
  const width = gridEl.clientWidth;
  const cols = Math.max(MIN_COLS, Math.min(MAX_COLS, Math.floor(width / CELL_TARGET_SIZE)));
  const rows = cols >= 25 ? 17 : 21; // 좁은 화면(휴대폰)은 세로로 조금 더 길게
  return { rows, cols };
}

// 행·열 개수가 바뀌면 격자를 새로 만든다. 기존 벽은 새 격자 안에 들어가는 만큼 남긴다.
function resizeGrid() {
  if (gridEl.clientWidth === 0) return; // 화면이 숨겨져 있으면 잴 수 없다

  const { rows, cols } = measureSize();
  if (rows === grid.rows && cols === grid.cols) return; // 그대로면 할 일 없음

  const oldWalls = grid.walls;
  grid.walls = [];
  for (let r = 0; r < rows; r++) {
    grid.walls.push([]);
    for (let c = 0; c < cols; c++) {
      grid.walls[r].push(Boolean(oldWalls[r] && oldWalls[r][c]));
    }
  }
  grid.rows = rows;
  grid.cols = cols;

  // 출발점은 왼쪽, 도착점은 오른쪽 가운데. 그 자리에 벽이 있으면 치운다.
  const mid = Math.floor(rows / 2);
  grid.start = { r: mid, c: Math.min(3, cols - 1) };
  grid.end = { r: mid, c: Math.max(0, cols - 4) };
  grid.walls[grid.start.r][grid.start.c] = false;
  grid.walls[grid.end.r][grid.end.c] = false;

  buildCells();
}

// 격자 데이터에 맞춰 칸(div)을 만든다.
function buildCells() {
  gridEl.innerHTML = '';
  gridEl.style.gridTemplateColumns = `repeat(${grid.cols}, 1fr)`;
  cellEls = [];

  for (let r = 0; r < grid.rows; r++) {
    cellEls.push([]);
    for (let c = 0; c < grid.cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      gridEl.appendChild(cell);
      cellEls[r].push(cell);
    }
  }

  // ▶, ★ 기호 크기를 칸 크기에 맞춘다.
  const cellSize = gridEl.clientWidth / grid.cols;
  gridEl.style.fontSize = `${Math.round(cellSize * 0.55)}px`;

  renderAllCells();
}

// ===== 그리기 =====

const isStart = (r, c) => grid.start.r === r && grid.start.c === c;
const isEnd = (r, c) => grid.end.r === r && grid.end.c === c;

// 칸 하나의 모양을 데이터에 맞춘다.
function renderCell(r, c) {
  const cell = cellEls[r][c];
  cell.classList.toggle('wall', grid.walls[r][c]);
  cell.classList.toggle('start', isStart(r, c));
  cell.classList.toggle('end', isEnd(r, c));
}

function renderAllCells() {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) renderCell(r, c);
  }
}

// ===== 마우스·터치로 편집하기 =====
// pointer 이벤트는 마우스, 터치, 펜을 한 가지 코드로 다룰 수 있다.
//
// 누른 칸에 따라 끄는 동안 할 일(mode)이 정해진다.
//   'start' 출발점 옮기기 / 'end' 도착점 옮기기
//   'draw'  빈 칸을 눌렀다 → 지나가는 칸을 벽으로
//   'erase' 벽을 눌렀다   → 지나가는 칸의 벽을 지우기
let dragMode = null;

// 화면 좌표(x, y)에 있는 칸의 { r, c }. 격자 밖이면 null
function cellAt(x, y) {
  const el = document.elementFromPoint(x, y);
  const cell = el && el.closest('.cell');
  if (!cell || !gridEl.contains(cell)) return null;
  return { r: Number(cell.dataset.r), c: Number(cell.dataset.c) };
}

function applyDrag({ r, c }) {
  if (dragMode === 'start' || dragMode === 'end') {
    // 벽이나 다른 점 위로는 옮길 수 없다.
    const other = dragMode === 'start' ? grid.end : grid.start;
    if (grid.walls[r][c] || (other.r === r && other.c === c)) return;

    const point = grid[dragMode];
    if (point.r === r && point.c === c) return;
    const old = { ...point };
    point.r = r;
    point.c = c;
    renderCell(old.r, old.c);
    renderCell(r, c);
  } else {
    if (isStart(r, c) || isEnd(r, c)) return; // 출발점·도착점에는 벽을 놓지 않는다
    const wall = dragMode === 'draw';
    if (grid.walls[r][c] === wall) return;
    grid.walls[r][c] = wall;
    renderCell(r, c);
  }
  onGridEdit();
}

gridEl.addEventListener('pointerdown', (event) => {
  const pos = cellAt(event.clientX, event.clientY);
  if (!pos) return;
  event.preventDefault();
  // 손가락·마우스가 격자 밖으로 나가도 계속 이 요소에서 이벤트를 받는다.
  gridEl.setPointerCapture(event.pointerId);

  if (isStart(pos.r, pos.c)) dragMode = 'start';
  else if (isEnd(pos.r, pos.c)) dragMode = 'end';
  else dragMode = grid.walls[pos.r][pos.c] ? 'erase' : 'draw';

  applyDrag(pos);
});

gridEl.addEventListener('pointermove', (event) => {
  if (!dragMode) return;
  const pos = cellAt(event.clientX, event.clientY);
  if (pos) applyDrag(pos);
});

const endDrag = () => {
  dragMode = null;
};
gridEl.addEventListener('pointerup', endDrag);
gridEl.addEventListener('pointercancel', endDrag);

// ===== 버튼 =====

function clearWalls() {
  for (const row of grid.walls) row.fill(false);
  renderAllCells();
  onGridEdit();
}

function randomWalls() {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      grid.walls[r][c] = !isStart(r, c) && !isEnd(r, c) && Math.random() < RANDOM_WALL_RATE;
    }
  }
  renderAllCells();
  onGridEdit();
}

clearWallsBtn.addEventListener('click', clearWalls);
randomWallsBtn.addEventListener('click', randomWalls);

// 길찾기 화면이 처음 보일 때, 그리고 창 크기가 바뀔 때 격자 크기를 맞춘다.
document.addEventListener('viewchange', (event) => {
  if (event.detail === 'path') resizeGrid();
});
window.addEventListener('resize', resizeGrid);
