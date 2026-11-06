# 任务8-2 · 保养排查

[打开当前课堂](index.html) · [本章入口](../../overview/index.html) · [项目说明](../../../../../README.md)

喷涂、泵车、发动机与轴承四个维护工位。包含正常、堵塞、泄漏、温热、润滑不适用与资料不足等案例；移交记录保留并可导出。

## 维护

- 当前配置：src/config.json；交互源码：任务 src/ 和 shared/workshop/。
- 统一任务页外壳：`src/stations.js`、`src/stations.css`（`python scripts/build-workshops.py 8-2` 自动挂上 shared/lab-shell）。四个页签即四个工位，情境选择在三维区上方；面板里的流程按钮调用原页面的 `MaintenanceLab.dispatch`，交接记录沿用原存储 `course-maintenance-v1`。
- 统一构建：`node scripts/build.mjs 8-2`；完整验证：`npm run verify`。
- 截图放 artifacts/screenshots/，报告放 artifacts/reports/，ZIP 放 artifacts/packages/。
- 原导读及旧方案保存在 archive/revision-20261026/lessons/，不作为当前功能说明。

## 模型与资料

[内容来源与模型说明](../../../../../docs/内容来源与模型说明.md)。三维动作与状态属于课堂模拟，不生成真实设备许可或工程验收结论。支持 HTTP、file://、键盘、小屏和无 WebGL 备用操作。
