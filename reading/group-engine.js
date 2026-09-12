// Dùng cho Part 2, 3, 4: gộp các câu cùng 1 nhóm (chủ đề) vào 1 trang,
// mỗi câu có 1 dropdown chọn đáp án ngay bên cạnh — giống bố cục trong Word.
window.GroupEngine = (function () {
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // groups: [{ title, intro, items: [{id, label, options, answer}] }]
  function init(groups, pageTitle) {
    function freshGroups() {
      return groups.map(function (g) {
        return {
          title: g.title,
          intro: g.intro,
          numbered: g.numbered,
          items: shuffle(g.items).map(function (it) {
            return { id: it.id, label: it.label, answer: it.answer, options: shuffle(it.options), chosen: undefined };
          }),
        };
      });
    }

    let data = freshGroups();
    const total = data.length;
    let current = 0;

    const el = {
      title: document.getElementById('quiz-title'),
      progressFill: document.getElementById('progress-fill'),
      progressInfo: document.getElementById('progress-info'),
      groupBody: document.getElementById('group-body'),
      prevBtn: document.getElementById('prev-btn'),
      nextBtn: document.getElementById('next-btn'),
      grid: document.getElementById('nav-grid'),
      quizCard: document.getElementById('quiz-card'),
      summaryCard: document.getElementById('summary-card'),
      scoreText: document.getElementById('score-text'),
      restartBtn: document.getElementById('restart-btn'),
      reviewBtn: document.getElementById('review-btn'),
      emptyState: document.getElementById('empty-state'),
    };

    if (el.title) el.title.textContent = pageTitle || 'Luyện tập';

    if (total === 0) {
      if (el.quizCard) el.quizCard.classList.add('hidden');
      const navCard = document.getElementById('nav-card');
      if (navCard) navCard.classList.add('hidden');
      if (el.emptyState) el.emptyState.classList.remove('hidden');
      return;
    }

    function groupStats(G) {
      let answered = 0, correct = 0;
      G.items.forEach(function (it) {
        if (it.chosen !== undefined) {
          answered++;
          if (String(it.chosen) === String(it.answer)) correct++;
        }
      });
      return { answered, correct, count: G.items.length };
    }

    function buildGrid() {
      el.grid.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const b = document.createElement('button');
        b.textContent = i + 1;
        b.addEventListener('click', () => { current = i; render(); });
        el.grid.appendChild(b);
      }
    }

    function updateGrid() {
      Array.from(el.grid.children).forEach((btn, i) => {
        const s = groupStats(data[i]);
        btn.classList.toggle('current', i === current);
        btn.classList.toggle('answered', s.answered === s.count);
        btn.classList.remove('correct', 'wrong');
        if (s.answered === s.count) {
          btn.classList.add(s.correct === s.count ? 'correct' : 'wrong');
        }
      });
    }

    function render() {
      const G = data[current];
      const s = groupStats(G);
      el.progressInfo.textContent = `Phần ${current + 1}/${total} · Đã trả lời ${s.answered}/${s.count} câu (đúng ${s.correct})`;
      el.progressFill.style.width = ((current + 1) / total * 100) + '%';

      el.groupBody.innerHTML = '';

      const h = document.createElement('h3');
      h.className = 'group-title';
      h.textContent = G.title;
      el.groupBody.appendChild(h);

      if (G.intro) {
        const intro = document.createElement('p');
        intro.className = 'group-intro';
        intro.textContent = G.intro;
        el.groupBody.appendChild(intro);
      }

      G.items.forEach(function (it, idx) {
        const row = document.createElement('div');
        row.className = 'group-item';

        const label = document.createElement('span');
        label.className = 'item-text';
        // Đánh số theo đúng thứ tự đang hiển thị (sau khi đã xáo trộn), không dùng số cũ gắn sẵn trong label.
        label.textContent = G.numbered ? `${idx + 1}. ${it.label}` : it.label;
        row.appendChild(label);

        const select = document.createElement('select');
        select.className = 'blank-select';
        const placeholder = document.createElement('option');
        placeholder.textContent = '— chọn —';
        placeholder.value = '';
        placeholder.disabled = true;
        placeholder.selected = it.chosen === undefined;
        select.appendChild(placeholder);
        it.options.forEach(function (opt) {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          if (it.chosen === opt) o.selected = true;
          select.appendChild(o);
        });
        if (it.chosen !== undefined) {
          select.disabled = true;
          select.classList.add(String(it.chosen) === String(it.answer) ? 'blank-correct' : 'blank-wrong');
        }
        select.addEventListener('change', function () {
          it.chosen = select.value;
          if (window.SheetClient) window.SheetClient.reportAnswer(it.id, String(it.chosen) === String(it.answer));
          render();
        });
        row.appendChild(select);

        if (it.chosen !== undefined && String(it.chosen) !== String(it.answer)) {
          const hint = document.createElement('span');
          hint.className = 'blank-hint';
          hint.textContent = ` (đúng: ${it.answer})`;
          row.appendChild(hint);
        }

        el.groupBody.appendChild(row);
      });

      el.prevBtn.disabled = current === 0;
      el.nextBtn.disabled = current === total - 1;
      updateGrid();
    }

    function showSummary() {
      let totalItems = 0, correctItems = 0, answeredItems = 0;
      data.forEach(function (G) {
        const s = groupStats(G);
        totalItems += s.count;
        correctItems += s.correct;
        answeredItems += s.answered;
      });
      el.quizCard.classList.add('hidden');
      document.getElementById('nav-card').classList.add('hidden');
      el.summaryCard.classList.remove('hidden');
      el.scoreText.innerHTML = `<div class="score">${correctItems}<small>/${totalItems}</small></div>
        <p>Đã trả lời ${answeredItems}/${totalItems} câu. Đúng ${correctItems} (${totalItems ? Math.round(correctItems / totalItems * 100) : 0}%).</p>`;
    }

    function restart() {
      data = freshGroups();
      current = 0;
      el.quizCard.classList.remove('hidden');
      document.getElementById('nav-card').classList.remove('hidden');
      el.summaryCard.classList.add('hidden');
      buildGrid();
      render();
    }

    el.prevBtn.addEventListener('click', () => { if (current > 0) { current--; render(); } });
    el.nextBtn.addEventListener('click', () => { if (current < total - 1) { current++; render(); } });
    document.getElementById('finish-btn').addEventListener('click', showSummary);
    el.restartBtn.addEventListener('click', restart);
    el.reviewBtn.addEventListener('click', () => {
      current = 0;
      el.quizCard.classList.remove('hidden');
      document.getElementById('nav-card').classList.remove('hidden');
      el.summaryCard.classList.add('hidden');
      render();
    });

    buildGrid();
    render();
  }

  return { init };
})();
