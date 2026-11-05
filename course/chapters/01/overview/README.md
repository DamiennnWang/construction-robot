# 第1章 · 互动入口

[打开本章](index.html) · [课程总览](../../../home/index.html)

本章仅展示下列两项活动，保留原编号：

- [1-2 认识施工机械](../tasks/1-2/index.html)
- [1-3 认识施工机器人](../tasks/1-3/index.html)

构建：`node scripts/build.mjs 1-entry`。封面复用 `shared/styles/chapter-overview.css`，采用与第二至第七章一致的标题、展台、任务卡和顶部导航布局；通用封面模板位于 `shared/chapter-cover/`，三维模型与相机继续复用 `shared/workshop/`。活动任务及入口由 `course/catalog.json` 生成。

顶部品牌及“返回课程首页”均回到课程首页开头。支持任务预览、部件观察、播放与重置、学习导览、深色主题、键盘操作和小屏重排；无 WebGL 时保留二维操作和任务入口。

展台同时陈列挖掘机和六轴机械臂，模型、铭牌与任务卡联动预览，切换任务不移除任何展品。两件模型共享播放、暂停和复位控制；六轴机械臂为原创结构概念模型。
