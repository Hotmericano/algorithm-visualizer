// ===== 설정 =====
const ARRAY_SIZE = 30; // 막대 개수
const MIN_VALUE = 5;   // 가장 작은 값
const MAX_VALUE = 100; // 가장 큰 값

// ===== 화면 요소 가져오기 =====
const barsContainer = document.getElementById('bars');
const newArrayBtn = document.getElementById('new-array-btn');

// 지금 화면에 그려진 배열
let array = [];

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

// 배열 값을 막대로 그린다.
// 값이 MAX_VALUE면 영역 높이의 100%, 절반이면 50%가 된다.
function renderBars(values) {
  barsContainer.innerHTML = ''; // 이전 막대 지우기

  for (const value of values) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${(value / MAX_VALUE) * 100}%`;
    bar.title = value; // 마우스를 올리면 값이 보인다
    barsContainer.appendChild(bar);
  }
}

// 새 배열을 만들고 다시 그린다.
function resetArray() {
  array = createRandomArray(ARRAY_SIZE);
  renderBars(array);

  // #2: 버블 정렬 단계를 기록해서 콘솔에 출력한다. (F12 → Console 탭에서 확인)
  // 화면 재생은 #3에서 붙인다.
  const steps = bubbleSortSteps(array);
  const count = (type) => steps.filter((s) => s.type === type).length;
  console.log(
    `버블 정렬 단계 ${steps.length}개 ` +
      `(비교 ${count('compare')}, 교환 ${count('swap')}, 확정 ${count('sorted')})`
  );
  console.log('처음 10단계:', steps.slice(0, 10));
}

newArrayBtn.addEventListener('click', resetArray);

// 페이지가 열리면 바로 한 번 그린다.
resetArray();
