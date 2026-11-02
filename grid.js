// ===== 길찾기 격자 =====
// 격자 데이터(grid)와 화면의 칸(cellEls)을 따로 두고, 화면은 데이터를 따라 그린다.
// (정렬 화면에서 배열과 막대를 나눈 것과 같은 구조)

const CELL_TARGET_SIZE = 26; // 칸 하나의 목표 크기(px). 화면 폭을 이 크기로 나눠 열 개수를 정한다.
const MIN_COLS = 12;
const MAX_COLS = 40;
const RANDOM_WALL_RATE = 0.28; // '랜덤 벽'에서 벽이 될 확률
const RANDOM_MUD_RATE = 0.2;   // '랜덤 진흙'에서 진흙이 될 확률
const MUD_COST = 5;            // 진흙 칸에 들어가는 비용 (보통 칸은 1)

const gridEl = document.getElementById('grid');
const clearWallsBtn = document.getElementById('clear-walls-btn');
const randomWallsBtn = document.getElementById('random-walls-btn');
const randomMudBtn = document.getElementById('random-mud-btn');
const brushBtns = document.querySelectorAll('.brush');
const pathCostEl = document.getElementById('path-cost');
const comparePathsBtn = document.getElementById('compare-paths-btn');
const pathResults = document.getElementById('path-results');
const pathResultsBody = document.getElementById('path-results-body');
const pathAlgorithmSelect = document.getElementById('path-algorithm-select');
const visitedCountEl = document.getElementById('visited-count');
const pathLengthEl = document.getElementById('path-length');
const pathMessage = document.getElementById('path-message');
const pathSummary = document.getElementById('path-summary');

// 격자 데이터
//   rows, cols     행·열 개수
//   walls[r][c]    벽이면 true
//   weights[r][c]  그 칸에 들어가는 비용 (보통 1, 진흙 MUD_COST)
//   start, end     { r, c } 출발점과 도착점
const grid = { rows: 0, cols: 0, walls: [], weights: [], start: null, end: null };
let cellEls = []; // cellEls[r][c] = 화면의 칸(div)

// 격자를 고치면 이전 탐색 결과는 더 이상 맞지 않으니 지우고 처음 상태로 돌아간다.
// (pathPlayer는 아래 '탐색 재생'에서 만든다. 함수는 나중에 불리니까 괜찮다)
function onGridEdit() {
  resetSearch();
  pathResults.hidden = true; // 비교표도 이전 격자 기준이라 숨긴다
}

// ===== 크기 정하기 =====

// 지금 화면 폭에 맞는 행·열 개수
function measureSize() {
  const width = gridEl.clientWidth;
  const cols = Math.max(MIN_COLS, Math.min(MAX_COLS, Math.floor(width / CELL_TARGET_SIZE)));
  // 좁은 화면(휴대폰)은 버튼과 격자가 한 화면에 들어오도록 행을 줄인다.
  const rows = cols >= 25 ? 17 : 14;
  return { rows, cols };
}

// 행·열 개수가 바뀌면 격자를 새로 만든다. 기존 벽은 새 격자 안에 들어가는 만큼 남긴다.
function resizeGrid() {
  if (gridEl.clientWidth === 0) return; // 화면이 숨겨져 있으면 잴 수 없다

  const { rows, cols } = measureSize();
  if (rows === grid.rows && cols === grid.cols) return; // 그대로면 할 일 없음

  const oldWalls = grid.walls;
  const oldWeights = grid.weights;
  grid.walls = [];
  grid.weights = [];
  for (let r = 0; r < rows; r++) {
    grid.walls.push([]);
    grid.weights.push([]);
    for (let c = 0; c < cols; c++) {
      grid.walls[r].push(Boolean(oldWalls[r] && oldWalls[r][c]));
      grid.weights[r].push((oldWeights[r] && oldWeights[r][c]) || 1);
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
  resetSearch();
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
  cell.classList.toggle('mud', grid.weights[r][c] > 1);
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
// 무엇을 그릴지는 붓(brush)으로 고른다: 'wall' 벽 / 'mud' 진흙
// 누른 칸에 따라 끄는 동안 할 일(mode)이 정해진다.
//   'start' 출발점 옮기기 / 'end' 도착점 옮기기
//   'paint' 붓과 다른 칸을 눌렀다 → 지나가는 칸을 붓으로 칠하기
//   'erase' 붓과 같은 칸을 눌렀다 → 지나가는 칸에서 그것을 지우기
let brush = 'wall';
let dragMode = null;

// (r, c) 칸이 지금 붓으로 칠해진 상태인가
function hasBrush(r, c) {
  return brush === 'wall' ? grid.walls[r][c] : grid.weights[r][c] > 1;
}

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
    grid.weights[r][c] = 1; // 출발점·도착점 칸에는 진흙을 두지 않는다
    renderCell(old.r, old.c);
    renderCell(r, c);
  } else {
    if (isStart(r, c) || isEnd(r, c)) return; // 출발점·도착점에는 칠하지 않는다
    const paint = dragMode === 'paint';
    if (hasBrush(r, c) === paint) return; // 이미 원하는 상태면 할 일 없음

    // 한 칸은 벽이거나 진흙이거나 빈 칸 중 하나다.
    if (brush === 'wall') {
      grid.walls[r][c] = paint;
      if (paint) grid.weights[r][c] = 1;
    } else {
      grid.weights[r][c] = paint ? MUD_COST : 1;
      if (paint) grid.walls[r][c] = false;
    }
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
  else dragMode = hasBrush(pos.r, pos.c) ? 'erase' : 'paint';

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

// 벽과 진흙을 모두 지운다.
function clearAll() {
  for (const row of grid.walls) row.fill(false);
  for (const row of grid.weights) row.fill(1);
  renderAllCells();
  onGridEdit();
}

// 벽을 랜덤으로 다시 놓는다. (진흙은 벽이 된 칸에서만 지워진다)
function randomWalls() {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const wall = !isStart(r, c) && !isEnd(r, c) && Math.random() < RANDOM_WALL_RATE;
      grid.walls[r][c] = wall;
      if (wall) grid.weights[r][c] = 1;
    }
  }
  renderAllCells();
  onGridEdit();
}

// 벽이 아닌 칸에 진흙을 랜덤으로 다시 놓는다.
function randomMud() {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const mud =
        !grid.walls[r][c] && !isStart(r, c) && !isEnd(r, c) && Math.random() < RANDOM_MUD_RATE;
      grid.weights[r][c] = mud ? MUD_COST : 1;
    }
  }
  renderAllCells();
  onGridEdit();
}

clearWallsBtn.addEventListener('click', clearAll);
randomWallsBtn.addEventListener('click', randomWalls);
randomMudBtn.addEventListener('click', randomMud);

// 붓 고르기: 누른 버튼만 눌린 상태(aria-pressed)로
for (const btn of brushBtns) {
  btn.addEventListener('click', () => {
    brush = btn.dataset.brush;
    for (const b of brushBtns) b.setAttribute('aria-pressed', String(b === btn));
  });
}

// 길찾기 화면이 처음 보일 때, 그리고 창 크기가 바뀔 때 격자 크기를 맞춘다.
document.addEventListener('viewchange', (event) => {
  if (event.detail === 'path') resizeGrid();
});
window.addEventListener('resize', resizeGrid);

// ===== 탐색 재생 =====
// 정렬 화면과 같은 재생기(player.js)를 쓴다. 길찾기는 단계를 만드는 법과 그리는 법만 알려 준다.

let searchResult = null; // 마지막 탐색 결과 { steps, found, visitedCount, pathLength }
let shownVisited = 0;    // 지금까지 화면에 그린 방문 칸 수
let shownPath = 0;       // 지금까지 화면에 그린 경로 칸 수
let currentCell = null;  // '지금 보는 칸' 표시가 붙어 있는 칸

const pathPlayer = createPlayer({
  playBtn: document.getElementById('path-play-btn'),
  stepBtn: document.getElementById('path-step-btn'),
  speedSlider: document.getElementById('path-speed-slider'),
  statusText: document.getElementById('path-status'),
  buildSteps: () => {
    searchResult = PATH_ALGORITHMS[pathAlgorithmSelect.value].search(grid);
    return searchResult.steps;
  },
  applyStep: applySearchStep,
  onFinish: finishSearch,
  onReplay: resetSearch,
  onStatus: updateSearchCounts,
});

// 탐색 단계 하나를 칸에 그린다.
function applySearchStep(step) {
  const cell = cellEls[step.r][step.c];

  if (step.type === 'frontier') {
    cell.classList.add('frontier');
  } else if (step.type === 'visit') {
    // '지금 보는 칸' 표시를 이 칸으로 옮긴다.
    if (currentCell) currentCell.classList.remove('current');
    currentCell = cell;
    cell.classList.remove('frontier');
    cell.classList.add('visited', 'current');
    shownVisited++;
  } else if (step.type === 'path') {
    if (currentCell) currentCell.classList.remove('current');
    currentCell = null;
    cell.classList.add('path');
    shownPath++;
  }
}

function finishSearch() {
  if (currentCell) currentCell.classList.remove('current');
  currentCell = null;
  pathMessage.textContent = searchResult.found ? '' : '도착점까지 가는 길이 없어요.';
  updateSearchCounts();
}

// 방문한 칸 수, 경로 길이와 비용을 화면에 맞춘다.
function updateSearchCounts() {
  visitedCountEl.textContent = shownVisited;
  // 경로를 다 그렸을 때만 길이와 비용을 보여준다. (그리는 중에는 '-')
  const show = searchResult && searchResult.found && pathPlayer.state === 'done';
  pathLengthEl.textContent = show ? `${searchResult.pathLength}칸` : '-';
  pathCostEl.textContent = show ? searchResult.pathCost : '-';
}

// 탐색 흔적을 모두 지우고 '시작' 상태로 돌아간다.
function resetSearch() {
  for (const row of cellEls) {
    for (const cell of row) cell.classList.remove('frontier', 'visited', 'current', 'path');
  }
  searchResult = null;
  shownVisited = 0;
  shownPath = 0;
  currentCell = null;
  pathMessage.textContent = '';
  pathPlayer.reset();
}

// 드롭다운에 알고리즘 목록을 채우고, 고른 알고리즘의 설명을 보여준다.
for (const [key, algorithm] of Object.entries(PATH_ALGORITHMS)) {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = algorithm.name;
  pathAlgorithmSelect.appendChild(option);
}

function renderPathSummary() {
  pathSummary.textContent = PATH_ALGORITHMS[pathAlgorithmSelect.value].summary;
}

pathAlgorithmSelect.addEventListener('change', () => {
  resetSearch();
  renderPathSummary();
});
renderPathSummary();

// ===== 모든 알고리즘 비교 =====
// 애니메이션 없이 지금 격자로 모든 알고리즘을 돌려서 결과만 표로 보여준다.
function comparePaths() {
  const rows = Object.values(PATH_ALGORITHMS).map((a) => ({ name: a.name, ...a.search(grid) }));

  // 가장 싼 비용을 찾은 알고리즘들 중에서 방문한 칸이 가장 적은 것을 강조한다.
  const found = rows.filter((r) => r.found);
  const cheapest = Math.min(...found.map((r) => r.pathCost));
  const optimal = found.filter((r) => r.pathCost === cheapest);
  const fewest = Math.min(...optimal.map((r) => r.visitedCount));

  pathResultsBody.innerHTML = '';
  for (const r of rows) {
    const tr = document.createElement('tr');
    if (r.found && r.pathCost === cheapest && r.visitedCount === fewest) tr.className = 'best';
    const cells = r.found
      ? [r.name, r.visitedCount, `${r.pathLength}칸`, r.pathCost]
      : [r.name, r.visitedCount, '길 없음', '-'];
    for (const text of cells) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    }
    pathResultsBody.appendChild(tr);
  }
  pathResults.hidden = false;
  pathResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

comparePathsBtn.addEventListener('click', comparePaths);
