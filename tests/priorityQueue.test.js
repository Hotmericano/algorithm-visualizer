// 우선순위 큐(최소 힙) 테스트
// 실행: node tests/priorityQueue.test.js

const { MinHeap } = require('../priorityQueue.js');

function check(name, ok, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' - ' + detail}`);
  if (!ok) process.exitCode = 1;
}

// 힙의 규칙: 모든 칸에서 부모가 자식보다 먼저 나와야 한다.
function heapRuleHolds(heap) {
  for (let i = 1; i < heap.items.length; i++) {
    const parent = Math.floor((i - 1) / 2);
    if (heap.before(heap.items[i], heap.items[parent])) return false;
  }
  return true;
}

// 1. 빈 큐
{
  const h = new MinHeap();
  check('빈 큐: pop은 undefined', h.pop() === undefined && h.peek() === undefined && h.isEmpty());
}

// 2. 넣은 순서와 상관없이 작은 것부터 나온다
{
  const h = new MinHeap();
  const values = [5, 3, 8, 1, 9, 2, 7];
  for (const v of values) h.push(`값${v}`, v);
  check('peek은 가장 작은 값', h.peek() === '값1');
  const out = [];
  while (!h.isEmpty()) out.push(h.pop());
  const expected = [...values].sort((a, b) => a - b).map((v) => `값${v}`);
  check('작은 것부터 꺼내짐', JSON.stringify(out) === JSON.stringify(expected), out.join(','));
}

// 3. 우선순위가 같으면 먼저 넣은 것부터
{
  const h = new MinHeap();
  ['가', '나', '다', '라'].forEach((v) => h.push(v, 1));
  h.push('먼저', 0);
  const out = [];
  while (!h.isEmpty()) out.push(h.pop());
  check('같은 우선순위는 넣은 순서대로', out.join('') === '먼저가나다라', out.join(','));
}

// 4. 랜덤 1000개, 넣기와 꺼내기를 섞어서 정답(정렬)과 비교
{
  const h = new MinHeap();
  const reference = []; // 정답: 매번 정렬해서 맨 앞을 꺼낸다 (느리지만 확실한 방법)
  let ok = true;
  let ruleOk = true;
  for (let i = 0; i < 1000; i++) {
    if (Math.random() < 0.6 || reference.length === 0) {
      const p = Math.floor(Math.random() * 100);
      h.push(i, p);
      reference.push({ value: i, p, order: i });
    } else {
      reference.sort((a, b) => a.p - b.p || a.order - b.order);
      const expected = reference.shift().value;
      if (h.pop() !== expected) ok = false;
    }
    if (h.size !== reference.length) ok = false;
    if (!heapRuleHolds(h)) ruleOk = false;
  }
  check('랜덤 1000번: 정답과 같은 순서로 꺼내짐', ok);
  check('랜덤 1000번: 힙 규칙이 항상 지켜짐', ruleOk);
}
