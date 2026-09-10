// Giao tiếp với Google Apps Script Web App (đọc câu hỏi / thống kê, ghi câu trả lời sai).
window.SheetClient = (function () {
  const KEY = 'tracnhiem_sheet_webapp_url';

  function getUrl() {
    try {
      return (localStorage.getItem(KEY) || '').trim();
    } catch (e) {
      return '';
    }
  }

  function setUrl(url) {
    try {
      localStorage.setItem(KEY, (url || '').trim());
    } catch (e) {}
  }

  function isConfigured() {
    return !!getUrl();
  }

  async function fetchQuestions() {
    const url = getUrl();
    if (!url) return null;
    const res = await fetch(url + '?action=questions', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('Dữ liệu trả về không hợp lệ');
    return json;
  }

  async function fetchWrongStats() {
    const url = getUrl();
    if (!url) return null;
    const res = await fetch(url + '?action=wrongstats', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('Dữ liệu trả về không hợp lệ');
    return json;
  }

  // Gửi kết quả câu trả lời lên Sheet (fire-and-forget, không chặn UI).
  function reportAnswer(id, correct) {
    const url = getUrl();
    if (!url || id === undefined || id === null) return;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // tránh CORS preflight
      body: JSON.stringify({ action: 'report', id: id, correct: !!correct }),
    }).catch(function () {
      /* bỏ qua lỗi mạng, không ảnh hưởng việc luyện tập */
    });
  }

  return { getUrl, setUrl, isConfigured, fetchQuestions, fetchWrongStats, reportAnswer };
})();
