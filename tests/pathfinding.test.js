// 길찾기 알고리즘 테스트
// 실행: node tests/pathfinding.test.js
//
// 격자를 글자로 그려서 만든다.
//   S 출발점, E 도착점, # 벽, . 빈 칸, ~ 진흙(비용 5)

const { PATH_ALGORITHMS } = require('../pathfinding.js');

function parseGrid(lines) {
  const grid = { rows: lines.length, cols: lines[0].length, walls: [], weights: [], start: null, end: null };
  lines.forEach((line, r) => {
    grid.walls.push([]);
    grid.weights.push([]);
    [...line].forEach((ch, c) => {
      grid.walls[r].push(ch === '#');
      grid.weights[r].push(ch === '~' ? 5 : 1);
      if (ch === 'S') grid.start = { r, c };
      if (ch === 'E') grid.end = { r, c };
    });
  });
  return grid;
}

// 'path' 단계들이 올바른 경로인지 확인한다.
//   출발점에서 시작해서 도착점에서 끝나고, 한 번에 한 칸씩 움직이고, 벽을 지나지 않는다.
function checkPath(grid, steps) {
  const path = steps.filter((s) => s.type === 'path');
  if (path.length === 0) return 'path 단계가 없음';
  const first = path[0];
  const last = path[path.length - 1];
  if (first.r !== grid.start.r || first.c !== grid.start.c) return '출발점에서 시작하지 않음';
  if (last.r !== grid.end.r || last.c !== grid.end.c) return '도착점에서 끝나지 않음';
  for (let i = 0; i < path.length; i++) {
    if (grid.walls[path[i].r][path[i].c]) return '벽을 지나감';
    if (i > 0) {
      const d = Math.abs(path[i].r - path[i - 1].r) + Math.abs(path[i].c - path[i - 1].c);
      if (d !== 1) return '한 칸씩 움직이지 않음';
    }
  }
  return null;
}

// expected: { moves, cost } 또는 null(길 없음)
//   moves: 움직인 횟수의 최솟값 → 비용을 따지지 않는 알고리즘(BFS)은 이걸 맞춰야 한다
//   cost:  비용 합의 최솟값     → 비용을 따지는 알고리즘(다익스트라, A*)은 이걸 맞춰야 한다
function check(algoKey, name, lines, expected) {
  const grid = parseGrid(lines);
  const { name: algoName, search, weighted } = PATH_ALGORITHMS[algoKey];
  const result = search(grid);

  let problem = null;
  if (expected === null) {
    if (result.found) problem = '길이 없어야 하는데 찾음';
    else if (result.steps.some((s) => s.type === 'path')) problem = '길이 없는데 path 단계가 있음';
  } else if (!result.found) {
    problem = '길을 못 찾음';
  } else if (weighted && result.pathCost !== expected.cost) {
    problem = `경로 비용 ${result.pathCost} (기대값 ${expected.cost})`;
  } else if (!weighted && result.pathLength !== expected.moves) {
    problem = `경로 길이 ${result.pathLength} (기대값 ${expected.moves})`;
  } else {
    problem = checkPath(grid, result.steps);
  }

  // 같은 칸을 두 번 방문하면 안 된다.
  const seen = new Set();
  for (const s of result.steps.filter((s) => s.type === 'visit')) {
    const key = `${s.r},${s.c}`;
    if (seen.has(key)) problem = problem || `(${key}) 두 번 방문`;
    seen.add(key);
  }
  if (seen.size !== result.visitedCount) problem = problem || 'visitedCount가 방문 단계 수와 다름';

  console.log(
    `${problem ? '❌' : '✅'} ${algoName} · ${name} ` +
      `(방문 ${result.visitedCount}, 경로 ${result.pathLength}칸 · 비용 ${result.pathCost})` +
      `${problem ? ' - ' + problem : ''}`
  );
  if (problem) process.exitCode = 1;
}

// 진흙이 없는 격자는 움직인 횟수 = 비용이다.
const plain = (n) => ({ moves: n, cost: n });

// [이름, 격자, 기대값({ moves, cost }, 길이 없으면 null)]
const cases = [
  ['일직선', ['S...E'], plain(4)],
  ['바로 옆', ['SE'], plain(1)],
  [
    '벽 돌아가기',
    [
      '.....',
      'S.#.E',
      '..#..',
    ],
    plain(6),
  ],
  [
    '미로',
    [
      'S.#....',
      '.##.##.',
      '...#..E',
      '.#...#.',
    ],
    plain(10), // 아래 2 → 오른쪽 2 → 아래 1 → 오른쪽 2 → 위 1 → 오른쪽 2
  ],
  [
    // 진흙을 곧장 지나가면 4번 움직이지만 비용 16(5+5+5+1),
    // 아래로 돌아가면 6번 움직이지만 비용 6
    '진흙 돌아가기',
    [
      'S~~~E',
      '.....',
    ],
    { moves: 4, cost: 6 },
  ],
  [
    // 돌아가는 길이 너무 길면 진흙을 지나가는 게 더 싸다.
    // 진흙 지나가기: 비용 9 / 위로 돌아가기: 위 2 + 오른쪽 6 + 아래 2 + 왼쪽 1 = 비용 11
    '진흙이 더 쌀 때',
    [
      '.......',
      '.#####.',
      'S.~..E.',
    ],
    { moves: 5, cost: 9 }, // S→.→~→.→.→E : 1+5+1+1+1 = 9
  ],
  [
    '막힘',
    [
      'S.#..',
      '..#.E',
      '..#..',
    ],
    null,
  ],
  [
    '출발점이 갇힘',
    [
      '.#...',
      '#S#.E',
      '.#...',
    ],
    null,
  ],
];

for (const key of Object.keys(PATH_ALGORITHMS)) {
  for (const [name, lines, expected] of cases) {
    check(key, name, lines, expected);
  }
}
