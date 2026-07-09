---
name: about-layout-lesson
description: 关于 about.html 模板的坑——为什么 section 不等于 div.post-content
metadata:
  type: project
---

`layouts/_default/about.html` 曾被写成用 `<section>` 包正文，而不是 PaperMod 标准的 `<div class="post-content">`。这导致 PaperMod 所有排版 CSS 规则（段落间距 20px、h2 间距 32px、链接下划线、图片 margin）全部失效——因为这些选择器都挂在 `.post-content` 前缀下。

全局 reset `h1,h2,h3,h4,h5,h6,p { margin-top:0; margin-bottom:0 }` 把间距清零了。

**Why:** 作者 2024 年写建站教程时自己照做了教程里的模板，教程里用了 `<section>` 替代标准容器。

**How to apply:** 
- 任何使用 `layout: "about"` 的页面，正文必须包在 `<div class="post-content">` 而不是 `<section>` 里
- 不要往 about.html 里加自定义 `<style>` 块——PaperMod CSS 已经全覆盖
- 4 个页面受此影响：about.md, academic.md, skills-page.md, links.md
- 这些页面里不应该有 `<br/>` 手动造间距——CSS 已经提供了足够的段落/标题间距

[[papermad-partial-overrides]]
