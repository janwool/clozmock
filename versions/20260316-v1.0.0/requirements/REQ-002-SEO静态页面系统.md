# REQ-002: SEO 静态页面系统

## 来源
用户要求 SEO 友好，为每个模型 SEO 运营做准备，后续可方便增加模型。选择 Node.js 脚本 + 模板引擎生成原生 HTML。

## 实现细节

### 功能描述
基于 model.json 数据，使用 Node.js 脚本 + EJS 模板自动生成 SEO 优化的静态 HTML 页面。

### 需要生成的页面类型

#### 1. 首页 (`/index.html`, `/zh/index.html`)
- Hero 区域：核心价值主张 + CTA 按钮
- 热门模型展示（视频缩略图 + 悬停动画）
- 分类浏览入口（apparel, mugs, boxes, devices 等）
- 功能特性介绍
- FAQ 区域（带 Schema 结构化数据）
- 底部导航

#### 2. 分类列表页 (`/mockups/{category}/index.html`)
- 按 model.json 中的 `meta.category` 生成
- 当前分类：apparel, mugs, boxes, devices, cans, print, bottles, pouchs, tubes
- 子分类筛选（如 apparel 下的 t-shirt, hoodie, polo）
- 模型卡片列表（缩略图、名称、Free/Pro 标识）
- 面包屑导航
- 分类描述文案（SEO 用）

#### 3. 子分类列表页 (`/mockups/{category}/{subcategory}/index.html`)
- 按 `meta.subcategories` 生成
- 如 `/mockups/apparel/t-shirt/`, `/mockups/apparel/hoodie/`

#### 4. 模型详情页 (`/mockups/{model-id}.html`)
- 每个模型一个独立页面
- 模型预览（视频/图片轮播）
- 模型信息（标题、分类、标签）
- "开始设计" CTA 按钮（跳转到 Vue 编辑器）
- 相关模型推荐
- 结构化数据 (Product Schema)

#### 5. 定价页 (`/pricing.html`)
- 展示会员方案和单次购买选项

#### 6. 其他静态页面
- `/about.html` — 关于我们
- `/contact.html` — 联系方式
- `/terms.html` — 服务条款
- `/privacy.html` — 隐私政策

### URL 结构设计
```
/                                          # 首页
/mockups/                                  # 全部模型
/mockups/apparel/                          # 服装类
/mockups/apparel/t-shirt/                  # T恤子分类
/mockups/3d-oversized-tshirt-mockup-001.html  # 模型详情
/pricing                                   # 定价
/zh/                                       # 中文首页
/zh/mockups/                               # 中文模型列表
...
```

### SEO 优化要求
1. **Meta 标签**：每页独立的 title、description、keywords
2. **Open Graph**：og:title, og:description, og:image（用模型缩略图）
3. **结构化数据**：
   - 首页：Organization + FAQPage
   - 分类页：ItemList + BreadcrumbList
   - 详情页：Product + BreadcrumbList
4. **Sitemap**：自动生成 sitemap.xml
5. **Robots.txt**：配置爬虫规则
6. **语义化 HTML**：header, nav, main, article, footer
7. **Canonical URL**：防止多语言页面重复收录
8. **Hreflang 标签**：多语言页面互相引用
9. **页面加载性能**：
   - 图片懒加载
   - 缩略图使用 WebP 格式
   - 视频预加载策略
   - 关键 CSS 内联

### 多语言支持
- 默认英文 (`/`)，中文 (`/zh/`)
- 翻译数据存放在 `locales/en.json`, `locales/zh.json`
- 生成脚本一次构建输出所有语言版本
- 模型的 meta.title 和描述需要多语言翻译

### 模型可扩展性
- 新增模型只需在 model.json 中添加条目
- 重新运行生成脚本即可产出新页面
- 脚本支持增量生成模式（仅处理新增/修改的模型）

### 涉及模块
- `scripts/generate-pages.js` — 页面生成脚本
- `templates/` — 所有 EJS 模板
- `locales/` — 翻译文件

### 数据流
model.json + locales/*.json → generate-pages.js → dist/*.html + dist/sitemap.xml

### 边界条件
- model.json 中新增分类时，需自动生成对应分类页面
- 模型缩略图 URL 来自外部 CDN，需处理图片不可用的 fallback
- 多语言翻译缺失时，fallback 到英文

## 状态
- [x] 需求明确
- [x] 实现细节确定
- [ ] Plan 已生成
