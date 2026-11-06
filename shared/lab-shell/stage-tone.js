/* 三维区底色（全课程统一）：近白中性灰，适合印刷教材截图；深色模式用深石墨色。
 * 取值以 shared/lab-shell/lab-shell.css 里的 --stage-bg / --stage-floor / --stage-shadow 为准（深浅色一起切换）；
 * 页面样式还没载入时（运行时才挂外壳的页面、第二章被嵌入前的原版实验页）用下面同值的后备。
 * 用法：StageTone.bg() → '#f5f6f8'；StageTone.color(THREE) → THREE.Color；
 *       StageTone.paint(scene, THREE) 设底色并让雾跟着变；StageTone.contactShadow(THREE, {size}) 模型下方的柔和接触阴影。
 * 第二章：原版实验页被嵌入时，外壳把自己的取值经 postMessage 传进来（embed-bridge.js 调 StageTone.use）。
 */
(() => {
  'use strict';
  if (window.StageTone) return;
  const FALLBACK = {
    light: {bg: '#f5f6f8', floor: '#eceef1', shadow: 'rgba(28,36,48,.20)'},
    dark: {bg: '#1a1f27', floor: '#222833', shadow: 'rgba(0,0,0,.55)'},
  };
  const root = document.documentElement;
  let cache = null, override = null;
  const theme = () => (root.dataset.theme === 'dark' ? 'dark' : 'light');
  const read = () => {
    const t = theme(), f = FALLBACK[t], cs = getComputedStyle(root);
    const v = n => cs.getPropertyValue(n).trim();
    return {theme: t, bg: v('--stage-bg') || f.bg, floor: v('--stage-floor') || f.floor, shadow: v('--stage-shadow') || f.shadow, ...(override?.[t] || {})};
  };
  const get = () => (cache && cache.theme === theme() ? cache : (cache = read()));
  addEventListener('course-theme-change', () => { cache = null; });

  window.StageTone = {
    get,
    bg: () => get().bg,
    floor: () => get().floor,
    /** 底色的 THREE.Color（传入页面自己的 THREE，模块化页面也能用）。 */
    color: (T = window.THREE, key = 'bg') => new T.Color(get()[key]),
    /** 设场景底色，雾（若有）随底色。返回 scene 便于链式调用。 */
    paint(scene, T = window.THREE) {
      if (!scene) return scene;
      const c = get().bg;
      if (scene.background?.isColor) scene.background.set(c); else scene.background = new T.Color(c);
      if (scene.fog?.color) scene.fog.color.set(c);
      return scene;
    },
    /** 模型下方的柔和接触阴影：一张径向渐变贴图的平面（不受光照影响，深浅色自动换）。
     *  size 为直径（场景单位），up 为 'y' 或 'z'（哪个轴朝上）。返回 Mesh，自己 position 到模型脚下。 */
    contactShadow(T = window.THREE, {size = 1, up = 'y', strength = 1} = {}) {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d'), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(.45, 'rgba(0,0,0,.55)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
      const tex = new T.CanvasTexture(c);
      const mat = new T.MeshBasicMaterial({map: tex, color: 0x000000, transparent: true, depthWrite: false, toneMapped: false});
      const mesh = new T.Mesh(new T.PlaneGeometry(size, size), mat);
      if (up === 'y') mesh.rotation.x = -Math.PI / 2;
      mesh.renderOrder = -1; mesh.userData.contactShadow = true;
      const tone = () => { mat.opacity = (theme() === 'dark' ? .5 : .16) * strength; };
      tone(); addEventListener('course-theme-change', tone);
      return mesh;
    },
    /** 外部指定取值（第二章嵌入时由外壳传入）；传 null 取消。 */
    use(values) { override = values; cache = null; },
    refresh() { cache = null; return get(); },
  };
})();
