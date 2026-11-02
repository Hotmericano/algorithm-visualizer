// ===== 단계 재생기 =====
// "단계 목록을 하나씩 재생한다"는 일은 정렬이든 길찾기든 똑같다.
// 다른 건 (1) 단계를 어떻게 만드는지 (2) 단계 하나를 화면에 어떻게 그리는지뿐이다.
// 그래서 공통 부분(재생·일시정지·한 단계·속도·진행 상황)을 여기 모아 두고,
// 다른 부분은 함수로 넘겨받는다.
//
// 사용법
//   const player = createPlayer({
//     playBtn, stepBtn, speedSlider, statusText,  // 화면 요소
//     buildSteps: () => [...],      // 단계 목록 만들기 (처음 재생할 때 한 번)
//     applyStep: (step) => {...},   // 단계 하나를 화면에 그리기
//     onFinish: () => {...},        // 끝까지 재생했을 때
//     onReplay: () => {...},        // 끝난 뒤 '다시 재생'을 눌렀을 때 처음 화면으로 되돌리기
//     onStatus: () => {...},        // 진행 상황을 갱신할 때 같이 할 일 (없으면 생략)
//   });
//   player.reset();  // 처음 상태로 (새 데이터를 그린 뒤 부른다)
//
// 재생 상태는 네 가지 중 하나다.
//   'idle'    아직 단계를 만들지 않았다.
//   'playing' 자동으로 재생 중
//   'paused'  중간에 멈춘 상태. 계속하거나 한 단계씩 넘길 수 있다.
//   'done'    끝까지 재생했다.

function createPlayer(options) {
  const { playBtn, stepBtn, speedSlider, statusText } = options;
  const onStatus = options.onStatus || (() => {});

  let state = 'idle';
  let steps = [];
  let stepIndex = 0;
  let timerId = null;

  // 슬라이더 값(1~100)을 한 단계 보여주는 시간(밀리초)으로 바꾼다.
  // 1이면 약 500ms(아주 느리게), 100이면 약 2ms(아주 빠르게).
  // 제곱을 써서 슬라이더 오른쪽 절반에서 속도가 더 촘촘하게 바뀌도록 했다.
  function getDelay() {
    const t = (100 - Number(speedSlider.value)) / 99; // 0(빠름) ~ 1(느림)
    return Math.round(2 + 498 * t * t);
  }

  function stopTimer() {
    clearTimeout(timerId);
    timerId = null;
  }

  // 상태가 바뀔 때마다 이 함수 하나에서 버튼 글자와 활성 여부를 정한다.
  // 여기저기서 버튼을 따로 만지면 상태와 화면이 어긋나기 쉽다.
  function setState(next) {
    state = next;
    const labels = { idle: '시작', playing: '일시정지', paused: '계속', done: '다시 재생' };
    playBtn.textContent = labels[state];
    stepBtn.disabled = state === 'playing' || state === 'done';
    updateStatus();
  }

  // 진행 상황 글자: "단계 120 / 730"
  function updateStatus() {
    statusText.textContent = steps.length === 0 ? '' : `단계 ${stepIndex} / ${steps.length}`;
    onStatus();
  }

  // 아직 단계를 만들지 않았다면 지금 만든다.
  function prepare() {
    if (state === 'idle') {
      steps = options.buildSteps();
      stepIndex = 0;
    }
  }

  function finish() {
    stopTimer();
    setState('done');
    options.onFinish();
  }

  // 다음 단계 하나를 반영한다. 마지막 단계였다면 바로 끝낸다.
  function advance() {
    if (stepIndex < steps.length) {
      options.applyStep(steps[stepIndex]);
      stepIndex++;
    }
    if (stepIndex >= steps.length) finish();
  }

  // 자동 재생: 한 단계 보여주고, 현재 속도만큼 기다렸다 다시 부른다.
  // 매번 getDelay()를 새로 읽기 때문에 재생 중에 슬라이더를 움직여도 바로 반영된다.
  function tick() {
    advance();
    if (state === 'playing') timerId = setTimeout(tick, getDelay());
  }

  function play() {
    prepare();
    setState('playing');
    tick();
  }

  function pause() {
    stopTimer();
    setState('paused');
  }

  // 한 단계 앞으로: 멈춘 상태(또는 시작 전)에서만 쓸 수 있다.
  function stepOnce() {
    prepare();
    setState('paused');
    advance();
    updateStatus();
  }

  // 처음 상태로 되돌린다. 재생 중이었다면 멈춘다.
  function reset() {
    stopTimer();
    steps = [];
    stepIndex = 0;
    setState('idle');
  }

  // 재생 버튼 하나가 상태에 따라 시작 / 일시정지 / 계속 / 다시 재생을 맡는다.
  playBtn.addEventListener('click', () => {
    if (state === 'playing') {
      pause();
    } else if (state === 'done') {
      options.onReplay(); // 처음 화면으로 되돌리고 (이 안에서 reset()이 불린다)
      play();             // 다시 재생
    } else {
      play();
    }
  });

  stepBtn.addEventListener('click', stepOnce);

  // 자동 재생 중에도 진행 상황 글자를 갱신한다.
  // (매 단계마다 갱신하면 빠른 속도에서 낭비라서, 화면이 다시 그려질 때만 한다)
  function statusLoop() {
    if (state === 'playing') updateStatus();
    requestAnimationFrame(statusLoop);
  }
  requestAnimationFrame(statusLoop);

  // 밖에서 쓸 수 있는 것들
  return {
    reset,
    get state() {
      return state;
    },
    get steps() {
      return steps;
    },
  };
}
