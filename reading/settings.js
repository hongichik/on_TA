(function () {
  const input = document.getElementById('url-input');
  const saveBtn = document.getElementById('save-btn');
  const testBtn = document.getElementById('test-btn');
  const clearBtn = document.getElementById('clear-btn');
  const status = document.getElementById('status-line');

  input.value = window.SheetClient.getUrl();

  function showStatus(msg, ok) {
    status.textContent = msg;
    status.className = 'status-line show ' + (ok ? 'ok' : 'err');
  }

  saveBtn.addEventListener('click', function () {
    window.SheetClient.setUrl(input.value);
    showStatus('Đã lưu URL.', true);
  });

  clearBtn.addEventListener('click', function () {
    window.SheetClient.setUrl('');
    input.value = window.SheetClient.getUrl();
    showStatus('Đã khôi phục về URL mặc định đã cài sẵn trong code.', true);
  });

  testBtn.addEventListener('click', async function () {
    window.SheetClient.setUrl(input.value);
    showStatus('Đang kiểm tra kết nối...', true);
    try {
      const data = await window.SheetClient.fetchQuestions({ force: true });
      if (!data) {
        showStatus('Chưa nhập URL.', false);
        return;
      }
      showStatus(`Kết nối thành công! Đọc được ${data.length} câu hỏi từ Google Sheet.`, true);
    } catch (e) {
      showStatus('Kết nối thất bại: ' + e.message + '. Kiểm tra lại URL và quyền truy cập "Anyone" khi Deploy.', false);
    }
  });
})();
