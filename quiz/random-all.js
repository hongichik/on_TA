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

  poolInfo.textContent = 'Đang tải dữ liệu từ Google Sheet...';

  let pool = [];
  try {
    pool = (await window.SheetClient.fetchQuestions()) || [];
  } catch (e) {
    poolInfo.textContent = 'Không kết nối được Google Sheet (' + e.message + '). Kiểm tra lại URL trong trang Cài đặt.';
    setupRow.classList.add('hidden');
    return;
  }

  if (!pool.length) {
    poolInfo.textContent = 'Chưa có câu hỏi nào trong Sheet.';
    setupRow.classList.add('hidden');
    return;
  }

  poolInfo.textContent = `Ngân hàng hiện có ${pool.length} câu hỏi. Mỗi lần bắt đầu, câu hỏi được chọn và trộn thứ tự ngẫu nhiên.`;
  countInput.max = pool.length;
  countInput.value = Math.min(20, pool.length);

  startBtn.addEventListener('click', function () {
    let n = parseInt(countInput.value, 10);
    if (!n || n < 1) n = 20;
    if (n > pool.length) n = pool.length;
    const subset = window.QuizEngine.shuffle(pool).slice(0, n);
    setupCard.classList.add('hidden');
    quizCard.classList.remove('hidden');
    navCard.classList.remove('hidden');
    window.QuizEngine.init(subset, `Ngẫu nhiên ${subset.length} câu`);
  });
})();
