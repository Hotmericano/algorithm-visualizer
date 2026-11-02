// ===== 입력 처리 =====

const INPUT_MIN_COUNT = 2;    // 최소 개수
const INPUT_MAX_COUNT = 50;   // 최대 개수 (더 많으면 막대가 너무 가늘어진다)
const INPUT_MAX_VALUE = 999;  // 각 값의 최댓값

// 사용자가 입력한 글자를 숫자 배열로 바꾼다.
// "5, 3, 8 1"처럼 쉼표나 띄어쓰기로 구분한다.
// 성공하면 { values: [5, 3, 8, 1] }, 실패하면 { error: '이유' }를 돌려준다.
function parseArrayInput(text) {
  // 쉼표·공백이 하나 이상 이어진 곳을 기준으로 자르고, 빈 조각은 버린다.
  const tokens = text.trim().split(/[\s,]+/).filter(Boolean);

  if (tokens.length === 0) {
    return { error: '숫자를 입력해 주세요.' };
  }

  const values = [];
  for (const token of tokens) {
    // ^\d+$ : 처음부터 끝까지 숫자로만 이뤄져 있는가 (음수, 소수점은 안 됨)
    if (!/^\d+$/.test(token)) {
      return { error: `"${token}"은(는) 0 이상의 정수가 아니에요.` };
    }
    const value = Number(token);
    if (value > INPUT_MAX_VALUE) {
      return { error: `각 숫자는 ${INPUT_MAX_VALUE} 이하로 입력해 주세요. ("${token}")` };
    }
    values.push(value);
  }

  if (values.length < INPUT_MIN_COUNT) {
    return { error: `숫자를 ${INPUT_MIN_COUNT}개 이상 입력해 주세요.` };
  }
  if (values.length > INPUT_MAX_COUNT) {
    return { error: `숫자는 ${INPUT_MAX_COUNT}개까지 넣을 수 있어요. (지금 ${values.length}개)` };
  }

  return { values };
}

// node로 테스트할 때 불러올 수 있게 내보낸다. (브라우저에서는 무시된다)
if (typeof module !== 'undefined') {
  module.exports = { parseArrayInput };
}
