# 任务 1-2 · 认识施工机械

[打开展厅](index.html) · [第一章封面](../../overview/index.html)

直接选择模型、查看结构和播放动作。展品：挖掘机、推土机、装载机、塔式起重机、混凝土泵车、施工升降机。

- “学习引导”说明本节目标、观察方法与回顾问题，位于“操作说明”之前。
- 拖动旋转、滚轮缩放；点击模型编号或部件索引选择部件。
- 三维区右上角可全屏／恢复，放大时保留视角与动作；Esc 返回展厅。
- 播放、暂停、单步和时间轴用于观察动作；机构滑杆用于单独调节。
- “结构观察”可展开总成、近看部件；复位恢复整机和初始姿态。
- 1600×900 布局随窗口缩放，无整页滚动；窄屏保留模型和局部滚动操作区。
- 支持主题、键盘、减少动画、离线及无 WebGL 备用投影。

页面没有作业关卡、反馈试验或观察记录。动作是教学结构示意或预制机型演示，不代表实机性能。

展品配置在 src/config.json，学习引导在 src/guide.json；共用展示在 shared/workshop/hero-gallery.js、gallery-workstation.js 和 gallery-workstation.css。构建：`node scripts/build.mjs 1-2`；完整检查：`npm run verify`。当前浏览器检查：scripts/qa/gallery-simple.cjs。
