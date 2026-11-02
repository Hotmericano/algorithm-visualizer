// ===== 설정 =====
const ARRAY_SIZE = 30;  // 막대 개수
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
// 재생 상태는 네 가지 중 하나다.
//   'idle'    새 배열을 만든 직후. 아직 단계를 기록하지 않았다.
//   'playing' 자동으로 재생 중
//   'paused'  중간에 멈춘 상태. 계속하거나 한 단계씩 넘길 수 있다.
//   'done'    정렬이 끝났다.
let state = 'idle';
let array = [];        // 지금 화면에 그려진 배열 (재생하면서 실제로 바뀐다)
let initialArray = []; // 정렬하기 전 처음 배열. '다시 재생'할 때 이걸로 되돌린다.
let maxValue = 1;      // 가장 큰 값. 이 값이 막대 높이 100%가 된다.
let steps = [];      // 정렬 알고리즘이 기록한 단계 목록
let stepIndex = 0;   // 다음에 재생할 단계 번호
let timerId = null;  // 재생 타이머
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
//   넓으면 가로로, 좁으면 세로로, 너무 좁으면 숨긴다.
function updateLabelMode() {
  const count = barsContainer.children.length;
  if (count === 0) return;
  const barWidth = barsContainer.clientWidth / count;
  barsContainer.classList.toggle('compact', barWidth < 24);
  barsContainer.classList.toggle('tiny', barWidth < 9);
}

// ===== 속도 =====
// 슬라이더 값(1~100)을 한 단계 보여주는 시간(밀리초)으로 바꾼다.
// 1이면 약 500ms(아주 느리게), 100이면 약 2ms(아주 빠르게).
// 제곱을 써서 슬라이더 오른쪽 절반에서 속도가 더 촘촘하게 바뀌도록 했다.
function getDelay() {
  const t = (100 - Number(speedSlider.value)) / 99; // 0(빠름) ~ 1(느림)
  return Math.round(2 + 498 * t * t);
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
  } else if (step.type === 'pivot') {
    // 피벗 표시는 비교·교환과 달리 다음 단계에도 남아 있어야 한다.
    for (const bar of bars) bar.classList.remove('pivot');
    bars[step.index].classList.add('pivot');
  }
}

// 다음 단계 하나를 반영한다. 더 이상 단계가 없으면 끝낸다.
function advance() {
  if (stepIndex >= steps.length) {
    finish();
    return;
  }
  applyStep(steps[stepIndex]);
  stepIndex++;
  if (stepIndex >= steps.length) finish(); // 마지막 단계였다면 바로 완료 처리
}

// ===== 재생 흐름 =====

// 아직 단계를 기록하지 않았다면 지금 기록한다.
function prepareSteps() {
  if (state === 'idle') {
    // 드롭다운에서 고른 알고리즘으로 단계를 기록한다.
    const algorithm = SORT_ALGORITHMS[algorithmSelect.value];
    steps = algorithm.steps(array);
    stepIndex = 0;
  }
}

// 자동 재생: 한 단계 보여주고, 현재 속도만큼 기다렸다 다시 부른다.
// 매번 getDelay()를 새로 읽기 때문에 재생 중에 슬라이더를 움직여도 바로 반영된다.
function tick() {
  advance();
  if (state === 'playing') {
    timerId = setTimeout(tick, getDelay());
  }
}

function play() {
  prepareSteps();
  setState('playing');
  tick();
}

function pause() {
  clearTimeout(timerId);
  timerId = null;
  setState('paused');
}

// 한 단계 앞으로: 멈춘 상태에서만 쓸 수 있다.
function stepOnce() {
  prepareSteps();
  setState('paused');
  advance();
}

// 정렬이 끝났을 때
function finish() {
  clearTimeout(timerId);
  timerId = null;
  clearHighlights();
  for (const bar of barsContainer.children) {
    bar.classList.remove('pivot');
    bar.classList.add('sorted'); // 정렬 완료: 전체 막대를 완료 색으로
  }
  setState('done');
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
    total: steps.length,
  };
  const existing = results.findIndex((r) => r.key === key);
  if (existing >= 0) results[existing] = row;
  else results.push(row);
  renderResults();
}

// 비교표를 다시 그린다. 비교 횟수가 가장 적은 줄을 강조한다.
function renderResults() {
  resultsSection.hidden = results.length === 0;
  resultsBody.innerHTML = '';
  const fewest = Math.min(...results.map((r) => r.compare));

  for (const r of results) {
    const tr = document.createElement('tr');
    if (results.length > 1 && r.compare === fewest) tr.className = 'best';
    for (const text of [r.name, r.compare, r.swap, r.total]) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    }
    resultsBody.appendChild(tr);
  }
}

// 주어진 배열로 처음 상태를 만든다. 재생 중이었다면 멈춘다.
// 랜덤 배열, 직접 입력한 배열, 다시 재생 모두 이 함수 하나를 거친다.
// keepResults가 true면 비교표를 남긴다. (같은 배열로 알고리즘만 바꾸거나 다시 재생할 때)
function loadArray(values, keepResults = false) {
  clearTimeout(timerId);
  timerId = null;
  array = [...values];        // 재생하면서 바뀔 배열
  initialArray = [...values]; // 처음 상태는 따로 보관
  steps = [];
  stepIndex = 0;
  counts = { compare: 0, swap: 0 };
  if (!keepResults) {
    results = []; // 배열이 바뀌면 비교표도 새로 시작
    renderResults();
  }
  renderBars(array);
  setState('idle');
}

// '새 배열': 랜덤 배열로 시작한다.
function resetArray() {
  loadArray(createRandomArray(ARRAY_SIZE));
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

// ===== 버튼 모양 맞추기 =====
// 상태가 바뀔 때마다 이 함수 하나에서 버튼 글자와 활성 여부를 정한다.
// 여기저기서 버튼을 따로 만지면 상태와 화면이 어긋나기 쉽다.
function setState(next) {
  state = next;

  const labels = { idle: '시작', playing: '일시정지', paused: '계속', done: '다시 재생' };
  playBtn.textContent = labels[state];
  stepBtn.disabled = state === 'playing' || state === 'done';

  updateStatus();
}

// 진행 상황 글자("단계 120 / 730")와 비교·교환 횟수를 화면에 맞춘다.
function updateStatus() {
  statusText.textContent =
    steps.length === 0 ? '' : `단계 ${stepIndex} / ${steps.length}`;
  compareCount.textContent = counts.compare;
  swapCount.textContent = counts.swap;
}

// ===== 이벤트 연결 =====
newArrayBtn.addEventListener('click', resetArray);

customForm.addEventListener('submit', applyCustomArray);

// 드롭다운에 알고리즘 목록을 채운다.
// SORT_ALGORITHMS에 알고리즘을 추가하면 여기는 고치지 않아도 목록에 저절로 나온다.
for (const [key, algorithm] of Object.entries(SORT_ALGORITHMS)) {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = algorithm.name;
  algorithmSelect.appendChild(option);
}

// 알고리즘을 바꾸면 같은 처음 배열로 되돌린다.
// 그래서 배열은 그대로 두고 알고리즘만 바꿔 가며 비교할 수 있다.
algorithmSelect.addEventListener('change', () => {
  loadArray(initialArray, true);
});

// 창 크기가 바뀌면 막대 폭도 바뀌니까 숫자 표시 방식을 다시 고른다.
window.addEventListener('resize', updateLabelMode);

// 재생 버튼 하나가 상태에 따라 시작 / 일시정지 / 계속 / 다시 재생을 맡는다.
playBtn.addEventListener('click', () => {
  if (state === 'playing') {
    pause();
  } else if (state === 'done') {
    loadArray(initialArray, true); // 처음 배열로 되돌리고
    play();                  // 다시 재생
  } else {
    play();
  }
});

stepBtn.addEventListener('click', () => {
  stepOnce();
  updateStatus();
});

// 자동 재생 중에도 진행 상황 글자를 갱신한다.
// (매 단계마다 갱신하면 빠른 속도에서 낭비라서, 화면이 다시 그려질 때만 한다)
function statusLoop() {
  if (state === 'playing') updateStatus();
  requestAnimationFrame(statusLoop);
}
requestAnimationFrame(statusLoop);

// 페이지가 열리면 바로 한 번 그린다.
resetArray();
