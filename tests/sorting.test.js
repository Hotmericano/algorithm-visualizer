// 정렬 알고리즘 단계 기록이 맞는지 확인하는 테스트
// 실행: node tests/sorting.test.js
//
// SORT_ALGORITHMS에 등록된 알고리즘을 전부 같은 기준으로 검사한다.
// 새 알고리즘을 등록하면 테스트도 저절로 늘어난다.

const { SORT_ALGORITHMS } = require('../algorithms.js');

// 단계 목록의 swap만 그대로 따라 하면 정렬된 배열이 나와야 한다.
function replay(input, steps) {
  const arr = [...input];
  for (const step of steps) {
    if (step.type === 'swap') {
      [arr[step.i], arr[step.j]] = [arr[step.j], arr[step.i]];
    }
  }
  return arr;
}

// 모든 단계의 위치가 배열 범위 안에 있어야 한다.
function indicesInRange(steps, n) {
  const ok = (k) => Number.isInteger(k) && k >= 0 && k < n;
  return steps.every((s) => {
    if (s.type === 'compare' || s.type === 'swap') return ok(s.i) && ok(s.j);
    if (s.type === 'sorted' || s.type === 'pivot') return ok(s.index);
    if (s.type === 'range') return ok(s.from) && ok(s.to) && s.from <= s.to;
    return false; // 모르는 단계 종류
  });
}

function check(algoName, stepsFn, caseName, input) {
  const original = [...input];
  const steps = stepsFn(input);
  const expected = [...input].sort((a, b) => a - b);

  // 1. swap만 따라 했을 때 정렬돼야 한다
  const sortedOk = JSON.stringify(replay(input, steps)) === JSON.stringify(expected);

  // 2. 모든 자리가 정확히 한 번씩 'sorted'로 확정돼야 한다
  const sortedIdx = steps.filter((s) => s.type === 'sorted').map((s) => s.index);
  const allOnce = sortedIdx.length === input.length && new Set(sortedIdx).size === input.length;

  // 3. 원본 배열은 바뀌면 안 된다
  const untouched = JSON.stringify(original) === JSON.stringify(input);

  // 4. 단계의 위치가 배열 범위를 벗어나면 안 된다
  const inRange = indicesInRange(steps, input.length);

  const ok = sortedOk && allOnce && untouched && inRange;
  const count = (t) => steps.filter((s) => s.type === t).length;
  console.log(
    `${ok ? '✅' : '❌'} ${algoName} · ${caseName} ` +
      `(비교 ${count('compare')}, 교환 ${count('swap')})`
  );
  if (!ok) process.exitCode = 1;
}

const cases = [
  ['랜덤 배열', [5, 3, 8, 1, 9, 2]],
  ['이미 정렬됨', [1, 2, 3, 4, 5]],
  ['거꾸로 정렬됨', [5, 4, 3, 2, 1]],
  ['같은 값 있음', [3, 1, 3, 2, 1]],
  ['원소 1개', [7]],
  ['빈 배열', []],
  ['피벗과 같은 값 많음', [5, 5, 5, 1, 5, 9, 5]],
  ['랜덤 50개', Array.from({ length: 50 }, () => Math.floor(Math.random() * 1000))],
  ['랜덤 30개', Array.from({ length: 30 }, () => Math.floor(Math.random() * 96) + 5)],
];

for (const { name, steps } of Object.values(SORT_ALGORITHMS)) {
  for (const [caseName, input] of cases) {
    check(name, steps, caseName, input);
  }
}
