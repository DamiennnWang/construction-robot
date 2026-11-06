# 课程首页与主题展厅

[打开课程](index.html)。书名作为主标题，首页不提供返回上一页按钮。

八件三维展品与章节入口合并：点击展台底板、模型或铭牌（整张展品卡片范围）都直接进入对应章节封面，拖动不算点击。铭牌显示章名和任务数；键盘可用 Tab、Enter 进入章节。无 WebGL 时同一区域保留八个章节入口，小屏改为两列展品。“全部任务”保留搜索及章节筛选，“学习路线”保留独立章节链接。

展品默认暂停。点击“演示部件动作”可看挖掘机举臂、机械臂关节与夹爪、飞轮和扫描示意；暂停保持当前姿态，重置恢复初始姿态。安全帽与点检记录为静态展品。所有模型动作仅作教学示意，不代表真实控制性能。

首页源码为本目录 `index.template.html`、`app.js`、`scene.js` 和 `cover.css`。共用展品工厂位于 `shared/chapter-cover/exhibit-models.js`，六轴机械臂位于 `shared/workshop/six-axis.js`，与第一章复用；任务及数量来自 `course/catalog.json`。

通过 `node scripts/build.mjs 1-entry` 构建第一章和首页，使用 `npm.cmd run verify` 完成全站构建、测试、链接检查与打包。部署内容位于 `artifacts/site/`，离线包为 `artifacts/packages/course.zip`。源页面和打包页面均支持 HTTP 和 file://。

浏览器动作脚本保留在 `scripts/qa/`；本轮截图与报告分别位于 `artifacts/screenshots/hall-revision/`、`artifacts/reports/`。

首页采用左侧大书名、右侧开放展厅的封面构图。展厅无大外框，展品使用薄圆角底座，章名与任务数直接放在模型下方；各展品的相对大小用于视觉陈列，不代表真实比例。
