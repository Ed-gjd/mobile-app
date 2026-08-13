/* projects.js —— 项目入口模块
 * 以后加新项目：往 LINKS 数组加一项即可，界面自动生成卡片
 * local: 本机/局域网服务，需手机与电脑同一网络
 * web:   公开网址，直接可开
 */
(function () {
  'use strict';

  const LINKS = [
    { icon: '📘', name: 'AWS 学习课程', desc: 'github.com/Ed-gjd/aws-course', url: 'https://github.com/Ed-gjd/aws-course', kind: 'web' },
    { icon: '🎬', name: '百炼实时语音', desc: 'github.com/Ed-gjd/bailian-learning', url: 'https://github.com/Ed-gjd/bailian-learning', kind: 'web' },
    { icon: '🧊', name: 'Three.js 课程', desc: 'github.com/Ed-gjd/threejs-course', url: 'https://github.com/Ed-gjd/threejs-course', kind: 'web' },
    { icon: '🤖', name: '具身智能课程', desc: 'github.com/Ed-gjd/embodied-ai-course', url: 'https://github.com/Ed-gjd/embodied-ai-course', kind: 'web' },
    { icon: '🖼️', name: 'ComfyUI', desc: '本机 8188（需同网）', url: 'http://192.168.1.100:8188', kind: 'local' },
    { icon: '🎨', name: 'AI 短剧知识库', desc: '本机 webdev（需同网）', url: 'http://192.168.1.100:3000', kind: 'local' }
  ];

  const grid = document.getElementById('project-grid');
  grid.innerHTML = '';
  LINKS.forEach((p) => {
    const a = document.createElement('a');
    a.className = 'project-card';
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener';

    const icon = document.createElement('span');
    icon.className = 'project-icon';
    icon.textContent = p.icon;
    const name = document.createElement('span');
    name.className = 'project-name';
    name.textContent = p.name + (p.kind === 'local' ? ' 🏠' : '');
    const desc = document.createElement('span');
    desc.className = 'project-desc';
    desc.textContent = p.desc;

    a.append(icon, name, desc);
    grid.appendChild(a);
  });

  window.Toolbox = Object.assign(window.Toolbox || {}, {
    projects: { LINKS }
  });
})();
