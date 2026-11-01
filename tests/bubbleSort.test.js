// 버블 정렬 단계 기록이 맞는지 확인하는 테스트
// 실행: node tests/bubbleSort.test.js

const { bubbleSortSteps } = require('../algorithms.js');

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

function check(name, input) {
  const steps = bubbleSortSteps(input);
  const expected = [...input].sort((a, b) => a - b);
  const result = replay(input, steps);

  // 1. swap만 따라 했을 때 정렬돼야 한다
  const sortedOk = JSON.stringify(result) === JSON.stringify(expected);

  // 2. 모든 자리가 정확히 한 번씩 'sorted'로 확정돼야 한다
  const sortedIdx = steps.filter((s) => s.type === 'sorted').map((s) => s.index);
  const allOnce =
    sortedIdx.length === input.length && new Set(sortedIdx).size === input.length;

  // 3. 원본 배열은 바뀌면 안 된다
  const copy = [...input];
  bubbleSortSteps(input);
  const untouched = JSON.stringify(copy) === JSON.stringify(input);

  const ok = sortedOk && allOnce && untouched;
  console.log(`${ok ? '✅' : '❌'} ${name} (단계 ${steps.length}개)`);
  if (!ok) process.exitCode = 1;
}

check('랜덤 배열', [5, 3, 8, 1, 9, 2]);
check('이미 정렬됨', [1, 2, 3, 4, 5]);
check('거꾸로 정렬됨', [5, 4, 3, 2, 1]);
check('같은 값 있음', [3, 1, 3, 2, 1]);
check('원소 1개', [7]);
check('빈 배열', []);
check('랜덤 30개', Array.from({ length: 30 }, () => Math.floor(Math.random() * 96) + 5));
