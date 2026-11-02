// ===== 정렬 알고리즘 =====
// 각 함수는 배열을 직접 정렬하지 않고, 정렬하면서 일어난 일을 "단계(step)" 목록으로 돌려준다.
// 화면은 나중에 이 목록을 하나씩 꺼내서 재생한다. (#3)
//
// 단계의 종류
//   { type: 'compare', i, j }  i번째와 j번째 값을 비교했다
//   { type: 'swap', i, j }     i번째와 j번째 값을 바꿨다
//   { type: 'sorted', index }  index번째 자리는 이제 최종 위치로 확정됐다

// 버블 정렬
// 이웃한 두 값을 비교해서 큰 값을 오른쪽으로 보낸다.
// 한 바퀴(pass)를 돌 때마다 가장 큰 값이 맨 끝으로 "떠오른다" (그래서 버블).
function bubbleSortSteps(input) {
  const arr = [...input]; // 원본을 건드리지 않도록 복사본으로 정렬한다
  const steps = [];
  const n = arr.length;

  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;

    // 이번 바퀴에서 볼 범위: 뒤쪽 pass개는 이미 확정됐으니 제외
    for (let j = 0; j < n - 1 - pass; j++) {
      steps.push({ type: 'compare', i: j, j: j + 1 });

      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; // 두 값 바꾸기
        steps.push({ type: 'swap', i: j, j: j + 1 });
        swapped = true;
      }
    }

    // 이번 바퀴에서 가장 큰 값이 맨 끝 자리로 확정됐다
    steps.push({ type: 'sorted', index: n - 1 - pass });

    // 한 번도 안 바꿨다면 이미 정렬된 상태라서 더 돌 필요가 없다
    if (!swapped) {
      for (let k = n - 2 - pass; k >= 0; k--) {
        steps.push({ type: 'sorted', index: k });
      }
      return steps;
    }
  }

  // 마지막으로 남은 맨 앞 자리도 확정
  if (n > 0) steps.push({ type: 'sorted', index: 0 });
  return steps;
}

// 선택 정렬
// 아직 정렬되지 않은 구간에서 가장 작은 값을 "선택"해서 맨 앞 자리와 바꾼다.
// 한 바퀴마다 맨 앞 자리 하나가 확정된다. (버블 정렬은 맨 뒤부터, 선택 정렬은 맨 앞부터)
// 교환은 한 바퀴에 최대 1번이라 교환 횟수가 아주 적다.
function selectionSortSteps(input) {
  const arr = [...input];
  const steps = [];
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let minIndex = i; // 지금까지 찾은 가장 작은 값의 위치

    for (let j = i + 1; j < n; j++) {
      // "지금까지 가장 작은 값"과 j번째를 비교한다.
      // 화면에서는 노란 막대 하나가 최솟값 후보로 남아 있고, 다른 하나가 오른쪽으로 훑고 지나간다.
      steps.push({ type: 'compare', i: minIndex, j });
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
      }
    }

    // 가장 작은 값이 이미 제자리가 아니라면 맨 앞 자리와 바꾼다.
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
      steps.push({ type: 'swap', i, j: minIndex });
    }

    steps.push({ type: 'sorted', index: i });
  }

  // 마지막 하나는 저절로 가장 큰 값이 된다.
  if (n > 0) steps.push({ type: 'sorted', index: n - 1 });
  return steps;
}

// 삽입 정렬
// 카드 게임에서 손에 든 카드를 정리하는 방식이다.
// 왼쪽 구간은 항상 정렬된 상태로 유지하고, 새 값을 하나씩 꺼내 알맞은 자리까지 왼쪽으로 옮긴다.
// 거의 정렬된 배열에서는 아주 빠르다. (옮길 일이 거의 없어서)
function insertionSortSteps(input) {
  const arr = [...input];
  const steps = [];
  const n = arr.length;

  for (let i = 1; i < n; i++) {
    // i번째 값을 왼쪽 이웃과 비교하면서, 더 작으면 한 칸씩 왼쪽으로 옮긴다.
    let j = i;
    while (j > 0) {
      steps.push({ type: 'compare', i: j - 1, j });
      if (arr[j - 1] > arr[j]) {
        [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
        steps.push({ type: 'swap', i: j - 1, j });
        j--;
      } else {
        break; // 왼쪽 값이 더 작거나 같으면 여기가 제자리다
      }
    }
  }

  // 삽입 정렬은 끝나기 전까지 어느 자리도 "최종"이라고 할 수 없다.
  // (나중에 더 작은 값이 들어오면 왼쪽 값들도 한 칸씩 밀린다)
  // 그래서 모든 자리를 마지막에 한꺼번에 확정한다.
  for (let k = 0; k < n; k++) {
    steps.push({ type: 'sorted', index: k });
  }
  return steps;
}

// 화면의 드롭다운에서 고를 수 있는 정렬 알고리즘 목록
// 새 알고리즘을 만들면 여기에 한 줄만 추가하면 된다.
const SORT_ALGORITHMS = {
  bubble: { name: '버블 정렬', steps: bubbleSortSteps },
  selection: { name: '선택 정렬', steps: selectionSortSteps },
  insertion: { name: '삽입 정렬', steps: insertionSortSteps },
};

// node로 테스트할 때 불러올 수 있게 내보낸다. (브라우저에서는 무시된다)
if (typeof module !== 'undefined') {
  module.exports = {
    bubbleSortSteps,
    selectionSortSteps,
    insertionSortSteps,
    SORT_ALGORITHMS,
  };
}
