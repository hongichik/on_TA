(async function () {
  const notConfigured = document.getElementById('not-configured');
  const poolInfo = document.getElementById('pool-info');
  const setupRow = document.getElementById('setup-row');
  const countInput = document.getElementById('count-input');
  const startBtn = document.getElementById('start-btn');
  const setupCard = document.getElementById('setup-card');
  const quizCard = document.getElementById('quiz-card');
  const navCard = document.getElementById('nav-card');

  if (!window.SheetClient.isConfigured()) {
    notConfigured.classList.remove('hidden');
    poolInfo.classList.add('hidden');
    setupRow.classList.add('hidden');
    return;
  }

  poolInfo.textContent = 'Đang tải thống kê từ Google Sheet...';

  let questions, stats;
  try {
    [questions, stats] = await Promise.all([
      window.SheetClient.fetchQuestions(),
      window.SheetClient.fetchWrongStats(),
    ]);
  } catch (e) {
    poolInfo.textContent = 'Không kết nối được Google Sheet (' + e.message + '). Kiểm tra lại URL trong trang Cài đặt.';
    setupRow.classList.add('hidden');
    return;
  }

  const statMap = {};
  (stats || []).forEach(function (s) { statMap[s.id] = s; });

  const ranked = (questions || [])
    .map(function (q) {
      const s = statMap[q.id];
      const wrongs = s ? Number(s.wrongs) || 0 : 0;
      const attempts = s ? Number(s.attempts) || 0 : 0;
      return { q: q, wrongs: wrongs, rate: attempts ? wrongs / attempts : 0 };
    })
    .filter(function (x) { return x.wrongs > 0; })
    .sort(function (a, b) { return b.wrongs - a.wrongs || b.rate - a.rate; });

  if (!ranked.length) {
    poolInfo.textContent = 'Chưa có câu nào được ghi nhận là sai. Hãy luyện tập ở các phần khác trước — hệ thống sẽ tự lưu câu bạn hay sai vào Google Sheet để ôn lại ở đây.';
    setupRow.classList.add('hidden');
    return;
  }

  const wrongPool = ranked.map(function (x) { return x.q; });
  poolInfo.textContent = `Có ${wrongPool.length} câu bạn từng làm sai (xếp theo số lần sai nhiều nhất).`;
  countInput.max = wrongPool.length;
  countInput.value = Math.min(20, wrongPool.length);

  startBtn.addEventListener('click', function () {
    let n = parseInt(countInput.value, 10);
    if (!n || n < 1) n = 20;
    if (n > wrongPool.length) n = wrongPool.length;
    const subset = wrongPool.slice(0, n);
    setupCard.classList.add('hidden');
    quizCard.classList.remove('hidden');
    navCard.classList.remove('hidden');
    window.QuizEngine.init(subset, `Ôn ${subset.length} câu hay sai`);
  });
})();
