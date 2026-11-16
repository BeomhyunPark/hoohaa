// 테마 고르기. 고른 값은 이 기기에만 남는다(localStorage 'hoohaa-theme'). 기본은 볼트.
// 페이지 <head>의 짧은 인라인 스크립트가 그리기 전에 data-theme을 먼저 붙이고(번쩍임 방지),
// 이 파일은 [data-theme-pick] 자리에 동그라미 셋을 그리고 누르면 바꾼다. 모듈이 아니어도 돈다.
(function () {
  var KEY = 'hoohaa-theme';
  var THEMES = [
    { id: 'volt', name: '볼트', bg: '#0D0D0B', a: '#C8F03C' },
    { id: 'night', name: '밤하늘', bg: '#0A0F16', a: '#3DC8F5' },
    { id: 'sunset', name: '노을', bg: '#120E13', a: '#FF5C8A' },
  ];
  var byId = {}; THEMES.forEach(function (t) { byId[t.id] = t; });
  function current() { var t = document.documentElement.getAttribute('data-theme'); return byId[t] ? t : 'volt'; }
  function apply(id) {
    var t = byId[id] || byId.volt;
    document.documentElement.setAttribute('data-theme', t.id);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t.bg);
    try { localStorage.setItem(KEY, t.id); } catch (e) { /* 저장을 못 해도 이번 화면에는 적용된다 */ }
    document.querySelectorAll('[data-theme-pick] button').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.t === t.id)); b.tabIndex = b.dataset.t === t.id ? 0 : -1; });
    document.dispatchEvent(new CustomEvent('hoohaa:theme', { detail: t.id }));
  }
  function mount(box) {
    if (box.dataset.ready) return; box.dataset.ready = '1';
    var f = document.createElement('fieldset'); f.className = 'theme-pick'; f.setAttribute('role', 'radiogroup'); f.setAttribute('aria-label', '화면 색');
    var lg = document.createElement('legend'); lg.textContent = '화면 색'; f.appendChild(lg);
    THEMES.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.dataset.t = t.id; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', t.name);
      b.style.setProperty('--sw-bg', t.bg); b.style.setProperty('--sw-a', t.a);
      b.appendChild(document.createElement('i')); b.addEventListener('click', function () { apply(t.id); }); f.appendChild(b);
    });
    f.addEventListener('keydown', function (e) {
      var i = THEMES.findIndex(function (t) { return t.id === current(); }), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return; e.preventDefault(); var n = THEMES[(i + d + THEMES.length) % THEMES.length].id; apply(n); f.querySelector('[data-t="' + n + '"]').focus();
    });
    box.appendChild(f);
  }
  function init() { document.querySelectorAll('[data-theme-pick]').forEach(mount); apply(current()); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
