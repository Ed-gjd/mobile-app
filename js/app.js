/* app.js —— 主控逻辑：导航切换 + 在线状态 + 通知 + 主题（L5） */
(function () {
  'use strict';

  const pages = document.querySelectorAll('.page');
  const navBtns = document.querySelectorAll('.nav-btn');
  const statusBadge = document.getElementById('status-badge');

  /* ===== 切换模块 ===== */
  function switchPage(name) {
    pages.forEach((p) => (p.hidden = p.dataset.page !== name));
    navBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.nav === name));
  }
  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => switchPage(btn.dataset.nav));
  });

  /* ===== 在线状态 ===== */
  function updateOnline() {
    const online = navigator.onLine;
    statusBadge.textContent = online ? '在线' : '离线';
    statusBadge.classList.toggle('is-online', online);
  }
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();

  /* ===== 主题换色：CSS 变量 + localStorage 持久化 ===== */
  const ACCENT_KEY = 'toolbox.accent';
  function applyAccent(color) {
    document.documentElement.style.setProperty('--accent', color);
    document.querySelectorAll('.swatch').forEach((s) => {
      s.classList.toggle('is-active', s.dataset.accent === color);
    });
  }
  document.querySelectorAll('.swatch').forEach((s) => {
    s.onclick = () => {
      applyAccent(s.dataset.accent);
      localStorage.setItem(ACCENT_KEY, s.dataset.accent);
    };
  });
  applyAccent(localStorage.getItem(ACCENT_KEY) || '#6c8cff');

  /* ===== 通知：权限 + 到期提醒弹通知 ===== */
  const notifBtn = document.getElementById('notif-btn');

  function notifSupported() {
    return 'Notification' in window && navigator.serviceWorker;
  }
  function updateNotifBtn() {
    if (!notifSupported()) {
      notifBtn.textContent = '不支持';
      notifBtn.disabled = true;
      return;
    }
    notifBtn.textContent = Notification.permission === 'granted' ? '已开启 ✓' : '开启通知';
    notifBtn.disabled = Notification.permission === 'granted';
  }
  notifBtn.onclick = () => {
    Notification.requestPermission().then((p) => {
      if (p === 'granted') {
        // 弹一条测试通知证明链路通了
        navigator.serviceWorker.ready.then((reg) =>
          reg.showNotification('✅ 通知已开启', { body: '以后提醒到期会在这里通知你', icon: './icons/icon-192.png' })
        );
      }
      updateNotifBtn();
    });
  };

  /* 页面打开时：检查有没有到期的提醒，弹通知 */
  function fireDueReminders() {
    if (!notifSupported() || Notification.permission !== 'granted') return;
    const due = window.Toolbox && window.Toolbox.tools
      ? window.Toolbox.tools.getOverdueReminders() : [];
    if (!due.length) return;
    navigator.serviceWorker.ready.then((reg) => {
      due.forEach((r) => {
        reg.showNotification('⏰ 提醒到期', { body: r.text, icon: './icons/icon-192.png' });
      });
    });
  }
  updateNotifBtn();
  window.addEventListener('load', fireDueReminders);

  window.Toolbox = Object.assign(window.Toolbox || {}, {
    isOnline: () => navigator.onLine
  });
})();
