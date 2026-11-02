// tests 폴더의 모든 테스트를 한 번에 실행한다.
// 실행: node tests/run-all.js
//
// 하나라도 실패하면 마지막에 실패한 파일 이름을 보여주고, 종료 코드 1로 끝난다.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = fs
  .readdirSync(__dirname)
  .filter((name) => name.endsWith('.test.js'))
  .sort();

const failed = [];
for (const file of files) {
  console.log(`\n=== ${file} ===`);
  try {
    // 테스트 파일의 출력을 그대로 보여준다.
    execFileSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  } catch {
    failed.push(file); // 테스트가 process.exitCode = 1로 끝나면 여기로 온다
  }
}

console.log('');
if (failed.length === 0) {
  console.log(`✅ 테스트 파일 ${files.length}개 모두 통과`);
} else {
  console.log(`❌ 실패한 파일: ${failed.join(', ')}`);
  process.exitCode = 1;
}
