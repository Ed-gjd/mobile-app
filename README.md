# 个人工具箱 PWA

一个跑在自己电脑上的**渐进式网页应用（PWA）**：一套代码同时适配安卓和 iOS，无需上架应用商店，数据全部存在手机本地。

## 功能

- **🛠️ 工具**：快速笔记、待办清单、定时提醒、秒表/倒计时、二维码生成（数据存 localStorage，断网可用）
- **📡 硬件**：相机拍照、GPS 定位（高德地图）、语音录音、扫码（需 HTTPS 安全上下文）
- **🗂️ 项目**：项目入口卡片面板，改 `js/projects.js` 的 `LINKS` 数组即可加项目
- **⚙️ 设置**：桌面通知、4 种主题色换肤
- **离线可用**：Service Worker 缓存核心文件，断网也能打开

## 目录结构

```
mobile-app/
├── index.html         主界面（三模块 + 底部导航）
├── manifest.json      PWA 清单（可安装）
├── sw.js              Service Worker（离线缓存）
├── serve_https.py     HTTPS 服务器脚本（真机安装用）
├── css/style.css      样式（CSS 变量统一主题）
└── js/
    ├── app.js         主控：导航/状态/通知/主题
    ├── tools.js       工具模块
    ├── hardware.js    硬件模块
    ├── projects.js    项目入口
    └── lib/           第三方库（jsQR 扫码 + qrcode 生成，本地化免 CDN）
```

## 本地运行

> 真机访问必须用 **Windows 侧 Python** 起服务器——WSL2 mirrored 模式下 WSL2 内绑定的端口不会镜像到局域网接口，手机连不上。

```powershell
# HTTP（浏览 + 工具功能）
python -m http.server 8088 --directory ~/cc/mobile-app --bind 0.0.0.0

# HTTPS（硬件功能 + 真机"添加到主屏幕"）
python ~/cc/mobile-app\serve_https.py
```

手机与电脑同一 WiFi 时，访问：

- `http://192.168.1.100:8088/` — 基础浏览
- `https://192.168.1.100:8443/` — 硬件功能与安装（需先信任自签证书）

## 安全说明

- 自签证书与私钥存放在仓库**外部**的 `mobile-app-certs/`（本机专用，绝不入仓库）
- HTTPS 8443 需在系统防火墙放行（或已有规则）
- 证书有效期 825 天，到期后需重新生成

## 技术栈

纯 HTML / CSS / Vanilla JS，无框架、无后端、无构建步骤。第三方依赖仅两个 QR 库，本地化在 `js/lib/`。
