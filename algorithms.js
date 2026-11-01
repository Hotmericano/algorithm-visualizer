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

// node로 테스트할 때 불러올 수 있게 내보낸다. (브라우저에서는 무시된다)
if (typeof module !== 'undefined') {
  module.exports = { bubbleSortSteps };
}
