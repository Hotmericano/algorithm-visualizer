// ===== 설정 =====
const ARRAY_SIZE = 30;         // 막대 개수
const ARRAY_SIZE_MOBILE = 20;  // 좁은 화면(휴대폰)에서는 막대를 줄여서 숫자가 보이게
const MIN_VALUE = 5;    // 가장 작은 값
const MAX_VALUE = 100;  // 가장 큰 값

// ===== 화면 요소 가져오기 =====
const barsContainer = document.getElementById('bars');
const newArrayBtn = document.getElementById('new-array-btn');
const playBtn = document.getElementById('play-btn');
const stepBtn = document.getElementById('step-btn');
const speedSlider = document.getElementById('speed-slider');
const statusText = document.getElementById('status');
const algorithmSelect = document.getElementById('algorithm-select');
const compareCount = document.getElementById('compare-count');
const swapCount = document.getElementById('swap-count');
const resultsSection = document.getElementById('results');
const resultsBody = document.getElementById('results-body');
const customForm = document.getElementById('custom-form');
const customInput = document.getElementById('custom-input');
const customError = document.getElementById('custom-error');

// ===== 상태 =====
// 재생 상태(시작 전 / 재생 중 / 멈춤 / 끝)는 player.js의 재생기가 관리한다.
let array = [];        // 지금 화면에 그려진 배열 (재생하면서 실제로 바뀐다)
let initialArray = []; // 정렬하기 전 처음 배열. '다시 재생'할 때 이걸로 되돌린다.
let maxValue = 1;      // 가장 큰 값. 이 값이 막대 높이 100%가 된다.
let counts = { compare: 0, swap: 0 }; // 지금까지 재생한 비교·교환 횟수
let results = [];    // 같은 배열로 끝까지 재생한 알고리즘들의 기록 (비교표)

// min 이상 max 이하의 정수를 무작위로 하나 만든다.
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 길이가 size인 랜덤 배열을 만든다.
function createRandomArray(size) {
  const result = [];
  for (let i = 0; i < size; i++) {
    result.push(randomInt(MIN_VALUE, MAX_VALUE));
  }
  return result;
}

// 막대 하나의 높이와 숫자를 값에 맞춘다.
// 배열에서 가장 큰 값(maxValue)이 100%, 그 절반이면 50%가 된다.
function setBarHeight(bar, value) {
  bar.style.height = `${(value / maxValue) * 100}%`;
  bar.title = value; // 마우스를 올리면 값이 보인다
  bar.firstChild.textContent = value; // 막대 위 숫자
}

// 배열 값을 막대로 그린다.
function renderBars(values) {
  barsContainer.innerHTML = ''; // 이전 막대 지우기
  maxValue = Math.max(1, ...values); // 모두 0이어도 0으로 나누지 않도록 최소 1

  for (const value of values) {
    const bar = document.createElement('div');
    bar.className = 'bar';

    const label = document.createElement('span'); // 막대 위에 뜨는 숫자
    label.className = 'bar-label';
    bar.appendChild(label);

    setBarHeight(bar, value);
    barsContainer.appendChild(bar);
  }

  updateLabelMode();
}

// 막대 폭에 맞춰 숫자 표시 방식을 고른다.
//   넓으면 가로로, 조금 좁으면 작은 글씨로, 더 좁으면 세로로, 너무 좁으면 숨긴다.
function updateLabelMode() {
  const count = barsContainer.children.length;
  if (count === 0) return;
  const barWidth = barsContainer.clientWidth / count;
  barsContainer.classList.toggle('small', barWidth < 24);
  barsContainer.classList.toggle('compact', barWidth < 15);
  barsContainer.classList.toggle('tiny', barWidth < 9);
}

// ===== 단계 반영 =====

// 비교·교환 색을 지운다. (확정된 'sorted' 색은 남긴다)
function clearHighlights() {
  for (const bar of barsContainer.children) {
    bar.classList.remove('compare', 'swap');
  }
}

// 단계 하나를 화면에 반영한다.
function applyStep(step) {
  const bars = barsContainer.children;
  clearHighlights();

  if (step.type === 'compare') {
    counts.compare++;
    bars[step.i].classList.add('compare');
    bars[step.j].classList.add('compare');
  } else if (step.type === 'swap') {
    counts.swap++;
    // 데이터(array)를 먼저 바꾸고, 그 값에 맞춰 두 막대 높이를 다시 그린다.
    [array[step.i], array[step.j]] = [array[step.j], array[step.i]];
    setBarHeight(bars[step.i], array[step.i]);
    setBarHeight(bars[step.j], array[step.j]);
    // 피벗 값이 자리를 옮기면 피벗 표시도 같이 옮긴다.
    const iPivot = bars[step.i].classList.contains('pivot');
    const jPivot = bars[step.j].classList.contains('pivot');
    bars[step.i].classList.toggle('pivot', jPivot);
    bars[step.j].classList.toggle('pivot', iPivot);
    bars[step.i].classList.add('swap');
    bars[step.j].classList.add('swap');
  } else if (step.type === 'sorted') {
    bars[step.index].classList.remove('pivot'); // 피벗이 제자리에 놓이면 피벗 표시는 끝
    bars[step.index].classList.add('sorted');
  } else if (step.type === 'range') {
    // 합치고 있는 구간만 또렷하게, 나머지는 흐리게 보여준다.
    barsContainer.classList.add('has-range');
    for (let k = 0; k < bars.length; k++) {
      bars[k].classList.toggle('in-range', k >= step.from && k <= step.to);
    }
  } else if (step.type === 'pivot') {
    // 피벗 표시는 비교·교환과 달리 다음 단계에도 남아 있어야 한다.
    for (const bar of bars) bar.classList.remove('pivot');
    bars[step.index].classList.add('pivot');
  }
}

// ===== 재생 =====
// 재생·일시정지·한 단계·속도는 player.js가 맡고, 정렬 화면은 아래 세 가지만 알려 준다.
//   단계를 어떻게 만드는지 / 단계 하나를 어떻게 그리는지 / 끝나면 뭘 하는지
const sortPlayer = createPlayer({
  playBtn,
  stepBtn,
  speedSlider,
  statusText,
  // 드롭다운에서 고른 알고리즘으로 단계를 기록한다.
  buildSteps: () => SORT_ALGORITHMS[algorithmSelect.value].steps(array),
  applyStep,
  onFinish: finishSorting,
  onReplay: () => loadArray(initialArray, true), // 처음 배열로 되돌리기
  onStatus: updateCounts,
});

// 정렬이 끝났을 때
function finishSorting() {
  clearHighlights();
  barsContainer.classList.remove('has-range');
  for (const bar of barsContainer.children) {
    bar.classList.remove('pivot', 'in-range');
    bar.classList.add('sorted'); // 정렬 완료: 전체 막대를 완료 색으로
  }
  recordResult();
}

// ===== 같은 배열 비교표 =====

// 끝까지 재생한 결과를 비교표에 기록한다.
// 같은 알고리즘을 다시 재생했다면 줄을 새로 만들지 않고 덮어쓴다.
function recordResult() {
  const key = algorithmSelect.value;
  const row = {
    key,
    name: SORT_ALGORITHMS[key].name,
    compare: counts.compare,
    swap: counts.swap,
    total: sortPlayer.steps.length,
  };
  const existing = results.findIndex((r) => r.key === key);
  if (existing >= 0) results[existing] = row;
  else results.push(row);
  renderResults();
}

// 비교표를 다시 그린다. 비교 횟수가 가장 적은 줄을 강조한다.
function renderResults() {
  resultsSection.hidden = results.length === 0;
  const fewest = Math.min(...results.map((r) => r.compare));

  renderTableRows(
    resultsBody,
    results.map((r) => ({
      cells: [r.name, r.compare, r.swap, r.total],
      best: results.length > 1 && r.compare === fewest,
    })),
  );
}

// 주어진 배열로 처음 상태를 만든다. 재생 중이었다면 멈춘다.
// 랜덤 배열, 직접 입력한 배열, 다시 재생 모두 이 함수 하나를 거친다.
// keepResults가 true면 비교표를 남긴다. (같은 배열로 알고리즘만 바꾸거나 다시 재생할 때)
function loadArray(values, keepResults = false) {
  array = [...values];        // 재생하면서 바뀔 배열
  initialArray = [...values]; // 처음 상태는 따로 보관
  counts = { compare: 0, swap: 0 };
  if (!keepResults) {
    results = []; // 배열이 바뀌면 비교표도 새로 시작
    renderResults();
  }
  barsContainer.classList.remove('has-range');
  renderBars(array);
  sortPlayer.reset(); // 재생 중이었다면 멈추고 '시작' 상태로
}

// '새 배열': 랜덤 배열로 시작한다. 화면이 좁으면 막대 개수를 줄인다.
function resetArray() {
  const size = window.innerWidth < 500 ? ARRAY_SIZE_MOBILE : ARRAY_SIZE;
  loadArray(createRandomArray(size));
  customError.textContent = '';
}

// '적용': 입력한 배열로 시작한다.
function applyCustomArray(event) {
  event.preventDefault(); // form 기본 동작(페이지 새로고침) 막기

  const result = parseArrayInput(customInput.value);
  if (result.error) {
    customError.textContent = result.error;
    customInput.focus();
    return;
  }
  customError.textContent = '';
  loadArray(result.values);
}

// 비교·교환 횟수를 화면에 맞춘다. (재생기가 진행 상황을 갱신할 때 같이 부른다)
function updateCounts() {
  compareCount.textContent = counts.compare;
  swapCount.textContent = counts.swap;
}

// ===== 이벤트 연결 =====
newArrayBtn.addEventListener('click', resetArray);

customForm.addEventListener('submit', applyCustomArray);

// 드롭다운에 알고리즘 목록을 채운다.
// SORT_ALGORITHMS에 알고리즘을 추가하면 여기는 고치지 않아도 목록에 저절로 나온다.
fillAlgorithmSelect(algorithmSelect, SORT_ALGORITHMS);

// 선택한 알고리즘의 설명 패널을 채운다.
function renderInfo() {
  const a = SORT_ALGORITHMS[algorithmSelect.value];
  const byId = (id) => document.getElementById(id);

  byId('info-title').textContent = a.name;

  const list = byId('info-summary');
  list.innerHTML = '';
  for (const line of a.summary) {
    const li = document.createElement('li');
    li.textContent = line;
    list.appendChild(li);
  }

  byId('info-best').textContent = a.best;
  byId('info-average').textContent = a.average;
  byId('info-worst').textContent = a.worst;
  byId('info-space').textContent = a.space;
  byId('info-stable').textContent = a.stable ? '예' : '아니요';
  byId('info-note').textContent = a.note || ''; // 메모가 없으면 비워서 숨긴다
}

// 알고리즘을 바꾸면 같은 처음 배열로 되돌린다.
// 그래서 배열은 그대로 두고 알고리즘만 바꿔 가며 비교할 수 있다.
algorithmSelect.addEventListener('change', () => {
  loadArray(initialArray, true);
  renderInfo();
});
renderInfo();

// 창 크기가 바뀌면 막대 폭도 바뀌니까 숫자 표시 방식을 다시 고른다.
window.addEventListener('resize', updateLabelMode);

// 페이지가 열리면 바로 한 번 그린다.
resetArray();
