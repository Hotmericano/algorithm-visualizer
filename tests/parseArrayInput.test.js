// 배열 입력 처리 테스트
// 실행: node tests/parseArrayInput.test.js

const { parseArrayInput } = require('../utils.js');

function expectValues(input, expected) {
  const result = parseArrayInput(input);
  const ok = JSON.stringify(result.values) === JSON.stringify(expected);
  console.log(`${ok ? '✅' : '❌'} ${JSON.stringify(input)} → ${JSON.stringify(result)}`);
  if (!ok) process.exitCode = 1;
}

function expectError(input) {
  const result = parseArrayInput(input);
  const ok = typeof result.error === 'string' && result.values === undefined;
  console.log(`${ok ? '✅' : '❌'} ${JSON.stringify(input).slice(0, 30)} → ${result.error}`);
  if (!ok) process.exitCode = 1;
}

// 올바른 입력
expectValues('5, 3, 8, 1', [5, 3, 8, 1]);
expectValues('5 3 8 1', [5, 3, 8, 1]);
expectValues('  5,3 ,, 8\n1  ', [5, 3, 8, 1]); // 공백·쉼표가 섞여도 된다
expectValues('0, 999', [0, 999]);               // 경계값
expectValues('7, 7, 7', [7, 7, 7]);             // 같은 값

// 잘못된 입력
expectError('');
expectError('   ');
expectError('5');                 // 1개
expectError('5, abc, 3');         // 숫자 아님
expectError('5, -3');             // 음수
expectError('5, 3.5');            // 소수
expectError('5, 1000');           // 범위 초과
expectError(Array(51).fill(1).join(',')); // 51개
