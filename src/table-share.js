// 표 이미지 저장: main 안의 큰 표마다 「표 이미지 저장」 버튼 → 제목·캡션·hoohaa.run 포함 2x PNG 공유/다운로드
(function () {
  var main = document.querySelector('main'); if (!main) return;
  var tables = [].slice.call(main.querySelectorAll('table')).filter(function (t) { return t.rows.length >= 4 && !t.closest('details:not([open]) .x'); });
  if (!tables.length) return;
  var st = document.createElement('style');
  st.textContent = '.tsv{display:flex;justify-content:flex-end;margin:8px 0 14px}.tsv button{min-height:44px;padding:0 16px;border-radius:12px;border:1px solid rgba(61,200,245,.45);background:linear-gradient(180deg,#1A2636,#121B27);color:#F4F6F8;font:600 14px/1 inherit;font-family:inherit;cursor:pointer;box-shadow:0 2px 0 #070B11}.tsv button:active{transform:translateY(1px)}.tsv button[disabled]{opacity:.6}' +
    '.tsc{position:absolute;left:-10000px;top:0;width:max-content;min-width:420px;max-width:900px;padding:22px 20px 16px;background:#0B1119;color:#F4F6F8;border-radius:18px;box-sizing:border-box}.tsc h3{margin:0 0 4px;font-size:18px;line-height:1.35}.tsc .cap{margin:0 0 12px;font-size:12px;color:#A9B2BF}.tsc table{width:100%;white-space:nowrap}.tsc caption{display:none}.tsc .ft{margin-top:12px;display:flex;justify-content:space-between;font-size:12px;color:#A9B2BF}.tsc .ft b{color:#3DC8F5}';
  document.head.appendChild(st);
  var h2iP; function loadH2I() { return h2iP || (h2iP = new Promise(function (ok, no) { if (window.htmlToImage) return ok(window.htmlToImage); var s = document.createElement('script'); s.src = '/src/vendor/html-to-image.js'; s.onload = function () { ok(window.htmlToImage); }; s.onerror = function () { h2iP = null; no(new Error('h2i')); }; document.head.appendChild(s); })); }
  function titleFor(t) { var cap = t.querySelector('caption'); if (cap) return cap.textContent.trim(); var n = t.closest('.tw,details') || t; while (n && n !== main) { var p = n.previousElementSibling; while (p) { if (/^H[1-3]$/.test(p.tagName)) return p.textContent.trim(); var h = p.querySelector && p.querySelector('h1,h2,h3,summary'); if (h && p.tagName !== 'TABLE') { var all = p.querySelectorAll('h1,h2,h3'); if (all.length) return all[all.length - 1].textContent.trim(); } p = p.previousElementSibling; } n = n.parentElement; } var h1 = document.querySelector('h1'); return h1 ? h1.textContent.trim() : document.title; }
  tables.forEach(function (t, i) {
    var anchor = t.closest('.tw') || t; var w = document.createElement('div'); w.className = 'tsv';
    var b = document.createElement('button'); b.type = 'button'; b.textContent = '표 이미지 저장'; b.setAttribute('data-tsv', i); w.appendChild(b); anchor.after(w);
    b.addEventListener('click', async function () {
      b.disabled = true; var old = b.textContent; b.textContent = '이미지 만드는 중…';
      var card = document.createElement('div'); card.className = 'tsc ' + (main.className || '');
      var title = titleFor(t);
      card.innerHTML = '<h3></h3><p class="cap">같은 성별 러너 기록 분포 기준 · VDOT 계산</p>';
      card.querySelector('h3').textContent = title;
      card.appendChild(t.cloneNode(true));
      card.insertAdjacentHTML('beforeend', '<div class="ft"><span>내 티어 확인하기</span><b>hoohaa.run</b></div>');
      main.appendChild(card);
      try {
        var h = await loadH2I(); if (document.fonts && document.fonts.ready) await document.fonts.ready;
        var blob = await h.toBlob(card, { pixelRatio: 2, backgroundColor: '#0B1119', width: card.offsetWidth, height: card.offsetHeight, style: { position: 'static', left: '0', top: '0', margin: '0' } });
        var name = 'hoohaa-' + (location.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home') + '-' + (i + 1) + '.png';
        var file = new File([blob], name, { type: 'image/png' }); var done = false;
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: title }); done = true; } catch (e) { if (e.name === 'AbortError') done = true; } }
        if (!done) { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }
        b.textContent = '저장했어요';
      } catch (e) { b.textContent = '다시 시도해 주세요'; }
      card.remove(); setTimeout(function () { b.textContent = old; b.disabled = false; }, 1800);
    });
  });
})();
