# 贾宇昂的学术主页

英文首页在 `index.html`，中文首页在 `zh.html`，导航中的「博客」打开 `blog/index.html`。原有文章保存在 `2025/08/25/`，文章列表在 `archives/`。

## 自己维护时用什么

用 **GitHub Desktop** 把现有网站同步到电脑，用 **VS Code** 修改文件，用浏览器打开本地页面预览。在 GitHub Desktop 选择这个仓库后，**Repository → Show in Explorer** 会打开日常编辑的文件夹。

### 添加到 GitHub Desktop

1. 在已经下载本仓库的电脑上，选 **File → Add local repository**（Windows 快捷键 **Ctrl+O**），选择同时包含 `.git`、`blog` 和 `index.html` 的 `yuangjia.github.io` 文件夹。顶部应显示仓库名 `yuangjia.github.io`。在新电脑上可用 **File → Clone repository → URL** 克隆 GitHub 上已推送的版本。
2. 在 **File → Options → Integrations → External editor** 选择 Visual Studio Code，然后通过 **Repository → Open in Visual Studio Code** 打开仓库。[添加本地仓库](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-a-repository-from-your-local-computer-to-github-desktop) · [配置编辑器](https://docs.github.com/en/desktop/configuring-and-customizing-github-desktop/configuring-a-default-editor-in-github-desktop)

### 在本机查看旧博客

旧博客的主题和图片使用从站点根目录开始的地址。在仓库根目录打开终端，运行 `python -m http.server 8000 --bind 127.0.0.1`，在浏览器进入 [本地博客](http://127.0.0.1:8000/blog/) 或 [本地学术主页](http://127.0.0.1:8000/)。预览结束按 Ctrl+C 即可关闭服务。首次下载时的原博客版本对应提交 `d61d9f7`。

### 以后改一次内容

1. 打开 GitHub Desktop，选择这个仓库和日常发布的分支。点 **Fetch origin**；如果按钮变成 **Pull origin**，再点一次，把线上更新同步到电脑。
2. 在 VS Code 打开对应文件。例如修改实习日期时，用 **Ctrl+Shift+F** 搜 `2025.01 — 2025.08`，在 `index.html` 和 `zh.html` 中分别改好，按 **Ctrl+S** 保存。两种语言的文字独立维护。
3. 打开本地预览，刷新浏览器并切换中文，检查两种语言。回到 GitHub Desktop 的 **Changes** 查看实际改动，在 **Summary** 填一句话，例如「更新 VDIG 实习日期」。
4. 点 **Commit to main**（按钮显示你所在的分支名）保存这次修改，再点 **Push origin** 同步到 GitHub。首次合入用的临时分支需先合并到发布分支。之后在仓库的 **Actions** 查看本次 Pages 部署结果，再打开线上主页确认。[提交修改](https://docs.github.com/en/desktop/making-changes-in-a-branch/committing-and-reviewing-changes-to-your-project-in-github-desktop) · [推送修改](https://docs.github.com/en/desktop/making-changes-in-a-branch/pushing-changes-to-github-from-github-desktop)

| 要改什么 | 改哪里 |
| --- | --- |
| 姓名、研究方向、经历、学校、奖项 | 在 `index.html`、`zh.html` 搜索原文字或日期。经历、教育、奖项三段分别以 `id="experience"`、`id="education"`、`id="honors"` 标识。 |
| 新增带标志的经历或学校 | 在对应栏目的 `<ul class="records">` 里复制一条完整的 `<li class="record" …>…</li>`，替换机构名、身份、说明和日期。标志放在 `assets/`，两份 HTML 的 `class="org-logo"` 图片使用同一个文件。 |
| 增加论文 | 在两个 HTML 的对应栏目复制一段现有的 `<article>…</article>`，替换标题、作者、链接和配图；若新增至折叠列表，同时更新 `<summary>` 显示的篇数。 |
| 换照片 | 用新的 3:4 WebP 照片替换 `assets/yuang-jia.webp`。如果直接使用 JPG，就把图片放入 `assets/`，并同步改两份 HTML 的照片路径。 |
| 更新可下载的简历 | 在原简历中完成编辑，导出公开版 PDF，替换 `assets/yuang-jia-cv.pdf`。网页文字和 PDF 各自独立。 |
| 字体、段落间距、悬停效果 | 编辑 `styles.css`，两个语言版本共用这份样式。 |

## 原博客与学术主页

| 访问位置 | 本地文件 | 用途 |
| --- | --- | --- |
| `/`、`/zh.html` | `index.html`、`zh.html` | 中英文学术主页 |
| `/blog/` | `blog/index.html` | 原博客首页，保留原来的轮播和文章卡片 |
| `/2025/08/25/feedforward3dgs/` | `2025/08/25/feedforward3dgs/index.html` | FeedForward3DGS 原文 |
| `/2025/08/25/hello-world/` | `2025/08/25/hello-world/index.html` | Hello World 原文 |
| `/archives/`、`/categories/`、`/tags/`、`/about/` | 同名目录下的 `index.html` | 原有归档、分类、标签与关于页 |

`css/`、`js/`、`libs/`、`medias/`、`search.xml`、`404.html` 和 `favicon.png` 都是原博客资源。旧博客导航中的「首页」指向域名根目录，即学术主页。GitHub 仓库保存的是 Hexo 发布后的静态网站。[现有仓库](https://github.com/YuangJia/yuangjia.github.io)

## 想把新版上线时

首次整合已经准备在本地 `academic-home` 分支。确认效果后，在 Desktop 检查 **Changes**，填写说明并点 **Commit to academic-home**，再点 **Publish branch**。在 GitHub 把这个分支向 `main` 发起 Pull Request 并合并，沿用原有 Pages 发布设置。以后日常修改可以在 `main` 上提交、推送。发布完成后检查首页、中文页、博客首页和一篇旧文章。[GitHub Pages 发布设置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 以后继续用 Hexo 写博客

只改学术主页时，直接走上面的 GitHub Desktop 流程即可。以下步骤只在用 Hexo 发布博客文章时需要。

1. 在原 Hexo 源工程运行 `hexo generate`，生成的 `public/index.html` 是含有最新文章的博客首页。
2. 把这个文件更新到 **GitHub Desktop 克隆仓库的 `blog/index.html`**。把生成的文章目录（例如 `2026/`）、归档、分类、标签、搜索索引及本次更新的博客资源合并到仓库对应位置。根目录的 `index.html` 继续用来维护学术首页。
3. 在 GitHub Desktop 检查并提交这批博客改动，然后点 **Push origin**。若你的既有流程会把整个 Hexo `public/` 自动发布到同一分支，应在上传前先保存博客首页到 `public/blog/index.html`，再从学术主页的维护目录复制两份 HTML、样式与 `assets/` 到 `public/`，最后发布合并结果。[Hexo 部署说明](https://hexo.io/docs/one-command-deployment)

## 配图与版面

- 北京大学校徽（`assets/pku.svg`）取自校方《基础系统》手册第 2 页的标准圆形标志，由北大 VDIG 与北大深圳研究生院两条经历共用。[北京大学标识管理办公室](https://vim.pku.edu.cn/docs/20240527144814943256.pdf)
- 华为标志（`assets/huawei.svg`）取自华为官网使用的竖版花瓣与字标组合。[华为官网 SVG](https://www.huawei.com/-/media/htemplate-home/1.0.1.20251205144752/components/assets/img/favicon-logo.svg)
- 电子科技大学校徽（`assets/uestc.svg`）取自学校机械与电气工程学院画册封面的蓝橙色校徽。[学院官方画册](https://www.smee.uestc.edu.cn/__local/5/06/01/5768381BCB7B72F4BBCD44213B3_E65223DB_20BD48F.pdf)
- 代表作缩略图分别取自 CoSAG 图 8、CoDS 图 3 和 EA3D 图 4。每篇卡片都链接论文原文。

个人资料与论文列表的编排参考了 Jie Huang 的主页，经历和奖项的交互参考了 Jiawei Wang 的主页。[Jie Huang](https://jie-1203.github.io/) · [Jiawei Wang](https://pluswave.top/)
