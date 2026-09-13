// Dùng chung cho mọi trang luyện tập (phần cố định + 2 trang random).
// Gọi window.QuizEngine.init(data, title) sau khi đã có mảng câu hỏi.
window.QuizEngine = (function () {
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function init(rawData, title, opts) {
    opts = opts || {};
    const ids = Object.assign({
      title: 'quiz-title', progressFill: 'progress-fill', progressInfo: 'progress-info',
      qText: 'q-text', options: 'options', explain: 'explain', prevBtn: 'prev-btn', nextBtn: 'next-btn',
      finishBtn: 'finish-btn', grid: 'nav-grid', quizCard: 'quiz-card', navCard: 'nav-card',
      summaryCard: 'summary-card', scoreText: 'score-text', restartBtn: 'restart-btn',
      reviewBtn: 'review-btn', emptyState: 'empty-state',
    }, opts.ids || {});

    const source = (rawData || []).filter((item) => item && item.q && item.options && item.options.length);

    function freshData() {
      return shuffle(source).map((item) => ({
        id: item.id,
        q: item.q,
        answer: item.answer,
        desc: item.desc,
        options: shuffle(item.options),
      }));
    }

    let data = freshData();
    const total = data.length;
    let answers = {};
    let current = 0;

    const el = {
      title: document.getElementById(ids.title),
      progressFill: document.getElementById(ids.progressFill),
      progressInfo: document.getElementById(ids.progressInfo),
      qText: document.getElementById(ids.qText),
      options: document.getElementById(ids.options),
      explain: document.getElementById(ids.explain),
      prevBtn: document.getElementById(ids.prevBtn),
      nextBtn: document.getElementById(ids.nextBtn),
      finishBtn: document.getElementById(ids.finishBtn),
      grid: document.getElementById(ids.grid),
      quizCard: document.getElementById(ids.quizCard),
      navCard: document.getElementById(ids.navCard),
      summaryCard: document.getElementById(ids.summaryCard),
      scoreText: document.getElementById(ids.scoreText),
      restartBtn: document.getElementById(ids.restartBtn),
      reviewBtn: document.getElementById(ids.reviewBtn),
      emptyState: document.getElementById(ids.emptyState),
    };

    if (el.title) el.title.textContent = title || 'Luyện tập trắc nghiệm';

    if (total === 0) {
      if (el.quizCard) el.quizCard.classList.add('hidden');
      if (el.navCard) el.navCard.classList.add('hidden');
      if (el.emptyState) el.emptyState.classList.remove('hidden');
      return;
    }

    function buildGrid() {
      el.grid.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const b = document.createElement('button');
        b.textContent = i + 1;
        b.addEventListener('click', () => {
          current = i;
          render();
        });
        el.grid.appendChild(b);
      }
    }

    function updateGrid() {
      Array.from(el.grid.children).forEach((btn, i) => {
        btn.classList.toggle('current', i === current);
        const ans = answers[i];
        btn.classList.toggle('answered', ans !== undefined);
        btn.classList.remove('correct', 'wrong');
        if (ans !== undefined) {
          btn.classList.add(ans === data[i].answer ? 'correct' : 'wrong');
        }
      });
    }

    function render() {
      const item = data[current];
      el.qText.textContent = `Câu ${current + 1}: ${item.q}`;
      el.progressInfo.textContent = `Câu ${current + 1}/${total} · Đã trả lời ${Object.keys(answers).length}/${total}`;
      el.progressFill.style.width = ((current + 1) / total * 100) + '%';

      el.options.innerHTML = '';
      const chosen = answers[current];
      item.options.forEach((opt) => {
        const label = document.createElement('label');
        label.className = 'option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'opt';
        input.value = opt;
        input.checked = chosen === opt;

        if (chosen !== undefined) {
          label.classList.add('disabled');
          if (opt === item.answer) label.classList.add('correct');
          else if (opt === chosen) label.classList.add('wrong');
        } else {
          input.addEventListener('change', () => selectAnswer(opt));
        }

        const span = document.createElement('span');
        span.textContent = opt;
        label.appendChild(input);
        label.appendChild(span);
        el.options.appendChild(label);
      });

      if (chosen !== undefined && item.desc) {
        el.explain.innerHTML = `<b>Giải thích:</b> ${item.desc}`;
        el.explain.classList.add('show');
      } else {
        el.explain.classList.remove('show');
        el.explain.innerHTML = '';
      }

      el.prevBtn.disabled = current === 0;
      el.nextBtn.disabled = current === total - 1;
      updateGrid();
    }

    function selectAnswer(opt) {
      const item = data[current];
      answers[current] = opt;
      if (window.SheetClient && item.id !== undefined) {
        window.SheetClient.reportAnswer(item.id, opt === item.answer);
      }
      render();
    }

    function showSummary() {
      const answeredCount = Object.keys(answers).length;
      let correctCount = 0;
      data.forEach((item, i) => {
        if (answers[i] === item.answer) correctCount++;
      });
      el.quizCard.classList.add('hidden');
      el.navCard.classList.add('hidden');
      el.summaryCard.classList.remove('hidden');
      el.scoreText.innerHTML = `<div class="score">${correctCount}<small>/${total}</small></div>
        <p>Bạn đã trả lời ${answeredCount}/${total} câu. Đúng ${correctCount} câu (${total ? Math.round(correctCount / total * 100) : 0}%).</p>`;
    }

    function restart() {
      data = freshData();
      answers = {};
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

  return { init, shuffle };
})();
