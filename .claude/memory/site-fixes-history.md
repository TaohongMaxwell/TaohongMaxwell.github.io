---
name: site-fixes-history
description: 2026-07-09 全站审计修复记录——bug、影响范围、修复方式
metadata:
  type: project
---

## 2026-07-09 全站审计与修复

### 🔴 已修复（17 项，14 个 commit）

1. `content/posts/2021.12.03-iPhone-satellite-communication/index.md:6` — `cover.image: "06.iPhone13.jp"` → `.jpg`（1 字符拼写，Linux/GitHub Pages 大小写敏感 → 404）
2. `content/posts/2024.08.04-build-a-blog-...md:6-11` — 删除独立 post 的无效 cover 块（image.png 不存在，og:image 404）
3. `layouts/partials/mathjax.html:13-15` — 删除重复 MathJax script（cdnjs + jsdelivr 同 ID 导致 race condition）
4. `hugo.yaml:4,8,24` — baseURL 改小写 + languageCode→locale + languageName→label
5. 5 篇 post `cover.relative: ture` → `true`（纯拼写，PaperMod 不读此字段）
6. `academic.md:5` `imformation` → `information` + 删除 insurance post 遗留 TOML 注释
7. `layouts/_default/about.html` `<section>` → `<div class="post-content">` + 删除 broken `<style>` 块 + 删除 `<br>` → 修复 about/academic/skills-page/links 四个页面的排版间距
8. 清理 about/academic/skills-page/links.md 中所有 `<br/>` 手动间距（CSS 修复后变双重间距）
9. `layouts/partials/svg.html` 新建——加入小红书 icon（PaperMod 不含此 icon，只渲染通用链接图标）
10. `content/about.md` — OPC Peer Society → OPC Community（核实 opc.community 官网 Schema）
11. `hugo.yaml:68` — `params.description` 从 PaperMod 默认值改为站点描述（SEO 摘要）
12. `layouts/partials/svg.html:333` — 修复 `strock`→`stroke` 拼写（从 PaperMod 上游继承的 typo，git icon 缺描边）
13. `layouts/partials/svg.html:999` — `else if $icon_name`→`else`（空 icon 名无兜底）
14. 3 篇 post frontmatter — 删除 `catalog: true`（PaperMod 不读此字段，死配置）
15. `hugo.yaml:20` — 删除弃用的 `metaDataFormat: yaml`（Hugo 0.158+，自 v0.55 起默认 YAML）
16. `layouts/partials/comments.html` — `.Site.Params` → `site.Params`（Hugo 0.100+ 全局函数，不依赖 Page 上下文）
17. 第二轮 code-review 审计——5 角度 finder + 3 交叉验证 + 1 sweep，筛出并修复上述 #10-16

### 🟡 已知未修

- `layouts/partials/header.html` 硬分叉——等 PaperMod 升级时一并处理
- PaperMod 主题内 2 条 Hugo 0.158+ 弃用警告（`.Language.LanguageDirection` / `.Language.LanguageCode`）——等上游修
- 5 个 favicon 字段全指同一份 `.ico`——需不同尺寸的 PNG/SVG 文件
- 孤儿资源（static/article-img/、static/static/cursors/、多余的 avatar）——未删，不影响功能
- 所有 post 图片无 alt 文本（可访问性）

### Hugo 版本
v0.164.0 extended (Scoop 安装)

[[papermad-partial-overrides]] [[about-layout-lesson]]
