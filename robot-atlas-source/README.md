# 机器人图鉴 · 独立源码

本目录从 `robot-atlas-source.zip` 完整导入，保留原包775个文件，包括网页、16套机器人模型、原始模型源码、下载包及许可证。

- [网页入口](web/index.html)
- [原始使用说明](README-先读我.txt)
- [模型与动画清单](web/models/manifest.json)
- [模型许可核对记录](verification/model-license-review.txt)

## 本地预览

在本目录打开终端，运行：

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory web
```

然后打开 `http://127.0.0.1:8765`。页面使用本地JavaScript模块与模型资源，需要通过HTTP服务预览。修改网页只需编辑 `web/`，模型重建说明见原始使用说明。

模型、查看器及相关素材的原有许可证保留在各自目录；来源说明以原包文件为准。
