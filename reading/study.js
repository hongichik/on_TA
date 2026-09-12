(async function () {
  const list = document.getElementById('study-list');
  const toggleBtn = document.getElementById('toggle-answers');
  const toolbar = document.getElementById('toolbar');
  const countEl = document.getElementById('study-count');
  const notConfigured = document.getElementById('not-configured');

  if (!window.SheetClient || !window.SheetClient.isConfigured()) {
    notConfigured.classList.remove('hidden');
    countEl.textContent = '';
    return;
  }

  countEl.textContent = 'đang tải...';
  let data = [];
  try {
    data = (await window.SheetClient.fetchQuestions()) || [];
  } catch (e) {
    notConfigured.textContent = 'Không kết nối được Google Sheet (' + e.message + '). Kiểm tra lại URL trong trang Cài đặt.';
    notConfigured.classList.remove('hidden');
    countEl.textContent = '';
    return;
  }

  if (!data.length) {
    notConfigured.textContent = 'Chưa có câu hỏi nào trong Sheet.';
    notConfigured.classList.remove('hidden');
    countEl.textContent = '';
    return;
  }

  toolbar.classList.remove('hidden');
  countEl.textContent = `${data.length} câu`;

  const frag = document.createDocumentFragment();
  data.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'study-item';

    const q = document.createElement('p');
    q.className = 'study-q';
    q.innerHTML = `<b>Câu ${i + 1}.</b> ${item.q}`;
    card.appendChild(q);

    const ul = document.createElement('ul');
    ul.className = 'study-options';
    item.options.forEach((opt) => {
      const li = document.createElement('li');
      li.textContent = opt;
      if (opt === item.answer) li.classList.add('correct-ans');
      ul.appendChild(li);
    });
    card.appendChild(ul);

    if (item.desc) {
      const desc = document.createElement('p');
      desc.className = 'study-desc';
      desc.textContent = `Giải thích: ${item.desc}`;
      card.appendChild(desc);
    }

    frag.appendChild(card);
  });
  list.appendChild(frag);

  let hidden = false;
  toggleBtn.addEventListener('click', () => {
    hidden = !hidden;
    document.body.classList.toggle('answers-hidden', hidden);
    toggleBtn.textContent = hidden ? 'Hiện đáp án' : 'Ẩn đáp án (tự kiểm tra)';
  });
})();
