// ===== 설정 =====
const ARRAY_SIZE = 30;  // 막대 개수
const MIN_VALUE = 5;    // 가장 작은 값
const MAX_VALUE = 100;  // 가장 큰 값
const STEP_DELAY = 30;  // 한 단계를 보여주는 시간 (밀리초). #4에서 슬라이더로 바꿀 수 있게 한다.

// ===== 화면 요소 가져오기 =====
const barsContainer = document.getElementById('bars');
const newArrayBtn = document.getElementById('new-array-btn');
const startBtn = document.getElementById('start-btn');

// ===== 상태 =====
let array = [];      // 지금 화면에 그려진 배열 (재생하면서 실제로 바뀐다)
let steps = [];      // 정렬 알고리즘이 기록한 단계 목록
let stepIndex = 0;   // 다음에 재생할 단계 번호
let timerId = null;  // 재생 타이머. null이면 재생 중이 아니다.

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

// 막대 하나의 높이를 값에 맞춘다.
// 값이 MAX_VALUE면 영역 높이의 100%, 절반이면 50%가 된다.
function setBarHeight(bar, value) {
  bar.style.height = `${(value / MAX_VALUE) * 100}%`;
  bar.title = value; // 마우스를 올리면 값이 보인다
}

// 배열 값을 막대로 그린다.
function renderBars(values) {
  barsContainer.innerHTML = ''; // 이전 막대 지우기

  for (const value of values) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    setBarHeight(bar, value);
    barsContainer.appendChild(bar);
  }
}

// ===== 재생 =====

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
    bars[step.i].classList.add('compare');
    bars[step.j].classList.add('compare');
  } else if (step.type === 'swap') {
    // 데이터(array)를 먼저 바꾸고, 그 값에 맞춰 두 막대 높이를 다시 그린다.
    [array[step.i], array[step.j]] = [array[step.j], array[step.i]];
    setBarHeight(bars[step.i], array[step.i]);
    setBarHeight(bars[step.j], array[step.j]);
    bars[step.i].classList.add('swap');
    bars[step.j].classList.add('swap');
  } else if (step.type === 'sorted') {
    bars[step.index].classList.add('sorted');
  }
}

// 다음 단계를 보여주고, STEP_DELAY 뒤에 자기 자신을 다시 부른다.
// setInterval 대신 setTimeout을 이어 붙이는 방식이라 #4에서 일시정지·속도 조절을 붙이기 쉽다.
function playNextStep() {
  if (stepIndex >= steps.length) {
    finishPlayback();
    return;
  }
  applyStep(steps[stepIndex]);
  stepIndex++;
  timerId = setTimeout(playNextStep, STEP_DELAY);
}

// 재생이 끝났을 때
function finishPlayback() {
  timerId = null;
  clearHighlights();
  for (const bar of barsContainer.children) {
    bar.classList.add('sorted'); // 정렬 완료: 전체 막대를 완료 색으로
  }
  // 이미 정렬된 배열을 또 정렬할 필요는 없으니 '새 배열'을 누를 때까지 시작 버튼을 끈다.
  startBtn.disabled = true;
}

// 재생 중이면 멈춘다.
function stopPlayback() {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

// '시작' 버튼: 지금 배열로 단계를 기록하고 처음부터 재생한다.
function startSorting() {
  if (timerId !== null) return; // 이미 재생 중이면 무시

  steps = bubbleSortSteps(array);
  stepIndex = 0;
  startBtn.disabled = true;
  playNextStep();
}

// '새 배열' 버튼: 재생 중이었다면 멈추고, 새 배열로 처음 상태를 만든다.
function resetArray() {
  stopPlayback();
  array = createRandomArray(ARRAY_SIZE);
  steps = [];
  stepIndex = 0;
  renderBars(array);
  startBtn.disabled = false;
}

newArrayBtn.addEventListener('click', resetArray);
startBtn.addEventListener('click', startSorting);

// 페이지가 열리면 바로 한 번 그린다.
resetArray();
