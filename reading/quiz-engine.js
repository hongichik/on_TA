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

  function init(rawData, title) {
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
      title: document.getElementById('quiz-title'),
      progressFill: document.getElementById('progress-fill'),
      progressInfo: document.getElementById('progress-info'),
      qText: document.getElementById('q-text'),
      options: document.getElementById('options'),
      explain: document.getElementById('explain'),
      prevBtn: document.getElementById('prev-btn'),
      nextBtn: document.getElementById('next-btn'),
      finishBtn: document.getElementById('finish-btn'),
      grid: document.getElementById('nav-grid'),
      quizCard: document.getElementById('quiz-card'),
      summaryCard: document.getElementById('summary-card'),
      scoreText: document.getElementById('score-text'),
      restartBtn: document.getElementById('restart-btn'),
      reviewBtn: document.getElementById('review-btn'),
      emptyState: document.getElementById('empty-state'),
    };

    if (el.title) el.title.textContent = title || 'Luyện tập trắc nghiệm';

    if (total === 0) {
      if (el.quizCard) el.quizCard.classList.add('hidden');
      const navCard = document.getElementById('nav-card');
      if (navCard) navCard.classList.add('hidden');
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
      document.getElementById('nav-card').classList.add('hidden');
      el.summaryCard.classList.remove('hidden');
      el.scoreText.innerHTML = `<div class="score">${correctCount}<small>/${total}</small></div>
        <p>Bạn đã trả lời ${answeredCount}/${total} câu. Đúng ${correctCount} câu (${total ? Math.round(correctCount / total * 100) : 0}%).</p>`;
    }

    function restart() {
      data = freshData();
      answers = {};
      current = 0;
      el.quizCard.classList.remove('hidden');
      document.getElementById('nav-card').classList.remove('hidden');
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
      document.getElementById('nav-card').classList.remove('hidden');
      el.summaryCard.classList.add('hidden');
      render();
    });

    buildGrid();
    render();
  }

  return { init, shuffle };
})();
