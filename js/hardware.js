/* hardware.js —— 硬件模块：相机 / GPS / 录音
 * 这三样都要求"安全上下文"（HTTPS 或 localhost）。
 * 在 http://局域网IP 下会失败并提示，L5 配好 HTTPS 后即可用。
 */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const camView = $('cam-view');
  const camShot = $('cam-shot');
  const camToggle = $('cam-toggle');
  const camShoot = $('cam-shoot');
  let camStream = null;
  let camOn = false;

  /* ===== 相机 ===== */
  async function toggleCamera() {
    if (camOn) {
      camStream.getTracks().forEach((t) => t.stop());
      camOn = false;
      camToggle.textContent = '打开相机';
      camShoot.disabled = true;
      camView.hidden = true;
      camShot.hidden = true;
      return;
    }
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      camView.srcObject = camStream;
      camView.hidden = false;
      camShot.hidden = true;
      camOn = true;
      camToggle.textContent = '关闭相机';
      camShoot.disabled = false;
    } catch (e) {
      alert('相机不可用：' + (e.message || e) + '\n（硬件功能需要 HTTPS，见 L5）');
    }
  }
  camToggle.onclick = toggleCamera;

  /* 拍照：把视频当前帧画到 canvas，生成图片下载 */
  camShoot.onclick = () => {
    const ctx = camShot.getContext('2d');
    camShot.width = camView.videoWidth;
    camShot.height = camView.videoHeight;
    ctx.drawImage(camView, 0, 0);
    camShot.hidden = false;
    // 触发浏览器下载
    const a = document.createElement('a');
    a.href = camShot.toDataURL('image/png');
    a.download = 'photo-' + Date.now() + '.png';
    a.click();
  };

  /* ===== GPS ===== */
  const gpsOut = $('gps-out');
  $('gps-get').onclick = () => {
    gpsOut.textContent = '定位中…';
    if (!navigator.geolocation) {
      gpsOut.textContent = '此浏览器不支持定位';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        // 高德地图链接（国内可用）
        const map = `https://uri.amap.com/marker?position=${lng},${lat}&name=我的位置`;
        gpsOut.textContent = `纬度 ${lat.toFixed(5)}\n经度 ${lng.toFixed(5)}\n精度 ±${Math.round(accuracy)}m`;
        const a = document.createElement('a');
        a.href = map;
        a.target = '_blank';
        a.textContent = '在地图上查看 →';
        a.className = 'btn';
        a.style.cssText = 'display:inline-block;margin-top:8px;text-decoration:none;';
        gpsOut.appendChild(document.createElement('br'));
        gpsOut.appendChild(a);
      },
      (err) => { gpsOut.textContent = '定位失败：' + err.message; },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ===== 录音 ===== */
  const recToggle = $('rec-toggle');
  const recState = $('rec-state');
  const recPlay = $('rec-play');
  let mediaRec = null;
  let recChunks = [];

  async function toggleRec() {
    if (mediaRec && mediaRec.state !== 'inactive') {
      mediaRec.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRec = new MediaRecorder(stream);
      recChunks = [];
      mediaRec.ondataavailable = (e) => { if (e.data.size) recChunks.push(e.data); };
      mediaRec.onstop = () => {
        const blob = new Blob(recChunks, { type: mediaRec.mimeType });
        recPlay.src = URL.createObjectURL(blob);
        recPlay.hidden = false;
        recPlay.controls = true;
        recState.textContent = '';
        recToggle.textContent = '开始录音';
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRec.start();
      recToggle.textContent = '停止录音';
      recState.textContent = '录音中…';
    } catch (e) {
      alert('录音不可用：' + (e.message || e) + '\n（需要 HTTPS，见 L5）');
    }
  }
  recToggle.onclick = toggleRec;

  /* ===== 扫码（jsQR 实时识别相机画面）===== */
  const scanView = $('scan-view');
  const scanToggle = $('scan-toggle');
  const scanOut = $('scan-out');
  let scanStream = null;
  let scanOn = false;
  let scanRaf = null;
  const scanCanvas = document.createElement('canvas');

  function stopScan() {
    scanOn = false;
    cancelAnimationFrame(scanRaf);
    if (scanStream) scanStream.getTracks().forEach((t) => t.stop());
    scanView.hidden = true;
    scanToggle.textContent = '打开扫码';
  }

  function scanLoop() {
    if (!scanOn) return;
    scanRaf = requestAnimationFrame(scanLoop);
    if (scanView.readyState !== 4) return; // 等视频帧就绪
    const ctx = scanCanvas.getContext('2d', { willReadFrequently: true });
    scanCanvas.width = scanView.videoWidth;
    scanCanvas.height = scanView.videoHeight;
    ctx.drawImage(scanView, 0, 0);
    const img = ctx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    if (code && code.data) {
      navigator.vibrate ? navigator.vibrate(80) : 0;
      scanOut.textContent = '识别到：' + code.data;
      if (/^https?:\/\//.test(code.data)) {          // 是链接就给个可点的
        const a = document.createElement('a');
        a.href = code.data;
        a.target = '_blank';
        a.textContent = '打开链接 →';
        a.style.cssText = 'display:inline-block;margin-top:8px;color:var(--accent);';
        scanOut.appendChild(document.createElement('br'));
        scanOut.appendChild(a);
      }
      stopScan();
    }
  }

  async function startScan() {
    try {
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      scanView.srcObject = scanStream;
      scanView.hidden = false;
      scanToggle.textContent = '关闭扫码';
      scanOn = true;
      scanOut.textContent = '对准二维码…';
      scanLoop();
    } catch (e) {
      alert('相机不可用：' + (e.message || e) + '\n（扫码需要 HTTPS，见 L5）');
    }
  }
  scanToggle.onclick = () => { scanOn ? stopScan() : startScan(); };

  window.Toolbox = Object.assign(window.Toolbox || {}, { hardware: {} });
})();
