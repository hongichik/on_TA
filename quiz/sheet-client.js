// Giao tiếp với Google Apps Script Web App (đọc câu hỏi / thống kê, ghi câu trả lời sai).
window.SheetClient = (function () {
  const KEY = 'tracnhiem_sheet_webapp_url';
  const CACHE_KEY = 'tracnhiem_questions_cache';
  // Link Web App mặc định - đã dán sẵn nên không cần cấu hình lại.
  // Vào trang Cài đặt nếu muốn đổi sang link khác.
  const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbw-zzLvC4ihaxbFkS3wplTsQU1LrgxK4xZBQFudFCdHEkuPgXQBLzJ7GgVkVUA4Ajg/exec';

  function getUrl() {
    try {
      const stored = (localStorage.getItem(KEY) || '').trim();
      return stored || DEFAULT_URL;
    } catch (e) {
      return DEFAULT_URL;
    }
  }

  function setUrl(url) {
    try {
      localStorage.setItem(KEY, (url || '').trim());
      localStorage.removeItem(CACHE_KEY); // đổi Sheet thì bỏ cache cũ
    } catch (e) {}
  }

  function isConfigured() {
    return !!getUrl();
  }

  function getCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  // Mặc định dùng dữ liệu câu hỏi đã lưu ở máy (nhanh, không gọi mạng).
  // Chỉ gọi lại Sheet khi chưa có cache lần nào, hoặc khi truyền {force: true}
  // (bấm nút "Tải lại từ Sheet").
  async function fetchQuestions(opts) {
    const force = opts && opts.force;
    if (!force) {
      const cached = getCache();
      if (cached) return cached;
    }
    const url = getUrl();
    if (!url) return null;
    const res = await fetch(url + '?action=questions', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('Dữ liệu trả về không hợp lệ');
    setCache(json);
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

  return { getUrl, setUrl, isConfigured, fetchQuestions, fetchWrongStats, reportAnswer, clearQuestionsCache: function () { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} } };
})();
