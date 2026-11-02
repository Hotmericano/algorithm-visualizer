// ===== 우선순위 큐 (최소 힙) =====
// 큐(BFS)는 "먼저 넣은 것"을 먼저 꺼낸다.
// 우선순위 큐는 "우선순위 값이 가장 작은 것"을 먼저 꺼낸다. 다익스트라와 A*가 이걸 쓴다.
//
// 매번 전체를 정렬하면 느리니까 힙(heap)이라는 구조를 쓴다.
// 힙은 배열에 저장한 이진 트리이고, "부모는 항상 자식보다 작거나 같다"는 규칙만 지킨다.
//   i번째 칸의 부모: Math.floor((i - 1) / 2)
//   i번째 칸의 자식: 2i + 1, 2i + 2
// 그러면 가장 작은 값은 항상 맨 앞(0번)에 있고,
// 넣기·꺼내기는 트리 높이(log n)만큼만 자리를 바꾸면 된다.
//
// 우선순위가 같으면 먼저 넣은 것을 먼저 꺼낸다. (화면에서 탐색 순서가 매번 같게 나오도록)

class MinHeap {
  constructor() {
    this.items = []; // { value, priority, order }
    this.counter = 0; // 넣은 순서 번호 (우선순위가 같을 때 비교용)
  }

  get size() {
    return this.items.length;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  // a가 b보다 먼저 나와야 하면 true
  before(a, b) {
    if (a.priority !== b.priority) return a.priority < b.priority;
    return a.order < b.order;
  }

  swap(i, j) {
    [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
  }

  // 값을 넣는다: 맨 끝에 붙이고, 부모보다 작으면 위로 올린다.
  push(value, priority) {
    this.items.push({ value, priority, order: this.counter++ });

    let i = this.items.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (!this.before(this.items[i], this.items[parent])) break; // 규칙을 지키면 멈춤
      this.swap(i, parent);
      i = parent;
    }
  }

  // 가장 작은 값을 꺼낸다: 맨 앞을 꺼내고, 맨 끝 값을 맨 앞에 놓은 뒤 아래로 내린다.
  // 비어 있으면 undefined
  pop() {
    if (this.items.length === 0) return undefined;

    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;

      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let smallest = i;
        if (left < this.items.length && this.before(this.items[left], this.items[smallest])) {
          smallest = left;
        }
        if (right < this.items.length && this.before(this.items[right], this.items[smallest])) {
          smallest = right;
        }
        if (smallest === i) break; // 두 자식보다 작거나 같으면 제자리
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top.value;
  }

  // 꺼내지 않고 가장 작은 값만 본다.
  peek() {
    return this.items.length > 0 ? this.items[0].value : undefined;
  }
}

// node로 테스트할 때 불러올 수 있게 내보낸다. (브라우저에서는 무시된다)
if (typeof module !== 'undefined') {
  module.exports = { MinHeap };
}
