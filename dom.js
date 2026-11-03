// ===== 화면 공통 도우미 =====
// 정렬 화면(main.js)과 길찾기 화면(grid.js)이 똑같이 하는 일을 모아 둔다.
// 한 곳에 있으니 표 모양을 바꾸고 싶을 때도 여기만 고치면 된다.

// 알고리즘 목록으로 드롭다운(select)을 채운다.
// algorithms는 { key: { name, ... } } 모양의 객체 (SORT_ALGORITHMS, PATH_ALGORITHMS)
// 목록에 알고리즘을 추가하면 드롭다운에도 저절로 나온다.
function fillAlgorithmSelect(select, algorithms) {
  for (const [key, algorithm] of Object.entries(algorithms)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = algorithm.name;
    select.appendChild(option);
  }
}

// 비교표의 본문(tbody)을 새로 그린다.
// rows: [{ cells: ['이름', 12, 34], best: true }, ...]
//   cells  한 줄에 들어갈 칸들의 글자
//   best   true면 그 줄을 강조한다
function renderTableRows(tbody, rows) {
  tbody.innerHTML = '';
  for (const row of rows) {
    const tr = document.createElement('tr');
    if (row.best) tr.className = 'best';
    for (const text of row.cells) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}
