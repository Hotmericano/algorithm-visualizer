// ===== 탭 전환 =====
// 정렬 화면과 길찾기 화면 중 하나만 보여준다.
// 주소 끝에 #path를 붙이면(예: .../algorithm-visualizer/#path) 길찾기 화면으로 바로 열린다.

const tabs = document.querySelectorAll('.tab');
const views = {
  sort: document.getElementById('sort-view'),
  path: document.getElementById('path-view'),
};

function showView(name) {
  if (!views[name]) name = 'sort'; // 모르는 이름이면 정렬 화면

  for (const tab of tabs) {
    tab.setAttribute('aria-selected', String(tab.dataset.view === name));
  }
  for (const [key, view] of Object.entries(views)) {
    view.hidden = key !== name;
  }

  // 화면이 바뀌었다고 알린다. grid.js는 이걸 듣고 격자 크기를 맞춘다.
  // (숨겨져 있는 동안에는 폭이 0이라 크기를 잴 수 없기 때문)
  document.dispatchEvent(new CustomEvent('viewchange', { detail: name }));
}

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    const name = tab.dataset.view;
    // 주소의 #부분을 바꾼다. 새로고침하거나 링크를 공유해도 같은 화면이 열린다.
    history.replaceState(null, '', name === 'sort' ? location.pathname : `#${name}`);
    showView(name);
  });
}

showView(location.hash.slice(1));
