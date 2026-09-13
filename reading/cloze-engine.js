// Dùng riêng cho Part 1: hiện nguyên 1 lá thư, mỗi chỗ trống là 1 dropdown chọn đáp án.
window.ClozeEngine = (function () {
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // letters: [{ id, group, text, blanks: [{id, answer, options}] }]
  function init(letters, title, opts) {
    opts = opts || {};
    const ids = Object.assign({
      title: 'quiz-title', progressFill: 'progress-fill', progressInfo: 'progress-info',
      letterBody: 'letter-body', prevBtn: 'prev-btn', nextBtn: 'next-btn', grid: 'nav-grid',
      quizCard: 'quiz-card', navCard: 'nav-card', summaryCard: 'summary-card', scoreText: 'score-text',
      restartBtn: 'restart-btn', reviewBtn: 'review-btn', emptyState: 'empty-state', finishBtn: 'finish-btn',
    }, opts.ids || {});

    function freshLetters() {
      // Xáo trộn cả thứ tự các lá thư mỗi lần vào học, không chỉ thứ tự chỗ trống bên trong.
      return shuffle(letters).map(function (L) {
        return {
          id: L.id || L.group,
          group: L.group,
          text: L.text,
          reported: false,
          blanks: L.blanks.map(function (b) {
            return { id: b.id, answer: b.answer, options: shuffle(b.options), chosen: undefined };
          }),
        };
      });
    }

    let data = freshLetters();
    const total = data.length;
    let current = 0;

    const el = {
      title: document.getElementById(ids.title),
      progressFill: document.getElementById(ids.progressFill),
      progressInfo: document.getElementById(ids.progressInfo),
      letterBody: document.getElementById(ids.letterBody),
      prevBtn: document.getElementById(ids.prevBtn),
      nextBtn: document.getElementById(ids.nextBtn),
      grid: document.getElementById(ids.grid),
      quizCard: document.getElementById(ids.quizCard),
      navCard: document.getElementById(ids.navCard),
      summaryCard: document.getElementById(ids.summaryCard),
      scoreText: document.getElementById(ids.scoreText),
      restartBtn: document.getElementById(ids.restartBtn),
      reviewBtn: document.getElementById(ids.reviewBtn),
      emptyState: document.getElementById(ids.emptyState),
      finishBtn: document.getElementById(ids.finishBtn),
    };

    if (el.title) el.title.textContent = title || 'Điền từ còn thiếu';

    if (total === 0) {
      if (el.quizCard) el.quizCard.classList.add('hidden');
      if (el.navCard) el.navCard.classList.add('hidden');
      if (el.emptyState) el.emptyState.classList.remove('hidden');
      return;
    }

    function letterStats(L) {
      let answered = 0, correct = 0;
      L.blanks.forEach(function (b) {
        if (b.chosen !== undefined) {
          answered++;
          if (b.chosen === b.answer) correct++;
        }
      });
      return { answered, correct, count: L.blanks.length };
    }

    // Cả lá thư chỉ tính "đúng" (giảm nợ) khi TẤT CẢ chỗ trống đều đúng; nếu có
    // dù chỉ 1 chỗ sai thì cả lá thư vẫn tính là sai. Chỉ báo cáo 1 lần/lượt làm.
    function maybeReportLetter(L) {
      const s = letterStats(L);
      if (s.answered === s.count && !L.reported) {
        L.reported = true;
        if (window.SheetClient) window.SheetClient.reportAnswer(L.id, s.correct === s.count);
      }
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
        const s = letterStats(data[i]);
        btn.classList.toggle('current', i === current);
        btn.classList.toggle('answered', s.answered === s.count);
        btn.classList.remove('correct', 'wrong');
        if (s.answered === s.count) {
          btn.classList.add(s.correct === s.count ? 'correct' : 'wrong');
        }
      });
    }

    function render() {
      const L = data[current];
      const s = letterStats(L);
      el.progressInfo.textContent = `Lá thư ${current + 1}/${total} · Đã điền ${s.answered}/${s.count} chỗ trống (đúng ${s.correct})`;
      el.progressFill.style.width = ((current + 1) / total * 100) + '%';

      el.letterBody.innerHTML = '';
      const segments = L.text.split('_____');
      segments.forEach(function (seg, i) {
        seg.split('\n').forEach(function (line, li) {
          if (li > 0) el.letterBody.appendChild(document.createElement('br'));
          el.letterBody.appendChild(document.createTextNode(line));
        });
        if (i < L.blanks.length) {
          const b = L.blanks[i];
          const select = document.createElement('select');
          select.className = 'blank-select';
          const placeholder = document.createElement('option');
          placeholder.textContent = '— chọn —';
          placeholder.value = '';
          placeholder.disabled = true;
          placeholder.selected = b.chosen === undefined;
          select.appendChild(placeholder);
          b.options.forEach(function (opt) {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt;
            if (b.chosen === opt) o.selected = true;
            select.appendChild(o);
          });
          if (b.chosen !== undefined) {
            select.disabled = true;
            select.classList.add(b.chosen === b.answer ? 'blank-correct' : 'blank-wrong');
          }
          select.addEventListener('change', function () {
            b.chosen = select.value;
            maybeReportLetter(L);
            render();
          });
          el.letterBody.appendChild(select);
          if (b.chosen !== undefined && b.chosen !== b.answer) {
            const hint = document.createElement('span');
            hint.className = 'blank-hint';
            hint.textContent = ` (đúng: ${b.answer})`;
            el.letterBody.appendChild(hint);
          }
        }
      });

      el.prevBtn.disabled = current === 0;
      el.nextBtn.disabled = current === total - 1;
      updateGrid();
    }

    function showSummary() {
      let totalBlanks = 0, correctBlanks = 0, answeredBlanks = 0;
      data.forEach(function (L) {
        const s = letterStats(L);
        totalBlanks += s.count;
        correctBlanks += s.correct;
        answeredBlanks += s.answered;
      });
      el.quizCard.classList.add('hidden');
      el.navCard.classList.add('hidden');
      el.summaryCard.classList.remove('hidden');
      el.scoreText.innerHTML = `<div class="score">${correctBlanks}<small>/${totalBlanks}</small></div>
        <p>Đã điền ${answeredBlanks}/${totalBlanks} chỗ trống. Đúng ${correctBlanks} (${totalBlanks ? Math.round(correctBlanks / totalBlanks * 100) : 0}%).</p>`;
    }

    function restart() {
      data = freshLetters();
      current = 0;
      el.quizCard.classList.remove('hidden');
      el.navCard.classList.remove('hidden');
      el.summaryCard.classList.add('hidden');
      buildGrid();
      render();
    }

    el.prevBtn.addEventListener('click', () => { if (current > 0) { current--; render(); } });
    el.nextBtn.addEventListener('click', () => { if (current < total - 1) { current++; render(); } });
    el.finishBtn.addEventListener('click', showSummary);
    el.restartBtn.addEventListener('click', restart);
    el.reviewBtn.addEventListener('click', () => {
      current = 0;
      el.quizCard.classList.remove('hidden');
      el.navCard.classList.remove('hidden');
      el.summaryCard.classList.add('hidden');
      render();
    });

    buildGrid();
    render();
  }

  return { init };
})();
