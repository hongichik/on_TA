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

  // letters: [{ group, text, blanks: [{id, answer, options}] }]
  function init(letters, title) {
    function freshLetters() {
      return letters.map(function (L) {
        return {
          group: L.group,
          text: L.text,
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
      title: document.getElementById('quiz-title'),
      progressFill: document.getElementById('progress-fill'),
      progressInfo: document.getElementById('progress-info'),
      letterBody: document.getElementById('letter-body'),
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

    if (el.title) el.title.textContent = title || 'Điền từ còn thiếu';

    if (total === 0) {
      if (el.quizCard) el.quizCard.classList.add('hidden');
      const navCard = document.getElementById('nav-card');
      if (navCard) navCard.classList.add('hidden');
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
            if (window.SheetClient) window.SheetClient.reportAnswer(b.id, b.chosen === b.answer);
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
      document.getElementById('nav-card').classList.add('hidden');
      el.summaryCard.classList.remove('hidden');
      el.scoreText.innerHTML = `<div class="score">${correctBlanks}<small>/${totalBlanks}</small></div>
        <p>Đã điền ${answeredBlanks}/${totalBlanks} chỗ trống. Đúng ${correctBlanks} (${totalBlanks ? Math.round(correctBlanks / totalBlanks * 100) : 0}%).</p>`;
    }

    function restart() {
      data = freshLetters();
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
