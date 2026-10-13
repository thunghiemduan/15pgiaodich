/* 15 Phút Giao Dịch – phần dùng chung cho mọi trang */
(function () {
  const cfg = window.BLOG_CONFIG || {};
  const url = (cfg.supabaseUrl || '').trim();
  const key = (cfg.supabaseKey || '').trim();

  function isSecretKey(k) {
    if (k.startsWith('sb_secret_')) return true;
    try {
      const payload = JSON.parse(atob(k.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.role === 'service_role';
    } catch (e) { return false; }
  }

  let client = null;
  let setupProblem = '';
  if (!url || !key) setupProblem = 'Web chưa được kết nối dữ liệu. Hãy điền Project URL và Publishable key vào file config.js.';
  else if (isSecretKey(key)) setupProblem = 'File config.js đang chứa khóa BÍ MẬT (secret / service_role). Hãy xóa ngay và thay bằng Publishable key (hoặc anon key).';
  else if (!window.supabase) setupProblem = 'Không tải được thư viện Supabase. Kiểm tra kết nối mạng rồi tải lại trang.';
  else client = window.supabase.createClient(url, key);

  const KIND = { dau_phien: 'ĐẦU PHIÊN', cuoi_phien: 'CUỐI PHIÊN' };
  const KIND_TITLE = { dau_phien: 'Đầu phiên', cuoi_phien: 'Cuối phiên' };
  const TREND = { tang: 'Tăng', di_ngang: 'Đi ngang', giam: 'Giảm' };
  const DOW = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  // 'YYYY-MM-DD' theo giờ máy người dùng
  function todayStr() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDay(s) { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); }
  function fmtDate(s) { if (!s) return ''; const d = parseDay(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function fmtShort(s) { const d = parseDay(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); }
  function fmtDow(s) { return DOW[parseDay(s).getDay()]; }
  function fmtTime(iso) { if (!iso) return ''; const d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function fmtDateTime(iso) { if (!iso) return ''; const d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' · ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'TG';
    return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function imgUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//.test(path)) return path;
    if (!client) return '';
    return client.storage.from('images').getPublicUrl(path).data.publicUrl;
  }

  // Nội dung bài: "## " = tiêu đề mục, "- " = gạch đầu dòng, **chữ** = in đậm, dòng trống = đoạn mới
  function renderContent(text) {
    const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    let html = '', para = [], list = [];
    const flushPara = () => { if (para.length) { html += '<p>' + para.map(inline).join('<br>') + '</p>'; para = []; } };
    const flushList = () => { if (list.length) { html += '<ul>' + list.map(li => '<li>' + inline(li) + '</li>').join('') + '</ul>'; list = []; } };
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (/^##\s+/.test(line)) { flushPara(); flushList(); html += '<h2>' + inline(line.replace(/^##\s+/, '')) + '</h2>'; }
      else if (/^[-•]\s+/.test(line)) { flushPara(); list.push(line.replace(/^[-•]\s+/, '')); }
      else if (!line.trim()) { flushPara(); flushList(); }
      else { flushList(); para.push(line); }
    }
    flushPara(); flushList();
    return html;
  }
  function plainText(text) { return String(text || '').replace(/^##\s+/gm, '').replace(/\*\*/g, '').replace(/^[-•]\s+/gm, ''); }

  const LOGO = '<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="8" fill="#15171C"/><rect x="8" y="14" width="4" height="12" rx="1" fill="#3FBF85"/><rect x="16" y="9" width="4" height="15" rx="1" fill="#3FBF85"/><rect x="24" y="17" width="4" height="9" rx="1" fill="#F06B5D"/></svg>';

  function renderHeader(active) {
    const el = document.getElementById('site-header');
    if (!el) return;
    const link = (href, label, id) => `<a href="${href}"${active === id ? ' class="on" aria-current="page"' : ''}>${label}</a>`;
    el.className = 'site-header';
    el.innerHTML = `<div class="wrap">
      <a class="brand" href="index.html">${LOGO}<span><span class="brand-name">15 Phút Giao Dịch</span><span class="brand-tag">15 phút mỗi sáng · 15 phút mỗi chiều</span></span></a>
      <nav class="nav" aria-label="Menu chính">
        ${link('index.html', 'Trang chủ', 'home')}
        ${link('index.html?loai=dau_phien#bai-viet', 'Đầu phiên', 'dau_phien')}
        ${link('index.html?loai=cuoi_phien#bai-viet', 'Cuối phiên', 'cuoi_phien')}
        ${link('tac-gia.html', 'Tác giả', 'author')}
        <a class="admin" href="dang-nhap.html">Quản trị viên</a>
      </nav></div>`;
    if (setupProblem) {
      const b = document.createElement('div');
      b.className = 'setup-banner';
      b.innerHTML = '<div class="wrap">' + esc(setupProblem) + '</div>';
      el.after(b);
    }
  }

  function renderFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    el.className = 'site-footer';
    el.innerHTML = `<div class="wrap"><div style="max-width:640px"><b>15 Phút Giao Dịch</b>Nội dung trên website mang tính tham khảo, không phải khuyến nghị mua/bán. Nhà đầu tư tự chịu trách nhiệm với quyết định của mình.</div><div>© ${new Date().getFullYear()} 15 Phút Giao Dịch</div></div>`;
  }

  let settingsCache = null;
  async function getSettings() {
    if (settingsCache) return settingsCache;
    if (!client) return {};
    const { data } = await client.from('site_settings').select('*').eq('id', 1).maybeSingle();
    settingsCache = data || {};
    return settingsCache;
  }

  function avatarHtml(settings, cls) {
    const src = imgUrl(settings && settings.avatar_url);
    return `<div class="avatar ${cls || ''}">${src ? `<img src="${esc(src)}" alt="">` : esc(initials(settings && settings.author_name))}</div>`;
  }

  let toastTimer;
  function toast(msg, isErr) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.toggle('err', !!isErr); t.classList.remove('hidden');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), 3500);
  }

  function errText(e) {
    const m = (e && (e.message || e.error_description)) || String(e || '');
    if (/Invalid login credentials/i.test(m)) return 'Sai email hoặc mật khẩu.';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Không kết nối được máy chủ. Kiểm tra mạng hoặc config.js.';
    if (/row-level security|permission denied/i.test(m)) return 'Tài khoản không có quyền thực hiện thao tác này.';
    if (/Bucket not found/i.test(m)) return 'Chưa có kho ảnh "images". Hãy chạy lại file setup.sql.';
    return m || 'Có lỗi xảy ra.';
  }

  window.Blog = { sb: client, setupProblem, KIND, KIND_TITLE, TREND, esc, pad, todayStr, parseDay, fmtDate, fmtShort, fmtDow, fmtTime, fmtDateTime, initials, imgUrl, renderContent, plainText, renderHeader, renderFooter, getSettings, avatarHtml, toast, errText };
})();
