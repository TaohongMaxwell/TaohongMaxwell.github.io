---
name: papermod-partial-overrides
description: 覆盖 PaperMod 主题模板的约束和风险评估
metadata:
  type: project
---

Hugo 不支持 partial 继承——一旦在 `layouts/partials/` 下放了同名文件，PaperMod 主题版就完全不生效。这意味着覆盖就是"硬分叉"。

## 现有覆盖清单

| 文件 | 大小 | 风险 | 原因 |
|---|---|---|---|
| `layouts/_default/about.html` | 简化版 | 低 | PaperMod 没有 about.html，纯新增 |
| `layouts/partials/header.html` | 6361 B | **高** | 完整拷贝 PaperMod，仅改了一行 `absLangURL→relLangURL` |
| `layouts/partials/comments.html` | 2400 B | 低 | PaperMod 原版只有 154B 占位，改幅大 |
| `layouts/partials/extend_footer.html` | 1711 B | 中 | 加入 medium-zoom，PaperMod 原版为空 |
| `layouts/partials/extend_head.html` | 624 B | 低 | 只加了 MathJax partial |
| `layouts/partials/mathjax.html` | 新增 | 低 | PaperMod 没有此文件 |
| `layouts/partials/svg.html` | 1005 行 | 低 | 完整拷贝 + 1 条 icon，SVG icon 集极少变动 |

## 规则

- **尽量不覆盖** PaperMod 同名 partial。能用 `extend_head`/`extend_footer` 注入的就注入
- 必须覆盖时，**评估上游变动频率**：svg.html（极低）< extend_footer（低）< header（高）
- `header.html` 是最大维护负担——PaperMod 升级导航逻辑时必须手动 merge
- `svg.html` 的维护成本可接受——PaperMod 新增 icon 的频率极低（几个月一次）

**How to apply:** 新增 PaperMod 覆盖前，先查 [[about-layout-lesson]]，确认是否能用 Hugo 的 extend_* 钩子替代。

[[about-layout-lesson]] [[site-fixes-history]]
