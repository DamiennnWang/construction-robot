# 任务8-2 · 保养排查

[打开当前课堂](index.html) · [本章入口](../../overview/index.html) · [项目说明](../../../../../README.md)

维修车间里的两个班后维护工位，流程相同：准备（停机/落地）→ 隔离（拔钥匙挂牌）→ 能量确认（冷却/泄压）→ 在三维模型上逐点检查 → 核对资料与材料 → 处理 → 复查或移交。

- **发动机点检**：第二章 2-1 的四缸柴油机放在发动机支架上。检查机油尺、冷却液壶、附件皮带、底部与地面；情境有班后点检、底部渗油、皮带裂纹、机油规格不明。
- **挖掘机润滑**：第二章 2-1 的挖掘机。铲斗落地、先导锁定、释放残压后，检查并加注六个铰点的黄油嘴；情境有班后润滑、动臂油缸渗漏、铲斗销松旷、润滑脂资料不明。

每个工位 4 张“试一试”。交接记录跨工位保留（localStorage `course-maintenance-v2`），可导出为 JSON，清空前需确认。

## 维护

- 源码：`src/maint.model.js`（纯状态，`qa/maintenance.test.cjs` 测试）、`src/scene.js`（三维场景）、`src/app.js`（状态与存储）、`src/stations.js` / `src/stations.css`（统一任务页外壳面板）。
- 构建：`node scripts/build.mjs 8-2`（即 `src/build.mjs`），之后运行 `python scripts/finalize-pages.py`。构建时从 `course/chapters/02/tasks/2-1/diesel-source/src/engine-lab.js` 截取 `createMultiEngine` 与 `createExcavator` 内联，并在挖掘机代码里加两处钩子（姿态由本页控制、交出动臂/斗杆/铲斗）；2-1 的源码结构变化时构建会报错提示。
- 截图放 artifacts/screenshots/，报告放 artifacts/reports/，ZIP 放 artifacts/packages/。

## 模型与资料

[内容来源与模型说明](../../../../../docs/内容来源与模型说明.md)。机型为课程原创教学模型；检查结果、材料与温度、压力读数都是课堂案例，不代表具体机型的维护规程、换油周期或润滑用量，也不生成真实设备放行或维修许可。
