// ===== 길찾기 알고리즘 =====
// 정렬과 같은 방식으로, 탐색하면서 일어난 일을 "단계" 목록으로 돌려준다.
//
// 격자(grid) 형식
//   { rows, cols, walls, weights, start, end }
//   walls[r][c]가 true면 벽, start와 end는 { r, c }
//   weights[r][c]는 그 칸에 들어갈 때 드는 비용 (보통 1, 진흙은 5). 없으면 모두 1
//
// 단계의 종류
//   { type: 'frontier', r, c }  이 칸을 "나중에 볼 칸" 목록(대기열)에 넣었다
//   { type: 'visit', r, c }     이 칸을 꺼내서 살펴봤다 (방문)
//   { type: 'path', r, c }      찾은 최단 경로에 속한 칸 (출발점 → 도착점 순서)
//
// 결과 형식
//   { steps, found, visitedCount, pathLength, pathCost }
//   pathLength는 출발점에서 도착점까지 움직인 횟수, pathCost는 들어간 칸 비용의 합 (길이 없으면 0)

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

// (r, c) 칸에 들어갈 때 드는 비용
function weightOf(grid, r, c) {
  return grid.weights ? grid.weights[r][c] : 1;
}

// rows × cols 크기의 2차원 배열을 value로 채워서 만든다.
function make2D(rows, cols, value) {
  return Array.from({ length: rows }, () => Array(cols).fill(value));
}

// 도착점에서 prev(어디서 왔는지)를 거꾸로 따라가 출발점까지의 경로를 만든다.
// 그리고 출발점 → 도착점 순서로 'path' 단계를 덧붙인다.
// 돌려주는 값: { pathLength: 움직인 횟수, pathCost: 들어간 칸 비용의 합 }
function addPathSteps(steps, prev, grid) {
  const path = [];
  let cur = [grid.end.r, grid.end.c];
  while (cur) {
    path.push(cur);
    cur = prev[cur[0]][cur[1]];
  }
  path.reverse();

  let pathCost = 0;
  path.forEach(([r, c], i) => {
    steps.push({ type: 'path', r, c });
    if (i > 0) pathCost += weightOf(grid, r, c); // 출발점은 이미 서 있는 칸이라 비용 없음
  });
  return { pathLength: path.length - 1, pathCost };
}

// 탐색 결과 묶기
function makeResult(steps, found, visitedCount, prev, grid) {
  const path = found ? addPathSteps(steps, prev, grid) : { pathLength: 0, pathCost: 0 };
  return { steps, found, visitedCount, ...path };
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

  return makeResult(steps, found, visitedCount, prev, grid);
}

// 다익스트라 (Dijkstra)
// "지금까지 드는 비용이 가장 적은 칸"부터 꺼내서 살펴본다.
// 그 칸을 꺼낸 순간, 출발점에서 그 칸까지의 최소 비용이 확정된다.
// 칸마다 비용이 달라도(진흙) 비용이 가장 적은 경로를 찾는다. 비용이 모두 1이면 BFS와 같은 결과다.
function dijkstraSearch(grid) {
  return bestFirstSearch(grid, () => 0);
}

// 다익스트라와 A*는 꺼내는 순서(우선순위)만 다르고 나머지는 똑같다.
//   우선순위 = 지금까지 비용(g) + 앞으로 남은 비용 추정값(h)
//   다익스트라는 h = 0, A*는 h = 도착점까지의 맨해튼 거리
function bestFirstSearch(grid, heuristic) {
  const { start, end } = grid;
  const steps = [];
  const cost = make2D(grid.rows, grid.cols, Infinity); // 출발점에서 이 칸까지 지금까지 찾은 최소 비용 (g)
  const done = make2D(grid.rows, grid.cols, false);    // 최소 비용이 확정됐는가 (방문했는가)
  const prev = make2D(grid.rows, grid.cols, null);

  const heap = new MinHeap();
  cost[start.r][start.c] = 0;
  heap.push([start.r, start.c], heuristic(start.r, start.c));
  steps.push({ type: 'frontier', r: start.r, c: start.c });

  let found = false;
  let visitedCount = 0;

  while (!heap.isEmpty()) {
    const [r, c] = heap.pop(); // 우선순위가 가장 작은 칸
    // 같은 칸이 더 큰 비용으로 큐에 남아 있을 수 있다. 이미 확정된 칸이면 건너뛴다.
    if (done[r][c]) continue;
    done[r][c] = true;
    steps.push({ type: 'visit', r, c });
    visitedCount++;

    if (r === end.r && c === end.c) {
      found = true;
      break;
    }

    for (const [nr, nc] of neighborsOf(grid, r, c)) {
      if (done[nr][nc]) continue;
      const newCost = cost[r][c] + weightOf(grid, nr, nc);
      if (newCost < cost[nr][nc]) {
        // 더 싼 길을 찾았다 → 기록하고 큐에 넣는다.
        cost[nr][nc] = newCost;
        prev[nr][nc] = [r, c];
        heap.push([nr, nc], newCost + heuristic(nr, nc));
        steps.push({ type: 'frontier', r: nr, c: nc });
      }
    }
  }

  return makeResult(steps, found, visitedCount, prev, grid);
}

// 화면의 드롭다운에서 고를 수 있는 길찾기 알고리즘 목록
//   weighted: 칸 비용(진흙)을 따지는가. 따지면 비용이 가장 적은 경로, 아니면 움직인 횟수가 가장 적은 경로를 찾는다.
const PATH_ALGORITHMS = {
  bfs: {
    name: '너비 우선 탐색 (BFS)',
    search: bfsSearch,
    weighted: false,
    summary:
      '출발점에서 가까운 칸부터 물결처럼 퍼져 나가며 찾습니다. 먼저 넣은 칸을 먼저 꺼내는 큐를 써서, 처음 도착한 경로가 움직인 횟수가 가장 적은 경로예요. 진흙의 비용은 따지지 않아요.',
  },
  dijkstra: {
    name: '다익스트라',
    search: dijkstraSearch,
    weighted: true,
    summary:
      '지금까지 드는 비용이 가장 적은 칸부터 꺼내며 퍼져 나갑니다. 우선순위 큐(최소 힙)를 써요. 진흙처럼 비용이 큰 칸이 있으면 돌아가는 게 더 싼지 따져서 비용이 가장 적은 경로를 찾습니다.',
  },
};

// node로 테스트할 때 불러올 수 있게 내보낸다. (브라우저에서는 무시된다)
if (typeof module !== 'undefined') {
  // node에서는 우선순위 큐를 직접 불러온다. (브라우저에서는 priorityQueue.js가 먼저 로드된다)
  global.MinHeap = require('./priorityQueue.js').MinHeap;
  module.exports = { bfsSearch, dijkstraSearch, neighborsOf, PATH_ALGORITHMS };
}
