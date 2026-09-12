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
  (stats || []).forEach(function (s) { statMap[String(s.id)] = s; });

  // due = số lần cần trả lời đúng để "bù" hết các lần sai trước đó.
  // Sai 1 lần -> due 1, phải làm đúng 1 lần mới hết. Sai 2 lần liên tiếp -> due 2.
  // Câu due = 0 (đã bù xong hoặc chưa từng sai) sẽ không xuất hiện ở đây nữa.
  const ranked = (questions || [])
    .map(function (q) {
      const s = statMap[String(q.id)];
      const due = s ? Number(s.due) || 0 : 0;
      const wrongs = s ? Number(s.wrongs) || 0 : 0;
      return { q: q, due: due, wrongs: wrongs };
    })
    .filter(function (x) { return x.due > 0; })
    .sort(function (a, b) { return b.due - a.due || b.wrongs - a.wrongs; });

  if (!ranked.length) {
    poolInfo.textContent = 'Không còn câu nào cần ôn lại — mọi câu sai trước đó đã được trả lời đúng đủ số lần bù. Hãy luyện tập ở các phần khác, hệ thống sẽ tự lưu câu bạn làm sai vào đây.';
    setupRow.classList.add('hidden');
    return;
  }

  const wrongPool = ranked.map(function (x) { return x.q; });
  poolInfo.textContent = `Có ${wrongPool.length} câu cần ôn lại (sắp xếp theo số lần cần trả đúng để bù nhiều nhất).`;
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
