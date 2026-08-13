/* tools.js —— 工具模块：快速笔记 / 清单 / 提醒（localStorage 持久化，离线可用）
 * 数据全部存手机本地，不依赖服务器
 */
(function () {
  'use strict';

  /* ===== 通用：localStorage 读写 ===== */
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  const LS = {
    notes: 'toolbox.notes',
    todos: 'toolbox.todos',
    reminders: 'toolbox.reminders'
  };

  /* ===== 笔记 ===== */
  const notes = load(LS.notes, []);
  const noteInput = document.getElementById('note-input');
  const noteList = document.getElementById('note-list');

  function renderNotes() {
    noteList.innerHTML = '';
    notes.forEach((n, i) => {
      const li = document.createElement('li');
      li.className = 'list-item';
      const txt = document.createElement('span');
      txt.className = 'txt';
      txt.textContent = n;
      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '✕';
      del.onclick = () => { notes.splice(i, 1); save(LS.notes, notes); renderNotes(); };
      li.append(txt, del);
      noteList.appendChild(li);
    });
  }
  document.getElementById('note-add').onclick = () => {
    const v = noteInput.value.trim();
    if (!v) return;
    notes.unshift(v);
    save(LS.notes, notes);
    noteInput.value = '';
    renderNotes();
  };

  /* ===== 清单 ===== */
  const todos = load(LS.todos, []);
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');

  function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'list-item' + (t.done ? ' todo-done' : '');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'todo-check';
      cb.checked = t.done;
      cb.onchange = () => { t.done = cb.checked; save(LS.todos, todos); renderTodos(); };
      const txt = document.createElement('span');
      txt.className = 'txt';
      txt.textContent = t.text;
      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '✕';
      del.onclick = () => { todos.splice(i, 1); save(LS.todos, todos); renderTodos(); };
      li.append(cb, txt, del);
      todoList.appendChild(li);
    });
  }
  document.getElementById('todo-add').onclick = () => {
    const v = todoInput.value.trim();
    if (!v) return;
    todos.push({ text: v, done: false });
    save(LS.todos, todos);
    todoInput.value = '';
    renderTodos();
  };

  /* ===== 提醒 ===== */
  const reminders = load(LS.reminders, []);
  const remindTime = document.getElementById('remind-time');
  const remindText = document.getElementById('remind-text');
  const remindList = document.getElementById('remind-list');

  function fmt(d) {
    const x = new Date(d);
    const pad = (n) => String(n).padStart(2, '0');
    return `${x.getMonth() + 1}/${x.getDate()} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
  }
  function renderReminders() {
    const now = Date.now();
    remindList.innerHTML = '';
    reminders.forEach((r, i) => {
      const overdue = new Date(r.time).getTime() <= now;
      const li = document.createElement('li');
      li.className = 'list-item' + (overdue ? ' remind-overdue' : '');
      const txt = document.createElement('span');
      txt.className = 'txt';
      txt.textContent = r.text + (overdue ? '（已到时间）' : '');
      const time = document.createElement('span');
      time.className = 'remind-time';
      time.textContent = fmt(r.time);
      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '✕';
      del.onclick = () => { reminders.splice(i, 1); save(LS.reminders, reminders); renderReminders(); };
      li.append(txt, time, del);
      remindList.appendChild(li);
    });
  }
  document.getElementById('remind-add').onclick = () => {
    const t = remindTime.value;   // datetime-local 格式 "YYYY-MM-DDTHH:mm"
    const text = remindText.value.trim();
    if (!t || !text) return;
    reminders.push({ time: new Date(t).toISOString(), text });
    save(LS.reminders, reminders);
    remindText.value = '';
    renderReminders();
  };

  /* ===== 计时器（秒表 / 倒计时）===== */
  const timerDisplay = document.getElementById('timer-display');
  const timerTip = document.getElementById('timer-tip');
  let timer = { mode: 0, running: false, startTs: 0, acc: 0, target: 0, iv: null };

  function timerFmt(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  function stopTimer(finished) {
    timer.running = false;
    clearInterval(timer.iv);
    timer.iv = null;
    document.getElementById('timer-toggle').textContent = '开始';
    if (finished) {
      // 震动 + 通知（通知需已在设置里开启）
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if ('Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) {
        navigator.serviceWorker.ready.then((reg) =>
          reg.showNotification('⏰ 倒计时结束', { body: '时间到了！', icon: './icons/icon-192.png' })
        );
      }
      timerTip.textContent = '⏰ 时间到！';
    }
  }
  function renderTimer() {
    let now;
    if (timer.mode === 0) {
      now = timer.acc + (timer.running ? Date.now() - timer.startTs : 0);   // 秒表：已过时长
    } else {
      now = timer.target - (timer.acc + (timer.running ? Date.now() - timer.startTs : 0)); // 倒计时：剩余
    }
    if (timer.mode > 0 && now <= 0) {
      timerDisplay.textContent = '00:00';
      stopTimer(true);
      return;
    }
    timerDisplay.textContent = timerFmt(now);
  }
  document.getElementById('timer-toggle').onclick = () => {
    if (timer.running) {
      timer.acc += Date.now() - timer.startTs;
      stopTimer(false);
      return;
    }
    timer.startTs = Date.now();
    timer.running = true;
    document.getElementById('timer-toggle').textContent = '暂停';
    timer.iv = setInterval(renderTimer, 100);
    timerTip.textContent = timer.mode === 0 ? '秒表计时中…' : '倒计时中…';
  };
  document.getElementById('timer-reset').onclick = () => {
    stopTimer(false);
    timer.acc = 0;
    timer.target = timer.mode === 0 ? 0 : timer.mode * 60000;
    renderTimer();
  };
  document.querySelectorAll('.timer-preset').forEach((btn) => {
    btn.onclick = () => {
      stopTimer(false);
      timer.mode = Number(btn.dataset.min);
      timer.acc = 0;
      timer.target = timer.mode === 0 ? 0 : timer.mode * 60000;
      document.querySelectorAll('.timer-preset').forEach((b) => b.classList.toggle('is-active', b === btn));
      timerTip.textContent = timer.mode === 0 ? '秒表模式：无限计时' : `${timer.mode} 分钟倒计时`;
      renderTimer();
    };
  });
  renderTimer();

  /* ===== 二维码生成（qrcode-generator 库）===== */
  const qrInput = document.getElementById('qr-input');
  const qrOut = document.getElementById('qr-out');
  const qrCanvas = document.getElementById('qr-canvas');

  document.getElementById('qr-gen').onclick = () => {
    const text = qrInput.value.trim();
    if (!text) { alert('先输入要生成的内容'); return; }
    const qr = qrcode(0, 'M');          // typeNumber=0 自动，纠错级 M
    qr.addData(text);
    qr.make();
    const cellSize = 6;
    const margin = 4;
    const n = qr.getModuleCount();
    qrCanvas.width = (n + margin * 2) * cellSize;
    qrCanvas.height = qrCanvas.width;
    const ctx = qrCanvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);
    ctx.fillStyle = '#111';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) ctx.fillRect((c + margin) * cellSize, (r + margin) * cellSize, cellSize, cellSize);
      }
    }
    qrOut.hidden = false;
  };
  document.getElementById('qr-save').onclick = () => {
    const a = document.createElement('a');
    a.href = qrCanvas.toDataURL('image/png');
    a.download = 'qrcode-' + Date.now() + '.png';
    a.click();
  };

  /* ===== 暴露接口：L5 通知用 ===== */
  window.Toolbox = Object.assign(window.Toolbox || {}, {
    tools: {
      getOverdueReminders: () => reminders.filter(r => new Date(r.time).getTime() <= Date.now())
    }
  });

  /* 首屏渲染 */
  renderNotes();
  renderTodos();
  renderReminders();
})();
