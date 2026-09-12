// Giao tiếp với Google Apps Script Web App (đọc câu hỏi / thống kê, ghi câu trả lời sai).
window.SheetClient = (function () {
  const KEY = 'tracnhiem_sheet_webapp_url';
  const CACHE_KEY = 'tracnhiem_questions_cache';
  const WRONG_CACHE_KEY = 'tracnhiem_wrongstats_cache';
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
      localStorage.removeItem(WRONG_CACHE_KEY);
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

  function getWrongCache() {
    try {
      const raw = localStorage.getItem(WRONG_CACHE_KEY);
      return raw !== null ? JSON.parse(raw) : null; // null = máy này chưa từng đồng bộ
    } catch (e) {
      return null;
    }
  }

  function setWrongCache(data) {
    try {
      localStorage.setItem(WRONG_CACHE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  // Giống fetchQuestions: mặc định dùng local, chỉ gọi Sheet khi máy này
  // chưa từng đồng bộ lần nào (đổi máy) hoặc khi ép {force: true}.
  async function fetchWrongStats(opts) {
    const force = opts && opts.force;
    if (!force) {
      const cached = getWrongCache();
      if (cached !== null) return cached;
    }
    const url = getUrl();
    if (!url) return null;
    const res = await fetch(url + '?action=wrongstats', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('Dữ liệu trả về không hợp lệ');
    setWrongCache(json);
    return json;
  }

  // Cập nhật ngay số liệu "câu hay sai" trong local (để không phải chờ Sheet
  // mỗi lần làm lại bài), đồng thời gửi lên Sheet ở nền để đồng bộ các máy khác.
  // Sai 1 lần -> due +1 (cần trả đúng 1 lần để bù). Đúng -> due -1 (không âm).
  // Câu chưa từng sai mà trả lời đúng thì bỏ qua, không tạo dòng thừa.
  function reportAnswer(id, correct) {
    if (id === undefined || id === null) return;

    try {
      let cache = getWrongCache();
      if (!Array.isArray(cache)) cache = [];
      let entry = null;
      for (let i = 0; i < cache.length; i++) {
        if (String(cache[i].id) === String(id)) { entry = cache[i]; break; }
      }
      if (!entry) {
        if (correct) {
          // chưa từng sai, giờ đúng luôn -> không cần theo dõi
        } else {
          cache.push({ id: id, attempts: 1, wrongs: 1, due: 1, lastWrongAt: new Date().toISOString() });
          setWrongCache(cache);
        }
      } else {
        entry.attempts = (entry.attempts || 0) + 1;
        if (correct) {
          entry.due = Math.max(0, (entry.due || 0) - 1);
        } else {
          entry.wrongs = (entry.wrongs || 0) + 1;
          entry.due = (entry.due || 0) + 1;
          entry.lastWrongAt = new Date().toISOString();
        }
        setWrongCache(cache);
      }
    } catch (e) {}

    const url = getUrl();
    if (!url) return;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // tránh CORS preflight
      body: JSON.stringify({ action: 'report', id: id, correct: !!correct }),
    }).catch(function () {
      /* bỏ qua lỗi mạng, dữ liệu local vẫn đã cập nhật ở trên */
    });
  }

  return {
    getUrl, setUrl, isConfigured, fetchQuestions, fetchWrongStats, reportAnswer,
    clearQuestionsCache: function () { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} },
    clearWrongCache: function () { try { localStorage.removeItem(WRONG_CACHE_KEY); } catch (e) {} },
  };
})();
