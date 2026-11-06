# 任务8-1 · 安全操作

[打开当前课堂](index.html) · [本章入口](../../overview/index.html) · [项目说明](../../../../../README.md)

在三维工地暂停、发现、处置并复查临时用电、回转碰撞、夹挤、吊物、洞口与残余压力；复位不自动启动。

## 维护

- 当前配置：src/config.json；交互源码：任务 src/ 和 shared/workshop/。
- 统一任务页外壳：`src/stations.js`（含 `stations.css`）在运行时把原页面的三维场景搬进 `shared/lab-shell`，按流程分为“找出危险 / 停机处置 / 复位重启”三个工位；面板按钮转发给原页面同名按钮，状态读 `SafetyLab.state()`。构建：`python scripts/build-workshops.py 8-1` 后运行 `python scripts/finalize-pages.py`。
- 统一构建：`node scripts/build.mjs 8-1`；完整验证：`npm run verify`。
- 截图放 artifacts/screenshots/，报告放 artifacts/reports/，ZIP 放 artifacts/packages/。
- 原导读及旧方案保存在 archive/revision-20261026/lessons/，不作为当前功能说明。

## 模型与资料

[内容来源与模型说明](../../../../../docs/内容来源与模型说明.md)。三维动作与状态属于课堂模拟，不生成真实设备许可或工程验收结论。支持 HTTP、file://、键盘、小屏和无 WebGL 备用操作。
