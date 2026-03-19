# Coding Plan: REQ-002 SEO 静态页面系统

## 概述
构建基于 Node.js + EJS 的静态页面生成系统，从 model.json 读取数据，生成 SEO 优化的首页、分类页、子分类页、模型详情页及其他静态页面，支持多语言，自动生成 sitemap.xml 和 robots.txt。

## 前置条件
- PLAN-REQ-001 完成（项目基础架构已搭建）
- `npm install` 完成，EJS 依赖可用
- `locales/` 目录已存在

## 实现步骤

### Step 1: 创建共享 CSS 样式（静态页面用）

**目标**: 为静态 HTML 页面创建独立的 CSS 文件，不依赖 Vue/Vite 构建链

**涉及文件**:
- `templates/assets/styles.css` - 新建

**代码变更**:

`templates/assets/styles.css`：
```css
/* 使用 CDN 版 Tailwind CSS 的预构建方案不适合生产环境 */
/* 这里编写手写的 CSS 或在构建脚本中用 Tailwind CLI 处理 */

/* === Reset & Base === */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-primary-light: #60a5fa;
  --color-bg: #ffffff;
  --color-bg-alt: #f8fafc;
  --color-text: #1e293b;
  --color-text-secondary: #64748b;
  --color-border: #e2e8f0;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --max-width: 1280px;
}

body {
  font-family: var(--font-sans);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.6;
}

/* === Layout === */
.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* === 更多样式在后续步骤中逐步添加 === */
```

**注意事项**: 可后续引入 Tailwind CLI 来处理静态页面的样式，但初始阶段用手写 CSS 保持简单。

---

### Step 2: 创建翻译文件

**目标**: 建立多语言翻译数据结构

**涉及文件**:
- `locales/en.json` - 新建
- `locales/zh.json` - 新建
- `locales/en/models.json` - 新建
- `locales/zh/models.json` - 新建

**代码变更**:

`locales/en.json`：
```json
{
  "site": {
    "name": "3D Mockup",
    "tagline": "Create Stunning 3D Mockups Online",
    "description": "Free online 3D mockup generator. Upload your design, customize colors and backgrounds, and download high-quality 3D product mockups."
  },
  "nav": {
    "home": "Home",
    "mockups": "Mockups",
    "pricing": "Pricing",
    "login": "Log In",
    "signup": "Sign Up",
    "dashboard": "Dashboard"
  },
  "hero": {
    "title": "Create Stunning 3D Mockups in Seconds",
    "subtitle": "Upload your design, customize your 3D model, and download professional product mockups — no design skills needed.",
    "cta": "Start Designing",
    "cta_secondary": "Browse Mockups"
  },
  "categories": {
    "apparel": "Apparel",
    "mugs": "Mugs",
    "boxes": "Boxes",
    "devices": "Devices",
    "cans": "Cans",
    "print": "Print",
    "bottles": "Bottles",
    "pouchs": "Pouches",
    "tubes": "Tubes"
  },
  "subcategories": {
    "t-shirt": "T-Shirt",
    "hoodie": "Hoodie",
    "polo": "Polo T-Shirt",
    "mug": "Mug",
    "box": "Box",
    "can": "Can",
    "iphone": "iPhone",
    "business-card": "Business Card",
    "book": "Book",
    "bottle": "Bottle",
    "pouch": "Pouch",
    "tube": "Tube"
  },
  "model": {
    "startDesign": "Start Designing",
    "free": "Free",
    "pro": "Pro",
    "relatedMockups": "Related Mockups",
    "features": "Features",
    "animationPreview": "Animation Preview"
  },
  "pricing": {
    "title": "Simple, Transparent Pricing",
    "subtitle": "Choose the plan that works for you",
    "free": "Free",
    "pro": "Pro",
    "monthly": "Monthly",
    "yearly": "Yearly",
    "perMonth": "/month",
    "perYear": "/year",
    "subscribe": "Subscribe",
    "currentPlan": "Current Plan",
    "singlePurchase": "Or buy individual mockups"
  },
  "footer": {
    "about": "About",
    "contact": "Contact",
    "terms": "Terms of Service",
    "privacy": "Privacy Policy",
    "copyright": "© 2026 3D Mockup. All rights reserved."
  },
  "seo": {
    "homeTitle": "Free Online 3D Mockup Generator | Create Professional Product Mockups",
    "homeDescription": "Generate stunning 3D product mockups online for free. Customize t-shirts, mugs, boxes, phone cases and more with our easy-to-use 3D mockup generator.",
    "categoryTitleTemplate": "Free 3D {category} Mockups | Online {category} Mockup Generator",
    "categoryDescriptionTemplate": "Browse and customize free 3D {category} mockups online. Upload your design and create professional product mockups in seconds.",
    "pricingTitle": "Pricing | 3D Mockup - Pro Plans & Single Purchases",
    "pricingDescription": "Choose from free and pro plans. Get unlimited access to all 3D mockups or purchase individual templates."
  }
}
```

`locales/zh.json`：
```json
{
  "site": {
    "name": "3D Mockup",
    "tagline": "在线创建精美 3D 样机",
    "description": "免费在线 3D 样机生成器。上传你的设计，自定义颜色和背景，下载高质量 3D 产品样机图。"
  },
  "nav": {
    "home": "首页",
    "mockups": "样机模型",
    "pricing": "价格",
    "login": "登录",
    "signup": "注册",
    "dashboard": "控制台"
  },
  "hero": {
    "title": "几秒内创建精美 3D 样机",
    "subtitle": "上传你的设计，自定义 3D 模型，下载专业产品样机 — 无需设计技能。",
    "cta": "开始设计",
    "cta_secondary": "浏览样机"
  },
  "categories": {
    "apparel": "服装",
    "mugs": "杯子",
    "boxes": "盒子",
    "devices": "电子设备",
    "cans": "易拉罐",
    "print": "印刷品",
    "bottles": "瓶子",
    "pouchs": "袋子",
    "tubes": "管子"
  },
  "subcategories": {
    "t-shirt": "T恤",
    "hoodie": "卫衣",
    "polo": "Polo衫",
    "mug": "马克杯",
    "box": "包装盒",
    "can": "易拉罐",
    "iphone": "iPhone",
    "business-card": "名片",
    "book": "书籍",
    "bottle": "瓶子",
    "pouch": "袋子",
    "tube": "管子"
  },
  "model": {
    "startDesign": "开始设计",
    "free": "免费",
    "pro": "专业版",
    "relatedMockups": "相关样机",
    "features": "功能特性",
    "animationPreview": "动画预览"
  },
  "pricing": {
    "title": "简单透明的价格",
    "subtitle": "选择适合你的方案",
    "free": "免费版",
    "pro": "专业版",
    "monthly": "月付",
    "yearly": "年付",
    "perMonth": "/月",
    "perYear": "/年",
    "subscribe": "订阅",
    "currentPlan": "当前方案",
    "singlePurchase": "或单独购买样机"
  },
  "footer": {
    "about": "关于我们",
    "contact": "联系方式",
    "terms": "服务条款",
    "privacy": "隐私政策",
    "copyright": "© 2026 3D Mockup. 保留所有权利。"
  },
  "seo": {
    "homeTitle": "免费在线 3D 样机生成器 | 创建专业产品样机图",
    "homeDescription": "免费在线生成精美 3D 产品样机。自定义 T恤、马克杯、包装盒、手机壳等产品的 3D 样机图。",
    "categoryTitleTemplate": "免费 3D {category}样机 | 在线{category}样机生成器",
    "categoryDescriptionTemplate": "浏览和自定义免费 3D {category}样机。上传你的设计，几秒内创建专业产品样机。",
    "pricingTitle": "价格方案 | 3D Mockup - 专业版套餐与单次购买",
    "pricingDescription": "选择免费或专业版方案。获取所有 3D 样机的无限使用权或单独购买模板。"
  }
}
```

`locales/en/models.json` 和 `locales/zh/models.json` — 后续补充，结构如下：
```json
{
  "3d-half-sleeved-oversized-tshirt-mockup-002": {
    "title": "3D Half Sleeved Oversized T-Shirt Mockup",
    "description": "Customize this oversized t-shirt with your design..."
  }
}
```

---

### Step 3: 创建 EJS 布局模板

**目标**: 创建 HTML 页面的公共布局模板（head、header、footer）

**涉及文件**:
- `templates/layouts/base.ejs` - 新建
- `templates/partials/head.ejs` - 新建
- `templates/partials/header.ejs` - 新建
- `templates/partials/footer.ejs` - 新建

**代码变更**:

`templates/layouts/base.ejs`：
```ejs
<!DOCTYPE html>
<html lang="<%= lang %>">
<head>
  <%- include('../partials/head', { title, description, canonical, ogImage, hreflangLinks, structuredData }) %>
</head>
<body>
  <%- include('../partials/header', { t, lang, currentPath }) %>

  <main>
    <%- body %>
  </main>

  <%- include('../partials/footer', { t, lang }) %>
</body>
</html>
```

`templates/partials/head.ejs`：
```ejs
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><%= title %></title>
<meta name="description" content="<%= description %>">

<!-- Canonical -->
<link rel="canonical" href="<%= canonical %>">

<!-- Hreflang -->
<% hreflangLinks.forEach(function(link) { %>
<link rel="alternate" hreflang="<%= link.lang %>" href="<%= link.url %>">
<% }) %>

<!-- Open Graph -->
<meta property="og:title" content="<%= title %>">
<meta property="og:description" content="<%= description %>">
<meta property="og:type" content="website">
<meta property="og:url" content="<%= canonical %>">
<% if (ogImage) { %>
<meta property="og:image" content="<%= ogImage %>">
<% } %>

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<%= title %>">
<meta name="twitter:description" content="<%= description %>">

<!-- Structured Data -->
<% if (structuredData) { %>
<script type="application/ld+json"><%- JSON.stringify(structuredData) %></script>
<% } %>

<!-- Styles -->
<link rel="stylesheet" href="/assets/styles.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
```

`templates/partials/header.ejs`：
```ejs
<header class="site-header">
  <div class="container header-inner">
    <a href="<%= lang === 'en' ? '/' : '/' + lang + '/' %>" class="logo">
      <span class="logo-text"><%= t.site.name %></span>
    </a>

    <nav class="main-nav">
      <a href="<%= lang === 'en' ? '/mockups/' : '/' + lang + '/mockups/' %>"><%= t.nav.mockups %></a>
      <a href="<%= lang === 'en' ? '/pricing' : '/' + lang + '/pricing' %>"><%= t.nav.pricing %></a>
    </nav>

    <div class="header-actions">
      <!-- 语言切换 -->
      <div class="lang-switcher">
        <a href="/" class="<%= lang === 'en' ? 'active' : '' %>">EN</a>
        <a href="/zh/" class="<%= lang === 'zh' ? 'active' : '' %>">中文</a>
      </div>

      <a href="/dashboard/" class="btn btn-outline"><%= t.nav.login %></a>
      <a href="/dashboard/" class="btn btn-primary"><%= t.nav.signup %></a>
    </div>
  </div>
</header>
```

`templates/partials/footer.ejs`：
```ejs
<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <span class="logo-text"><%= t.site.name %></span>
      <p><%= t.site.tagline %></p>
    </div>

    <div class="footer-links">
      <div class="footer-column">
        <h4><%= t.nav.mockups %></h4>
        <% Object.keys(t.categories).forEach(function(cat) { %>
        <a href="<%= lang === 'en' ? '/mockups/' + cat + '/' : '/' + lang + '/mockups/' + cat + '/' %>">
          <%= t.categories[cat] %>
        </a>
        <% }) %>
      </div>

      <div class="footer-column">
        <h4>Company</h4>
        <a href="<%= lang === 'en' ? '/about' : '/' + lang + '/about' %>"><%= t.footer.about %></a>
        <a href="<%= lang === 'en' ? '/contact' : '/' + lang + '/contact' %>"><%= t.footer.contact %></a>
        <a href="<%= lang === 'en' ? '/terms' : '/' + lang + '/terms' %>"><%= t.footer.terms %></a>
        <a href="<%= lang === 'en' ? '/privacy' : '/' + lang + '/privacy' %>"><%= t.footer.privacy %></a>
      </div>
    </div>

    <div class="footer-bottom">
      <p><%= t.footer.copyright %></p>
    </div>
  </div>
</footer>
```

---

### Step 4: 创建首页模板

**目标**: 创建 SEO 优化的首页模板

**涉及文件**:
- `templates/pages/home.ejs` - 新建

**代码变更**:

`templates/pages/home.ejs`：
```ejs
<% var body = `
<section class="hero">
  <div class="container">
    <h1>${t.hero.title}</h1>
    <p class="hero-subtitle">${t.hero.subtitle}</p>
    <div class="hero-cta">
      <a href="${lang === 'en' ? '/mockups/' : '/' + lang + '/mockups/'}" class="btn btn-primary btn-lg">${t.hero.cta_secondary}</a>
    </div>
  </div>
</section>

<section class="categories-section">
  <div class="container">
    <h2>Browse by Category</h2>
    <div class="category-grid">
      ${Object.keys(categories).map(cat => `
        <a href="${lang === 'en' ? '/mockups/' + cat + '/' : '/' + lang + '/mockups/' + cat + '/'}" class="category-card">
          <div class="category-preview">
            ${categories[cat].preview ? '<img src="' + categories[cat].preview + '" alt="' + t.categories[cat] + '" loading="lazy" />' : ''}
          </div>
          <h3>${t.categories[cat]}</h3>
          <span class="category-count">${categories[cat].count} mockups</span>
        </a>
      `).join('')}
    </div>
  </div>
</section>

<section class="featured-section">
  <div class="container">
    <h2>Popular Mockups</h2>
    <div class="model-grid">
      ${featuredModels.map(model => `
        <a href="${lang === 'en' ? '/mockups/' + model.id + '.html' : '/' + lang + '/mockups/' + model.id + '.html'}" class="model-card">
          <div class="model-preview">
            <img src="${model.object.thumbnail}" alt="${model.meta.title}" loading="lazy" width="400" height="300" />
            ${model.pro ? '<span class="badge badge-pro">' + t.model.pro + '</span>' : '<span class="badge badge-free">' + t.model.free + '</span>'}
          </div>
          <h3>${model.meta.title}</h3>
        </a>
      `).join('')}
    </div>
  </div>
</section>

<section class="features-section">
  <div class="container">
    <h2>Why Choose 3D Mockup?</h2>
    <div class="features-grid">
      <div class="feature-card">
        <h3>Real-time 3D Preview</h3>
        <p>See your design come to life in stunning 3D with real-time rendering.</p>
      </div>
      <div class="feature-card">
        <h3>Easy Customization</h3>
        <p>Change colors, upload designs, and adjust backgrounds with a few clicks.</p>
      </div>
      <div class="feature-card">
        <h3>High Quality Export</h3>
        <p>Download publication-ready mockup images in high resolution.</p>
      </div>
      <div class="feature-card">
        <h3>Animation Effects</h3>
        <p>Choose from 11+ animation effects to showcase your design dynamically.</p>
      </div>
    </div>
  </div>
</section>
` %>

<%- include('../layouts/base', {
  lang,
  title: t.seo.homeTitle,
  description: t.seo.homeDescription,
  canonical: baseUrl + (lang === 'en' ? '/' : '/' + lang + '/'),
  ogImage: baseUrl + '/images/og-home.jpg',
  hreflangLinks: [
    { lang: 'en', url: baseUrl + '/' },
    { lang: 'zh', url: baseUrl + '/zh/' },
    { lang: 'x-default', url: baseUrl + '/' }
  ],
  structuredData: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": t.site.name,
    "url": baseUrl,
    "description": t.site.description
  },
  t,
  currentPath: '/',
  body
}) %>
```

---

### Step 5: 创建分类列表页模板

**目标**: 创建按分类展示模型的列表页模板

**涉及文件**:
- `templates/pages/category.ejs` - 新建

**代码变更**:

`templates/pages/category.ejs`：
```ejs
<%
var categoryName = t.categories[category] || category;
var title = t.seo.categoryTitleTemplate.replace(/\{category\}/g, categoryName);
var description = t.seo.categoryDescriptionTemplate.replace(/\{category\}/g, categoryName);

var body = `
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol itemscope itemtype="https://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="${lang === 'en' ? '/' : '/' + lang + '/'}"><span itemprop="name">${t.nav.home}</span></a>
      <meta itemprop="position" content="1" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="${lang === 'en' ? '/mockups/' : '/' + lang + '/mockups/'}"><span itemprop="name">${t.nav.mockups}</span></a>
      <meta itemprop="position" content="2" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <span itemprop="name">${categoryName}</span>
      <meta itemprop="position" content="3" />
    </li>
  </ol>
</nav>

<section class="category-hero">
  <div class="container">
    <h1>3D ${categoryName} Mockups</h1>
    <p>${description}</p>
  </div>
</section>

${subcategories && subcategories.length > 1 ? `
<section class="subcategory-filter">
  <div class="container">
    <a href="${lang === 'en' ? '/mockups/' + category + '/' : '/' + lang + '/mockups/' + category + '/'}" class="filter-tag ${!activeSubcategory ? 'active' : ''}">All</a>
    ${subcategories.map(sub => `
      <a href="${lang === 'en' ? '/mockups/' + category + '/' + sub + '/' : '/' + lang + '/mockups/' + category + '/' + sub + '/'}"
         class="filter-tag ${activeSubcategory === sub ? 'active' : ''}">
        ${t.subcategories[sub] || sub}
      </a>
    `).join('')}
  </div>
</section>
` : ''}

<section class="model-list">
  <div class="container">
    <div class="model-grid">
      ${models.map(model => `
        <a href="${lang === 'en' ? '/mockups/' + model.id + '.html' : '/' + lang + '/mockups/' + model.id + '.html'}" class="model-card">
          <div class="model-preview">
            <img src="${model.object.thumbnail}" alt="${model.meta.title}" loading="lazy" width="400" height="300" />
            ${model.pro ? '<span class="badge badge-pro">' + t.model.pro + '</span>' : '<span class="badge badge-free">' + t.model.free + '</span>'}
          </div>
          <h3>${model.meta.title}</h3>
          <div class="model-tags">
            ${(model.meta.subcategories || []).map(sub => '<span class="tag">' + (t.subcategories[sub] || sub) + '</span>').join('')}
          </div>
        </a>
      `).join('')}
    </div>
  </div>
</section>
`;
%>

<%- include('../layouts/base', {
  lang,
  title,
  description,
  canonical: baseUrl + (lang === 'en' ? '/mockups/' + category + '/' : '/' + lang + '/mockups/' + category + '/'),
  ogImage: models[0] ? models[0].object.thumbnail : null,
  hreflangLinks: [
    { lang: 'en', url: baseUrl + '/mockups/' + category + '/' },
    { lang: 'zh', url: baseUrl + '/zh/mockups/' + category + '/' },
    { lang: 'x-default', url: baseUrl + '/mockups/' + category + '/' }
  ],
  structuredData: {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": categoryName + " Mockups",
    "numberOfItems": models.length,
    "itemListElement": models.map((m, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": baseUrl + '/mockups/' + m.id + '.html'
    }))
  },
  t,
  currentPath: '/mockups/' + category + '/',
  body
}) %>
```

---

### Step 6: 创建模型详情页模板

**目标**: 创建每个模型的 SEO 详情页，包含 Product Schema 结构化数据

**涉及文件**:
- `templates/pages/model-detail.ejs` - 新建

**代码变更**:

`templates/pages/model-detail.ejs`：
```ejs
<%
var modelTitle = modelTranslation ? modelTranslation.title : model.meta.title;
var modelDescription = modelTranslation ? modelTranslation.description : 'Customize this ' + model.meta.category + ' mockup with your design. Upload, adjust colors and background, and export high-quality 3D product images.';
var categoryName = t.categories[model.meta.category] || model.meta.category;

var body = `
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol itemscope itemtype="https://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="${lang === 'en' ? '/' : '/' + lang + '/'}"><span itemprop="name">${t.nav.home}</span></a>
      <meta itemprop="position" content="1" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="${lang === 'en' ? '/mockups/' : '/' + lang + '/mockups/'}"><span itemprop="name">${t.nav.mockups}</span></a>
      <meta itemprop="position" content="2" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="${lang === 'en' ? '/mockups/' + model.meta.category + '/' : '/' + lang + '/mockups/' + model.meta.category + '/'}">
        <span itemprop="name">${categoryName}</span>
      </a>
      <meta itemprop="position" content="3" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <span itemprop="name">${modelTitle}</span>
      <meta itemprop="position" content="4" />
    </li>
  </ol>
</nav>

<article class="model-detail">
  <div class="container">
    <div class="model-detail-grid">
      <!-- 左侧：预览区 -->
      <div class="model-preview-area">
        <div class="model-main-image">
          <img src="${model.object.thumbnail}" alt="${modelTitle}" width="800" height="600" />
          ${model.pro ? '<span class="badge badge-pro badge-lg">' + t.model.pro + '</span>' : '<span class="badge badge-free badge-lg">' + t.model.free + '</span>'}
        </div>

        ${model.object.videoThumbnail ? '<div class="model-video-preview"><video src="' + model.object.videoThumbnail + '" autoplay loop muted playsinline></video></div>' : ''}
      </div>

      <!-- 右侧：信息区 -->
      <div class="model-info-area">
        <h1>${modelTitle}</h1>
        <p class="model-description">${modelDescription}</p>

        <div class="model-meta">
          <span class="model-category">${categoryName}</span>
          ${(model.meta.subcategories || []).map(sub => '<span class="tag">' + (t.subcategories[sub] || sub) + '</span>').join('')}
        </div>

        <div class="model-actions">
          <a href="/editor/?model=${model.id}" class="btn btn-primary btn-lg btn-block">${t.model.startDesign}</a>
        </div>

        <div class="model-features">
          <h3>${t.model.features}</h3>
          <ul>
            <li>Design area: ${model.designs.map(d => d.width + 'x' + d.height + 'px').join(', ')}</li>
            <li>3D interactive preview</li>
            <li>${model.pro ? 'Pro model — subscription or single purchase required' : 'Free to use'}</li>
            ${Object.keys(model.object).filter(k => ['BounceDown','SpinCycle','BeatSpin','BoingPop','StageEntrance'].includes(k)).length > 0 ? '<li>Animation effects available</li>' : ''}
          </ul>
        </div>
      </div>
    </div>

    <!-- 相关模型 -->
    ${relatedModels.length > 0 ? `
    <section class="related-models">
      <h2>${t.model.relatedMockups}</h2>
      <div class="model-grid">
        ${relatedModels.map(rm => `
          <a href="${lang === 'en' ? '/mockups/' + rm.id + '.html' : '/' + lang + '/mockups/' + rm.id + '.html'}" class="model-card">
            <div class="model-preview">
              <img src="${rm.object.thumbnail}" alt="${rm.meta.title}" loading="lazy" width="400" height="300" />
              ${rm.pro ? '<span class="badge badge-pro">' + t.model.pro + '</span>' : '<span class="badge badge-free">' + t.model.free + '</span>'}
            </div>
            <h3>${rm.meta.title}</h3>
          </a>
        `).join('')}
      </div>
    </section>
    ` : ''}
  </div>
</article>
`;
%>

<%- include('../layouts/base', {
  lang,
  title: modelTitle + ' | 3D Mockup',
  description: modelDescription,
  canonical: baseUrl + (lang === 'en' ? '/mockups/' + model.id + '.html' : '/' + lang + '/mockups/' + model.id + '.html'),
  ogImage: model.object.thumbnail,
  hreflangLinks: [
    { lang: 'en', url: baseUrl + '/mockups/' + model.id + '.html' },
    { lang: 'zh', url: baseUrl + '/zh/mockups/' + model.id + '.html' },
    { lang: 'x-default', url: baseUrl + '/mockups/' + model.id + '.html' }
  ],
  structuredData: {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": modelTitle,
    "description": modelDescription,
    "image": model.object.thumbnail,
    "category": categoryName,
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "price": model.pro ? "9.99" : "0",
      "priceCurrency": "USD"
    }
  },
  t,
  currentPath: '/mockups/' + model.id + '.html',
  body
}) %>
```

---

### Step 7: 创建定价页模板

**目标**: 创建定价方案展示页

**涉及文件**:
- `templates/pages/pricing.ejs` - 新建

**代码变更**:

`templates/pages/pricing.ejs`：
```ejs
<%
var body = `
<section class="pricing-hero">
  <div class="container">
    <h1>${t.pricing.title}</h1>
    <p>${t.pricing.subtitle}</p>
  </div>
</section>

<section class="pricing-plans">
  <div class="container">
    <div class="pricing-grid">
      <!-- Free Plan -->
      <div class="pricing-card">
        <h2>${t.pricing.free}</h2>
        <div class="pricing-price">$0</div>
        <ul class="pricing-features">
          <li>Access to free mockups</li>
          <li>Basic export (with watermark)</li>
          <li>3 downloads per day</li>
          <li>Community support</li>
        </ul>
        <a href="/dashboard/" class="btn btn-outline btn-block">Get Started</a>
      </div>

      <!-- Pro Plan -->
      <div class="pricing-card pricing-card-featured">
        <h2>${t.pricing.pro}</h2>
        <div class="pricing-toggle">
          <button class="toggle-btn active" data-period="monthly">${t.pricing.monthly}</button>
          <button class="toggle-btn" data-period="yearly">${t.pricing.yearly}</button>
        </div>
        <div class="pricing-price" data-monthly="$9.99" data-yearly="$79.99">
          $9.99<span>${t.pricing.perMonth}</span>
        </div>
        <ul class="pricing-features">
          <li>All mockups (Free + Pro)</li>
          <li>High-resolution export (no watermark)</li>
          <li>Unlimited downloads</li>
          <li>Animation export</li>
          <li>Priority support</li>
        </ul>
        <a href="/dashboard/?subscribe=pro" class="btn btn-primary btn-block">${t.pricing.subscribe}</a>
      </div>
    </div>

    <!-- Single Purchase -->
    <div class="single-purchase">
      <h3>${t.pricing.singlePurchase}</h3>
      <p>Buy individual Pro mockups starting at $2.99 each. One-time payment, lifetime access.</p>
    </div>
  </div>
</section>
`;
%>

<%- include('../layouts/base', {
  lang,
  title: t.seo.pricingTitle,
  description: t.seo.pricingDescription,
  canonical: baseUrl + (lang === 'en' ? '/pricing' : '/' + lang + '/pricing'),
  ogImage: null,
  hreflangLinks: [
    { lang: 'en', url: baseUrl + '/pricing' },
    { lang: 'zh', url: baseUrl + '/zh/pricing' },
    { lang: 'x-default', url: baseUrl + '/pricing' }
  ],
  structuredData: null,
  t,
  currentPath: '/pricing',
  body
}) %>
```

---

### Step 8: 创建页面生成脚本

**目标**: 创建 Node.js 脚本，读取 model.json 和翻译文件，使用 EJS 模板生成所有静态 HTML 页面

**涉及文件**:
- `scripts/generate-pages.js` - 新建

**代码变更**:

`scripts/generate-pages.js`：
```javascript
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ejs from 'ejs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const TEMPLATES = path.join(ROOT, 'templates')

// ===== 配置 =====
const BASE_URL = process.env.BASE_URL || 'https://3dmockup.co'
const LANGUAGES = ['en', 'zh']
const DEFAULT_LANG = 'en'

// ===== 加载数据 =====
function loadModels() {
  let raw = fs.readFileSync(path.join(ROOT, 'model.json'), 'utf-8')
  // model.json 文件开头可能有单引号包裹
  if (raw.startsWith("'")) raw = raw.slice(1)
  if (raw.endsWith("'")) raw = raw.slice(0, -1)
  return JSON.parse(raw)
}

function loadTranslation(lang) {
  const filePath = path.join(ROOT, 'locales', `${lang}.json`)
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function loadModelTranslations(lang) {
  const filePath = path.join(ROOT, 'locales', lang, 'models.json')
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }
  return {}
}

// ===== 数据处理 =====
function groupByCategory(models) {
  const categories = {}
  models.forEach(model => {
    const cat = model.meta.category
    if (!categories[cat]) {
      categories[cat] = { models: [], subcategories: new Set(), preview: null, count: 0 }
    }
    categories[cat].models.push(model)
    categories[cat].count++
    if (!categories[cat].preview) {
      categories[cat].preview = model.object.thumbnail
    }
    if (model.meta.subcategories) {
      model.meta.subcategories.forEach(sub => categories[cat].subcategories.add(sub))
    }
  })
  // Convert subcategories Set to Array
  Object.keys(categories).forEach(cat => {
    categories[cat].subcategories = Array.from(categories[cat].subcategories)
  })
  return categories
}

function getRelatedModels(model, allModels, limit = 4) {
  return allModels
    .filter(m => m.id !== model.id && m.meta.category === model.meta.category)
    .slice(0, limit)
}

// ===== 文件操作 =====
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function renderTemplate(templatePath, data) {
  const templateStr = fs.readFileSync(path.join(TEMPLATES, templatePath), 'utf-8')
  return ejs.render(templateStr, data, {
    filename: path.join(TEMPLATES, templatePath),
    views: [TEMPLATES],
  })
}

function writePage(filePath, html) {
  const fullPath = path.join(DIST, filePath)
  ensureDir(path.dirname(fullPath))
  fs.writeFileSync(fullPath, html, 'utf-8')
  console.log(`  Generated: ${filePath}`)
}

// ===== 页面生成 =====
function generatePages() {
  console.log('Loading data...')
  const models = loadModels()
  const categories = groupByCategory(models)

  console.log(`Found ${models.length} models in ${Object.keys(categories).length} categories`)

  // 复制静态资源
  ensureDir(path.join(DIST, 'assets'))
  const cssSource = path.join(TEMPLATES, 'assets', 'styles.css')
  if (fs.existsSync(cssSource)) {
    fs.copyFileSync(cssSource, path.join(DIST, 'assets', 'styles.css'))
  }

  for (const lang of LANGUAGES) {
    console.log(`\nGenerating ${lang} pages...`)

    const t = loadTranslation(lang)
    const modelTranslations = loadModelTranslations(lang)
    const prefix = lang === DEFAULT_LANG ? '' : `${lang}/`

    // 1. 首页
    const featuredModels = models.slice(0, 8)
    const homeHtml = renderTemplate('pages/home.ejs', {
      lang, t, baseUrl: BASE_URL, categories, featuredModels, models,
    })
    writePage(`${prefix}index.html`, homeHtml)

    // 2. 全部模型列表页 (/mockups/)
    const allMockupsHtml = renderTemplate('pages/category.ejs', {
      lang, t, baseUrl: BASE_URL,
      category: 'all', models, subcategories: [],
      activeSubcategory: null,
    })
    writePage(`${prefix}mockups/index.html`, allMockupsHtml)

    // 3. 分类页
    for (const [cat, catData] of Object.entries(categories)) {
      const catHtml = renderTemplate('pages/category.ejs', {
        lang, t, baseUrl: BASE_URL,
        category: cat, models: catData.models,
        subcategories: catData.subcategories,
        activeSubcategory: null,
      })
      writePage(`${prefix}mockups/${cat}/index.html`, catHtml)

      // 4. 子分类页
      for (const sub of catData.subcategories) {
        const subModels = catData.models.filter(m =>
          m.meta.subcategories && m.meta.subcategories.includes(sub)
        )
        const subHtml = renderTemplate('pages/category.ejs', {
          lang, t, baseUrl: BASE_URL,
          category: cat, models: subModels,
          subcategories: catData.subcategories,
          activeSubcategory: sub,
        })
        writePage(`${prefix}mockups/${cat}/${sub}/index.html`, subHtml)
      }
    }

    // 5. 模型详情页
    for (const model of models) {
      const relatedModels = getRelatedModels(model, models)
      const modelTranslation = modelTranslations[model.id] || null
      const detailHtml = renderTemplate('pages/model-detail.ejs', {
        lang, t, baseUrl: BASE_URL,
        model, relatedModels, modelTranslation,
      })
      writePage(`${prefix}mockups/${model.id}.html`, detailHtml)
    }

    // 6. 定价页
    const pricingHtml = renderTemplate('pages/pricing.ejs', {
      lang, t, baseUrl: BASE_URL,
    })
    writePage(`${prefix}pricing.html`, pricingHtml)
  }

  // 7. 生成 sitemap.xml
  generateSitemap(models, categories)

  // 8. 生成 robots.txt
  generateRobotsTxt()

  console.log('\nDone! All pages generated.')
}

// ===== Sitemap =====
function generateSitemap(models, categories) {
  const urls = []
  const today = new Date().toISOString().split('T')[0]

  for (const lang of LANGUAGES) {
    const prefix = lang === DEFAULT_LANG ? '' : `${lang}/`

    // 首页
    urls.push({ loc: `${BASE_URL}/${prefix}`, changefreq: 'weekly', priority: '1.0', lastmod: today })

    // 定价页
    urls.push({ loc: `${BASE_URL}/${prefix}pricing.html`, changefreq: 'monthly', priority: '0.7', lastmod: today })

    // 分类页
    for (const cat of Object.keys(categories)) {
      urls.push({ loc: `${BASE_URL}/${prefix}mockups/${cat}/`, changefreq: 'weekly', priority: '0.8', lastmod: today })
    }

    // 模型详情页
    for (const model of models) {
      urls.push({ loc: `${BASE_URL}/${prefix}mockups/${model.id}.html`, changefreq: 'monthly', priority: '0.9', lastmod: today })
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  writePage('sitemap.xml', xml)
}

// ===== Robots.txt =====
function generateRobotsTxt() {
  const content = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml

Disallow: /editor/
Disallow: /dashboard/
Disallow: /api/
`
  writePage('robots.txt', content)
}

// ===== 执行 =====
generatePages()
```

---

### Step 9: 创建模型数据验证脚本

**目标**: 创建验证 model.json 数据完整性的脚本

**涉及文件**:
- `scripts/validate-models.js` - 新建

**代码变更**:

`scripts/validate-models.js`：
```javascript
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function loadModels() {
  let raw = fs.readFileSync(path.join(ROOT, 'model.json'), 'utf-8')
  if (raw.startsWith("'")) raw = raw.slice(1)
  if (raw.endsWith("'")) raw = raw.slice(0, -1)
  return JSON.parse(raw)
}

const REQUIRED_FIELDS = ['id', 'name', 'pro', 'object', 'scene', 'camera', 'designs', 'meta']
const REQUIRED_OBJECT_FIELDS = ['url', 'thumbnail']
const REQUIRED_META_FIELDS = ['title', 'category']

function validate() {
  const models = loadModels()
  let errors = 0
  let warnings = 0

  console.log(`Validating ${models.length} models...\n`)

  const ids = new Set()

  models.forEach((model, index) => {
    const prefix = `Model #${index + 1} (${model.id || 'NO ID'})`

    // 检查必填字段
    REQUIRED_FIELDS.forEach(field => {
      if (model[field] === undefined || model[field] === null) {
        console.error(`  ERROR: ${prefix} — missing required field "${field}"`)
        errors++
      }
    })

    // 检查 ID 唯一性
    if (model.id) {
      if (ids.has(model.id)) {
        console.error(`  ERROR: ${prefix} — duplicate ID`)
        errors++
      }
      ids.add(model.id)
    }

    // 检查 object 字段
    if (model.object) {
      REQUIRED_OBJECT_FIELDS.forEach(field => {
        if (!model.object[field]) {
          console.error(`  ERROR: ${prefix} — missing object.${field}`)
          errors++
        }
      })
    }

    // 检查 meta 字段
    if (model.meta) {
      REQUIRED_META_FIELDS.forEach(field => {
        if (!model.meta[field]) {
          console.error(`  ERROR: ${prefix} — missing meta.${field}`)
          errors++
        }
      })

      // 检查 tags
      if (!model.meta.tags || model.meta.tags.length === 0) {
        console.warn(`  WARN: ${prefix} — no tags defined`)
        warnings++
      }
    }

    // 检查 designs
    if (model.designs && model.designs.length > 0) {
      model.designs.forEach((design, di) => {
        if (!design.id || !design.meshId) {
          console.error(`  ERROR: ${prefix} — designs[${di}] missing id or meshId`)
          errors++
        }
        if (!design.width || !design.height) {
          console.warn(`  WARN: ${prefix} — designs[${di}] missing dimensions`)
          warnings++
        }
      })
    }

    // 检查 URL 格式
    if (model.object && model.object.url) {
      if (!model.object.url.startsWith('http')) {
        console.error(`  ERROR: ${prefix} — invalid object.url format`)
        errors++
      }
    }
  })

  console.log(`\n===== Validation Summary =====`)
  console.log(`Total models: ${models.length}`)
  console.log(`Errors: ${errors}`)
  console.log(`Warnings: ${warnings}`)

  if (errors > 0) {
    console.log('\nValidation FAILED. Please fix errors before generating pages.')
    process.exit(1)
  } else {
    console.log('\nValidation PASSED.')
  }
}

validate()
```

---

## 验证方式
1. `npm run validate` — 模型数据验证通过
2. `npm run generate` — 所有页面成功生成到 `dist/` 目录
3. 检查 `dist/` 目录结构包含：首页、分类页、详情页、定价页（中英文各一套）
4. 打开生成的 HTML 文件，验证 meta 标签、结构化数据、hreflang 标签正确
5. 验证 `dist/sitemap.xml` 包含所有页面 URL

## 风险点
- model.json 开头的单引号需要在解析时处理
- EJS 模板中嵌套 JavaScript 模板字符串时需注意转义
- 模型数量增长后生成速度需关注，可能需要并行处理
- CDN 图片 URL 可能失效，页面需有 fallback 处理
