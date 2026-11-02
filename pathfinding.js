// ===== 길찾기 알고리즘 =====
// 정렬과 같은 방식으로, 탐색하면서 일어난 일을 "단계" 목록으로 돌려준다.
//
// 격자(grid) 형식
//   { rows, cols, walls, start, end }
//   walls[r][c]가 true면 벽, start와 end는 { r, c }
//
// 단계의 종류
//   { type: 'frontier', r, c }  이 칸을 "나중에 볼 칸" 목록(대기열)에 넣었다
//   { type: 'visit', r, c }     이 칸을 꺼내서 살펴봤다 (방문)
//   { type: 'path', r, c }      찾은 최단 경로에 속한 칸 (출발점 → 도착점 순서)
//
// 결과 형식
//   { steps, found, visitedCount, pathLength }
//   pathLength는 출발점에서 도착점까지 움직인 횟수 (길이 없으면 0)

// 위, 오른쪽, 아래, 왼쪽 (대각선으로는 움직이지 않는다)
const DIRECTIONS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

// (r, c)에서 갈 수 있는 이웃 칸 목록: 격자 안이고 벽이 아닌 칸
function neighborsOf(grid, r, c) {
  const result = [];
  for (const [dr, dc] of DIRECTIONS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= grid.rows || nc < 0 || nc >= grid.cols) continue; // 격자 밖
    if (grid.walls[nr][nc]) continue; // 벽
    result.push([nr, nc]);
  }
  return result;
}

// rows × cols 크기의 2차원 배열을 value로 채워서 만든다.
function make2D(rows, cols, value) {
  return Array.from({ length: rows }, () => Array(cols).fill(value));
}

// 도착점에서 prev(어디서 왔는지)를 거꾸로 따라가 출발점까지의 경로를 만든다.
// 그리고 출발점 → 도착점 순서로 'path' 단계를 덧붙인다.
function addPathSteps(steps, prev, end) {
  const path = [];
  let cur = [end.r, end.c];
  while (cur) {
    path.push(cur);
    cur = prev[cur[0]][cur[1]];
  }
  path.reverse();
  for (const [r, c] of path) steps.push({ type: 'path', r, c });
  return path.length - 1; // 칸 수 - 1 = 움직인 횟수
}

// 너비 우선 탐색 (BFS, Breadth-First Search)
// 출발점에서 가까운 칸부터 차례대로 퍼져 나가며 살펴본다. 물결이 퍼지는 모양이 된다.
// "먼저 넣은 칸을 먼저 꺼내는" 큐(queue)를 쓰기 때문에,
// 가중치가 없는 격자에서는 처음 도착했을 때의 경로가 곧 최단 경로다.
function bfsSearch(grid) {
  const { start, end } = grid;
  const steps = [];
  const visited = make2D(grid.rows, grid.cols, false); // 대기열에 넣은 적이 있는가
  const prev = make2D(grid.rows, grid.cols, null);     // 이 칸에 어디서 왔는가

  // 배열 앞에서 꺼내는 shift()는 느려서, 꺼낼 위치(head)만 앞으로 옮기는 방식으로 큐를 쓴다.
  const queue = [[start.r, start.c]];
  let head = 0;
  visited[start.r][start.c] = true;
  steps.push({ type: 'frontier', r: start.r, c: start.c });

  let found = false;
  let visitedCount = 0;

  while (head < queue.length) {
    const [r, c] = queue[head++]; // 가장 먼저 들어온 칸을 꺼낸다
    steps.push({ type: 'visit', r, c });
    visitedCount++;

    if (r === end.r && c === end.c) {
      found = true;
      break;
    }

    for (const [nr, nc] of neighborsOf(grid, r, c)) {
      if (visited[nr][nc]) continue; // 이미 넣은 칸은 다시 넣지 않는다
      visited[nr][nc] = true;
      prev[nr][nc] = [r, c];
      queue.push([nr, nc]);
      steps.push({ type: 'frontier', r: nr, c: nc });
    }
  }

  const pathLength = found ? addPathSteps(steps, prev, end) : 0;
  return { steps, found, visitedCount, pathLength };
}

// 화면의 드롭다운에서 고를 수 있는 길찾기 알고리즘 목록
const PATH_ALGORITHMS = {
  bfs: {
    name: '너비 우선 탐색 (BFS)',
    search: bfsSearch,
    summary:
      '출발점에서 가까운 칸부터 물결처럼 퍼져 나가며 찾습니다. 먼저 넣은 칸을 먼저 꺼내는 큐를 써서, 처음 도착한 경로가 최단 경로예요.',
  },
};

// node로 테스트할 때 불러올 수 있게 내보낸다. (브라우저에서는 무시된다)
if (typeof module !== 'undefined') {
  module.exports = { bfsSearch, neighborsOf, PATH_ALGORITHMS };
}
