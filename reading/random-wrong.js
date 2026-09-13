(async function () {
  const loadingMsg = document.getElementById('loading-msg');
  const notConfigured = document.getElementById('not-configured');
  const emptyAll = document.getElementById('empty-all');
  const secP1 = document.getElementById('section-p1');
  const secP23 = document.getElementById('section-p23');
  const secP4 = document.getElementById('section-p4');

  if (!window.SheetClient.isConfigured()) {
    loadingMsg.classList.add('hidden');
    notConfigured.classList.remove('hidden');
    return;
  }

  let rows, stats;
  try {
    [rows, stats] = await Promise.all([
      window.SheetClient.fetchQuestions(),
      window.SheetClient.fetchWrongStats(),
    ]);
  } catch (e) {
    loadingMsg.textContent = 'Không kết nối được Google Sheet (' + e.message + '). Kiểm tra lại URL trong trang Cài đặt.';
    return;
  }

  const statMap = {};
  (stats || []).forEach(function (s) { statMap[String(s.id)] = s; });
  function dueOf(id) {
    const s = statMap[String(id)];
    return s ? Number(s.due) || 0 : 0;
  }

  function groupBy(list, keyFn) {
    const map = {};
    list.forEach(function (r) { (map[keyFn(r)] = map[keyFn(r)] || []).push(r); });
    return map;
  }
  function sortById(items) {
    return items.slice().sort(function (a, b) {
      return Number(String(a.id).split('-').pop()) - Number(String(b.id).split('-').pop());
    });
  }
  function stripGroupPrefix(text) {
    return String(text || '').replace(/^\[[^\]]*\]\s*/, '');
  }

  // ---- Part 1: các lá thư (mỗi lá thư là 1 "nhóm", nợ tính theo cả lá thư) ----
  const p1rows = (rows || []).filter(function (r) { return Number(r.part) === 1; });
  const p1ByGroup = groupBy(p1rows, function (r) { return r.group; });
  const p1Letters = Object.keys(p1ByGroup).map(function (g) {
    const items = sortById(p1ByGroup[g]);
    return {
      id: 'p1:' + g,
      group: g,
      text: items[0].q,
      blanks: items.map(function (it) { return { id: it.id, answer: it.answer, options: it.options }; }),
    };
  }).filter(function (L) { return dueOf(L.id) > 0; });

  // ---- Part 2: sắp xếp câu (mỗi chủ đề là 1 "nhóm") ----
  const p2rows = (rows || []).filter(function (r) { return Number(r.part) === 2; });
  const p2ByGroup = groupBy(p2rows, function (r) { return r.group; });
  const p2Groups = Object.keys(p2ByGroup).map(function (g) {
    const items5 = sortById(p2ByGroup[g]);
    const candidates = items5[0].options;
    const idFor = {}, posFor = {};
    items5.forEach(function (r, idx) { idFor[r.answer] = r.id; posFor[r.answer] = String(idx + 1); });
    const m = (items5[0].desc || '').match(/cả đoạn:\s*([^\u2192]+)\u2192/);
    const sentence0 = m ? m[1].trim() : '';
    return {
      id: 'p2:' + g,
      title: g,
      numbered: true,
      intro: sentence0 ? `Câu mở đầu (đã cho sẵn, không cần chọn): "${sentence0}"` : '',
      items: candidates.map(function (s) {
        return { id: idFor[s] || (g + '-' + s), label: s, options: ['1', '2', '3', '4', '5'], answer: posFor[s] };
      }),
    };
  }).filter(function (G) { return dueOf(G.id) > 0; });

  // ---- Part 3: ai đã nói gì (mỗi chủ đề là 1 "nhóm") ----
  const p3rows = (rows || []).filter(function (r) { return Number(r.part) === 3; });
  const p3ByGroup = groupBy(p3rows, function (r) { return r.group; });
  const p3Groups = Object.keys(p3ByGroup).map(function (g) {
    const items = sortById(p3ByGroup[g]);
    const seen = {};
    const introParts = [];
    items.forEach(function (r) {
      if (r.desc && !seen[r.desc]) { seen[r.desc] = true; introParts.push(r.desc); }
    });
    return {
      id: 'p3:' + g,
      title: g,
      numbered: false,
      intro: introParts.join('\n\n'),
      items: items.map(function (r) {
        return { id: r.id, label: stripGroupPrefix(r.q), options: r.options, answer: r.answer };
      }),
    };
  }).filter(function (G) { return dueOf(G.id) > 0; });

  const p23Groups = p2Groups.concat(p3Groups);

  // ---- Part 4: tìm tiêu đề thừa (mỗi chủ đề vốn đã là 1 hàng = 1 "nhóm") ----
  const p4rows = (rows || []).filter(function (r) { return Number(r.part) === 4 && dueOf(r.id) > 0; });

  loadingMsg.classList.add('hidden');
  let any = false;

  if (p1Letters.length) {
    any = true;
    secP1.classList.remove('hidden');
    window.ClozeEngine.init(p1Letters, `Ôn Part 1 — ${p1Letters.length} lá thư hay quên`, {
      ids: {
        title: 'p1-quiz-title', progressFill: 'p1-progress-fill', progressInfo: 'p1-progress-info',
        letterBody: 'p1-letter-body', prevBtn: 'p1-prev-btn', nextBtn: 'p1-next-btn', grid: 'p1-nav-grid',
        quizCard: 'p1-quiz-card', navCard: 'p1-nav-card', summaryCard: 'p1-summary-card', scoreText: 'p1-score-text',
        restartBtn: 'p1-restart-btn', reviewBtn: 'p1-review-btn', finishBtn: 'p1-finish-btn',
      },
    });
  }

  if (p23Groups.length) {
    any = true;
    secP23.classList.remove('hidden');
    window.GroupEngine.init(p23Groups, `Ôn Part 2 & 3 — ${p23Groups.length} chủ đề hay quên`, {
      ids: {
        title: 'p23-quiz-title', progressFill: 'p23-progress-fill', progressInfo: 'p23-progress-info',
        groupBody: 'p23-group-body', prevBtn: 'p23-prev-btn', nextBtn: 'p23-next-btn', grid: 'p23-nav-grid',
        quizCard: 'p23-quiz-card', navCard: 'p23-nav-card', summaryCard: 'p23-summary-card', scoreText: 'p23-score-text',
        restartBtn: 'p23-restart-btn', reviewBtn: 'p23-review-btn', finishBtn: 'p23-finish-btn',
      },
    });
  }

  if (p4rows.length) {
    any = true;
    secP4.classList.remove('hidden');
    window.QuizEngine.init(p4rows, `Ôn Part 4 — ${p4rows.length} chủ đề hay quên`, {
      ids: {
        title: 'p4-quiz-title', progressFill: 'p4-progress-fill', progressInfo: 'p4-progress-info',
        qText: 'p4-q-text', options: 'p4-options', explain: 'p4-explain', prevBtn: 'p4-prev-btn', nextBtn: 'p4-next-btn',
        finishBtn: 'p4-finish-btn', grid: 'p4-nav-grid', quizCard: 'p4-quiz-card', navCard: 'p4-nav-card',
        summaryCard: 'p4-summary-card', scoreText: 'p4-score-text', restartBtn: 'p4-restart-btn', reviewBtn: 'p4-review-btn',
      },
    });
  }

  if (!any) {
    emptyAll.classList.remove('hidden');
  }
})();
