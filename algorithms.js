// ===== 정렬 알고리즘 =====
// 각 함수는 배열을 직접 정렬하지 않고, 정렬하면서 일어난 일을 "단계(step)" 목록으로 돌려준다.
// 화면은 나중에 이 목록을 하나씩 꺼내서 재생한다. (#3)
//
// 단계의 종류
//   { type: 'compare', i, j }  i번째와 j번째 값을 비교했다
//   { type: 'swap', i, j }     i번째와 j번째 값을 바꿨다
//   { type: 'sorted', index }  index번째 자리는 이제 최종 위치로 확정됐다
//   { type: 'pivot', index }   index번째 값을 피벗(기준값)으로 골랐다 (퀵 정렬)
//   { type: 'range', from, to } from ~ to 구간을 합치기 시작했다 (병합 정렬)

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

// 퀵 정렬
// 기준값(피벗) 하나를 골라서, 피벗보다 작은 값은 왼쪽, 큰 값은 오른쪽으로 나눈다(분할).
// 그러면 피벗은 최종 위치에 놓이고, 왼쪽과 오른쪽 구간을 각각 같은 방법으로 다시 정렬한다(재귀).
// 여기서는 구간의 맨 오른쪽 값을 피벗으로 쓰는 로무토(Lomuto) 분할을 쓴다.
function quickSortSteps(input) {
  const arr = [...input];
  const steps = [];

  function swap(i, j) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
    steps.push({ type: 'swap', i, j });
  }

  // lo ~ hi 구간을 정렬한다.
  function sort(lo, hi) {
    if (lo > hi) return; // 빈 구간
    if (lo === hi) {
      steps.push({ type: 'sorted', index: lo }); // 값이 하나면 이미 제자리
      return;
    }

    const pivotIndex = partition(lo, hi);
    sort(lo, pivotIndex - 1);  // 피벗 왼쪽 (피벗보다 작은 값들)
    sort(pivotIndex + 1, hi);  // 피벗 오른쪽 (피벗보다 크거나 같은 값들)
  }

  // 맨 오른쪽 값을 피벗으로 삼아 나누고, 피벗이 놓인 최종 위치를 돌려준다.
  function partition(lo, hi) {
    steps.push({ type: 'pivot', index: hi });

    // store: "피벗보다 작은 값"을 다음에 놓을 자리
    let store = lo;
    for (let j = lo; j < hi; j++) {
      steps.push({ type: 'compare', i: j, j: hi });
      if (arr[j] < arr[hi]) {
        if (store !== j) swap(store, j);
        store++;
      }
    }

    // 피벗을 작은 값들 바로 뒤로 옮기면, 그 자리가 피벗의 최종 위치다.
    if (store !== hi) swap(store, hi);
    steps.push({ type: 'sorted', index: store });
    return store;
  }

  sort(0, arr.length - 1);
  return steps;
}

// 병합 정렬
// 배열을 반으로, 또 반으로 나눠서 값이 하나씩 남을 때까지 쪼갠 다음(분할),
// 정렬된 두 구간을 앞에서부터 비교하며 하나로 합친다(병합). 이걸 거꾸로 올라가며 반복한다.
//
// 실제 병합 정렬은 보조 배열에 값을 옮겨 담으며 합친다.
// 여기서는 화면의 막대가 항상 실제 값과 일치하도록, 오른쪽 값이 더 작을 때
// 그 값을 이웃 교환으로 왼쪽 자리까지 밀어 넣는 "제자리 병합"을 쓴다.
// 그래서 비교 횟수는 실제 병합 정렬과 같지만, 교환 횟수는 더 많게 나온다.
function mergeSortSteps(input) {
  const arr = [...input];
  const steps = [];

  function swap(i, j) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
    steps.push({ type: 'swap', i, j });
  }

  // lo ~ hi 구간을 정렬한다.
  function sort(lo, hi) {
    if (lo >= hi) return; // 값이 하나 이하면 이미 정렬돼 있다
    const mid = Math.floor((lo + hi) / 2);
    sort(lo, mid);       // 왼쪽 절반
    sort(mid + 1, hi);   // 오른쪽 절반
    merge(lo, mid, hi);  // 둘을 합친다
  }

  // 정렬된 두 구간 [lo ~ mid]와 [mid+1 ~ hi]를 하나로 합친다.
  function merge(lo, mid, hi) {
    steps.push({ type: 'range', from: lo, to: hi });

    let i = lo;      // 왼쪽 구간에서 다음에 볼 값
    let j = mid + 1; // 오른쪽 구간에서 다음에 볼 값

    while (i <= mid && j <= hi) {
      steps.push({ type: 'compare', i, j });
      if (arr[i] <= arr[j]) {
        i++; // 왼쪽 값이 작거나 같으면 이미 제자리
      } else {
        // 오른쪽 값이 더 작다 → i 자리까지 한 칸씩 밀어 넣는다.
        for (let k = j; k > i; k--) swap(k - 1, k);
        // 왼쪽 구간 전체가 한 칸씩 오른쪽으로 밀렸다.
        i++;
        mid++;
        j++;
      }
    }
  }

  sort(0, arr.length - 1);

  // 마지막 병합이 끝나야 비로소 모든 자리가 확정된다.
  for (let k = 0; k < arr.length; k++) {
    steps.push({ type: 'sorted', index: k });
  }
  return steps;
}

// 화면의 드롭다운에서 고를 수 있는 정렬 알고리즘 목록
// 새 알고리즘을 만들면 여기에 하나만 추가하면 드롭다운, 설명 패널, 테스트에 저절로 들어간다.
//
//   name     드롭다운에 보이는 이름
//   steps    단계 목록을 만드는 함수
//   summary  동작 원리 설명 (한 줄씩)
//   best / average / worst  시간 복잡도 (최선 / 평균 / 최악)
//   space    추가로 필요한 메모리
//   stable   안정 정렬인가 (같은 값끼리 원래 순서가 유지되는가)
//   note     이 사이트에서 보여주는 방식에 대한 메모 (없으면 생략)
const SORT_ALGORITHMS = {
  bubble: {
    name: '버블 정렬',
    steps: bubbleSortSteps,
    summary: [
      '이웃한 두 값을 비교해서 큰 값을 오른쪽으로 보냅니다.',
      '한 바퀴마다 가장 큰 값이 맨 끝에 확정돼요. 한 바퀴 동안 교환이 없으면 일찍 끝냅니다.',
    ],
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
  },
  selection: {
    name: '선택 정렬',
    steps: selectionSortSteps,
    summary: [
      '남은 구간에서 가장 작은 값을 찾아 맨 앞 자리와 바꿉니다.',
      '한 바퀴마다 맨 앞 자리가 하나씩 확정되고, 교환은 한 바퀴에 최대 1번이에요.',
    ],
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: false,
  },
  insertion: {
    name: '삽입 정렬',
    steps: insertionSortSteps,
    summary: [
      '왼쪽 구간을 정렬된 상태로 두고, 새 값을 하나씩 꺼내 알맞은 자리까지 왼쪽으로 옮깁니다.',
      '카드 패를 정리하는 방식이에요. 거의 정렬된 배열에서는 아주 빠릅니다.',
    ],
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
  },
  quick: {
    name: '퀵 정렬',
    steps: quickSortSteps,
    summary: [
      '피벗(기준값)을 하나 골라 작은 값은 왼쪽, 큰 값은 오른쪽으로 나눕니다. 그러면 피벗 자리가 확정돼요.',
      '왼쪽과 오른쪽 구간을 같은 방법으로 다시 정렬합니다(재귀). 실제로 가장 많이 쓰이는 정렬 중 하나예요.',
    ],
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    stable: false,
    note:
      '맨 오른쪽 값을 피벗으로 쓰기 때문에, 이미 정렬된 배열을 넣으면 매번 한쪽으로만 나뉘어 최악(O(n²))이 됩니다. 직접 입력으로 확인해 보세요.',
  },
  merge: {
    name: '병합 정렬',
    steps: mergeSortSteps,
    summary: [
      '배열을 반으로, 또 반으로 쪼개서 값이 하나씩 남을 때까지 나눕니다.',
      '정렬된 두 구간을 앞에서부터 비교하며 하나로 합치는 걸 거꾸로 올라가며 반복해요. 입력과 상관없이 항상 O(n log n)입니다.',
    ],
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    stable: true,
    note:
      '실제 병합 정렬은 보조 배열에 옮겨 담으며 합칩니다. 이 사이트는 막대가 실제 값과 항상 맞도록 이웃 교환으로 밀어 넣는 방식이라, 비교 횟수는 같지만 교환 횟수는 더 많게 나와요.',
  },
};

// node로 테스트할 때 불러올 수 있게 내보낸다. (브라우저에서는 무시된다)
if (typeof module !== 'undefined') {
  module.exports = {
    bubbleSortSteps,
    selectionSortSteps,
    insertionSortSteps,
    quickSortSteps,
    mergeSortSteps,
    SORT_ALGORITHMS,
  };
}
