# 网页课件（发布目录）

课程网页右上角「▶ 课件」按钮打开的翻页课件。由 `shared/theme.js` 末尾加载 `slides/deck/entry.js`。

- `deck/`：翻页引擎（deck.js / deck.css）、页面入口（entry.js）、每课内容（lessons/<任务号>.js）
- `assets/<任务号>/`：课件配图（取自课程网页三维模型的渲染图、课程截图）

本目录由仓库外的 `网页课件/tools/publish.py` 生成，改内容请改 `网页课件/deck/` 后重新发布。
