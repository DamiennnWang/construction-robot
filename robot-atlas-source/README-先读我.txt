机器图鉴 · 完整源码与模型源文件

这是已发布版本的源码交付，含 16 款模型、32 种演示动作及初始姿态。
原始网站源提交：8aff6d436673ffdf30d6181315fe6c43c2339037
模型源固定提交：f3b6013629c7b94f8ee93fd977b161fa8350f9bc

一、直接运行网页
安装 Python（验证环境为 Python 3.12），在本目录运行：
    python -m http.server 8765 --bind 127.0.0.1 --directory web
浏览器打开 http://127.0.0.1:8765 。Windows 也可运行 START.ps1。
网页为 HTML/CSS/JavaScript 静态站，不需要 npm、API 密钥或登录服务。
不要直接双击 index.html：JavaScript 模块与本地 fetch 需要 HTTP 服务。

二、文件说明
web/index.html              页面结构
web/style.css               浅色/深色样式与响应式布局
web/app.js                  展品数据、动作播放、主题、搜索和下载交互
web/models/                 含动画的 GLB 与动画清单
web/licenses/               16 款模型的完整上游许可证
web/downloads/              单款和分类下载 ZIP
web/vendor/                 model-viewer 查看器及其许可
model-source/               全部 16 款模型的原始 MJCF、网格、README 和 LICENSE
scripts/build_animated_models.py  从原始模型生成含动作的 GLB
scripts/package_models.py   生成单款、分类及完整合集 ZIP
scripts/optimize_images.py  生成网页缩略图
scripts/verify_animations.py 验证动画轨道与下载包
verification/               逐模型开源复核报告与机器可读校验结果

三、修改与重新生成模型
仅修改网页不需要安装下面的 Python 建模依赖。
如果需要修改动作或重新转换模型，先运行：
    python -m pip install -r requirements.txt
然后依次运行：
    python scripts/build_animated_models.py
    python scripts/optimize_images.py
    python scripts/package_models.py
    python scripts/verify_animations.py
完整模型合集会写到 artifacts/robot-atlas-all-models.zip。
修改网页文案或展品信息：编辑 web/app.js；修改布局：编辑 web/index.html 与 web/style.css。

四、授权与模型范围
模型分别采用 BSD-3-Clause、Apache-2.0 或 MIT；逐项见 verification/。
请保留每款模型原有的许可和版权声明，不能把模型本体统一改标为网页代码的许可。
开源范围是这里使用的三维仿真模型，不代表商业机器人整机硬件、固件、控制策略及商标全部开源。
动作是人工编排的运动学示意，不含动力学/碰撞验证，也不代表实机能力。
网页与自编脚本供你继续修改使用；第三方资产始终依各自原始许可证使用。

本包包含模型的原始源文件，因此解压后约 570 MB。
没有包含 Git 历史、账号凭据、部署身份或私有访问令牌。
