# 任务 1-3 · 认识施工机器人

[打开展厅](index.html) · [第一章封面](../../overview/index.html)

直接选择模型、查看结构和播放动作。展品：无人机、机械臂、人形机器人、机器狗、机械手（Sharpa Wave）。

- “学习引导”说明本节目标、观察方法与回顾问题，位于“操作说明”之前。
- 拖动旋转、滚轮缩放；点击模型编号或部件索引选择部件。
- 三维区右上角可全屏／恢复，放大时保留视角与动作；Esc 返回展厅。
- 播放、暂停、单步和时间轴用于观察动作；机构滑杆用于单独调节。
- “结构观察”可展开总成、近看部件；复位恢复整机和初始姿态。
- 1600×900 布局随窗口缩放，无整页滚动；窄屏保留模型和局部滚动操作区。
- 支持主题、键盘、减少动画、离线及无 WebGL 备用投影。

页面没有作业关卡、反馈试验或观察记录。动作是教学结构示意或预制机型演示，不代表实机性能。

展品配置在 src/config.json，学习引导在 src/guide.json；共用展示在 shared/workshop/hero-gallery.js、gallery-workstation.js 和 gallery-workstation.css。构建：`node scripts/build.mjs 1-3`；完整检查：`npm run verify`。当前浏览器检查：scripts/qa/gallery-simple.cjs。

机械手采用 MuJoCo Menagerie 中的 Apache-2.0 许可机型网格，保留原始 STL 与 MJCF；可逐指调节、播放张合或依次活动、展开与复位。弯曲百分比是课堂动作量，不是实机关节读数或抓握性能。详见 [来源与许可](../../../../../shared/models/robots/sharpa-LICENSE.html)。
