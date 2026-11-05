# 智能建筑机械与机器人 · 互动课程

8 个章节、24 项活动任务。章节负责导览，任务负责教学内容；公共代码、开发产物和历史材料分别保存。

**[打开课程](course/home/index.html)** · [项目目录与修改位置](docs/项目目录.md) · [维护说明](docs/仓库维护说明.md) · [任务清单](course/catalog.json)

```text
website/
├─ course/                 课程页面与源码
│  ├─ home/                课程总入口
│  ├─ catalog.json         24 项活动任务的编号、标题和入口
│  └─ chapters/
│     ├─ 01/
│     │  ├─ overview/      第一章入口及 src/ 源码
│     │  └─ tasks/
│     │     ├─ 1-2/        施工机械三维展厅
│     │     └─ 1-3/        机器人三维展厅
│     └─ 02/ … 08/         其余章节采用相同结构
├─ shared/                 唯一公共资源目录
│  ├─ vendor/              第三方库与许可证
│  ├─ styles/              各章共用入口样式
│  ├─ navigation.js        统一站点路径解析
│  └─ 各教学主题/          章节导航、共用界面和教学组件
├─ resources/              原始资料
│  ├─ textbook/            教材来源快照
│  └─ robot-atlas/         原网址兼容跳转；完整图鉴已归档
├─ scripts/                构建、检查和打包工具
├─ docs/                   项目说明、迁移映射
├─ artifacts/              开发产物（不进入 Git）
│  ├─ screenshots/         全部检查截图及历史截图
│  ├─ packages/            课程 ZIP、模型 ZIP、迁移备份
│  ├─ reports/             检查报告和构建日志
│  ├─ builds/              个别任务的额外 HTML 构建结果
│  └─ site/                可直接部署的网站
├─ archive/                历史版本、本地工作副本、旧工具（不进入 Git）
├─ index.html              打开课程的兼容入口
└─ package.json            统一命令
```

## 日常使用

需要 Node.js 20+ 和 Python 3.9+。课程构建使用系统自带模块，无需先安装 npm 依赖。

```powershell
npm run build                       # 构建全部课程，统一公共资源引用
node scripts/build.mjs 6             # 只构建第六章（1—8 均可）
node scripts/build.mjs 6-2           # 只构建任务 6-2
npm test                            # 模型测试
npm run check                       # 页面及说明文档的本地链接
npm run verify                      # 一次完成构建、测试、链接检查和打包
npm run package                     # 网站写入 artifacts/site，ZIP 写入 artifacts/packages
npm run serve                       # 从仓库根目录提供 HTTP 预览
npm run preview                     # 只预览已打包的网站
npm run build:models                # 更新共享机器人离线资源（含机械手）
```

在 Windows PowerShell 中如 npm.ps1 被执行策略拦截，可使用 `npm.cmd`，或直接执行 scripts/ 中相应的 Node/Python 命令。

## 修改哪里

- 修改某个任务：进入 `course/chapters/章节编号/tasks/任务编号/`。有 `src/` 的任务改源码后通过统一命令构建；最初直接编写的 HTML 继续作为该任务的维护文件。
- 修改章节导览：进入该章 `overview/src/`；修改课程首页：进入 `course/home/`。
- 修改共同导航、样式和组件：只改 `shared/`；第三章入口的通用样式已提取为 `shared/styles/chapter-overview.css`，其余章节从此读取。
- 新截图放入 `artifacts/screenshots/章节或任务编号/`，新 ZIP 放入 `artifacts/packages/`。教学图片和测试输入保留在任务的 `assets/`、`qa/fixtures/` 或 `qa/source/`，不按扩展名当作截图搬走。

## 交付

先执行 `npm run build`，再执行 `npm run package`。上传 `artifacts/site/` 内的全部内容，或使用 `artifacts/packages/course.zip`；网站入口是包根目录的 `index.html`。公共资源依靠相对路径加载，必须保持目录结构。

本轮整理保留了教学内容与证据边界：任务导读、数字仿真和现场结果的含义不因目录调整而改变。

本轮改版：第一章保留机械与机器人两项三维展厅；5-3 为混凝土互动，入口名为 `index.html`；第八章合并为安全操作与保养排查。AI 修改前须阅读 [AGENTS.md](AGENTS.md) 和 [详细操作协议](docs/AI操作协议.md)。
