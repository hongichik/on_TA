(function () {
  const STORAGE_KEY = 'trac_nghiem_' + (window.QUIZ_STORAGE_ID || 'default');
  const data = window.QUIZ_DATA || [];
  const total = data.length;

  let answers = loadProgress(); // { [index]: chosenOptionText }
  let current = firstUnanswered();

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
  };

  el.title.textContent = window.QUIZ_TITLE || 'Luyện tập trắc nghiệm';

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch (e) {}
  }

  function firstUnanswered() {
    for (let i = 0; i < total; i++) {
      if (answers[i] === undefined) return i;
    }
    return 0;
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
    answers[current] = opt;
    saveProgress();
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

  el.prevBtn.addEventListener('click', () => { if (current > 0) { current--; render(); } });
  el.nextBtn.addEventListener('click', () => { if (current < total - 1) { current++; render(); } });
  el.finishBtn.addEventListener('click', showSummary);
  el.restartBtn.addEventListener('click', () => {
    answers = {};
    saveProgress();
    current = 0;
    el.quizCard.classList.remove('hidden');
    document.getElementById('nav-card').classList.remove('hidden');
    el.summaryCard.classList.add('hidden');
    render();
  });
  el.reviewBtn.addEventListener('click', () => {
    current = 0;
    el.quizCard.classList.remove('hidden');
    document.getElementById('nav-card').classList.remove('hidden');
    el.summaryCard.classList.add('hidden');
    render();
  });

  buildGrid();
  render();
})();
