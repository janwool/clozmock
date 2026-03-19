import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ejs from 'ejs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const TEMPLATES = path.join(ROOT, 'templates')

// ===== Config =====
const BASE_URL = process.env.BASE_URL || 'https://3dmockup.co'
const LANGUAGES = ['en', 'zh']
const DEFAULT_LANG = 'en'

// ===== Data Loading =====
async function loadModels() {
  // Try MongoDB first
  if (process.env.MONGODB_URI) {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI)
      await client.connect()
      const db = client.db()
      const models = await db.collection('models').find({}, { projection: { _id: 0, createdAt: 0, updatedAt: 0 } }).toArray()
      await client.close()
      if (models.length > 0) {
        console.log(`Loaded ${models.length} models from MongoDB`)
        return models
      }
    } catch (err) {
      console.warn('MongoDB unavailable, falling back to model.json:', err.message)
    }
  }

  // Fallback to static file
  let raw = fs.readFileSync(path.join(ROOT, 'model.json'), 'utf-8')
  if (raw.startsWith("'")) raw = raw.slice(1)
  if (raw.endsWith("'")) raw = raw.slice(0, -1)
  console.log('Loaded models from model.json')
  return JSON.parse(raw)
}

function loadTranslation(lang) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', `${lang}.json`), 'utf-8'))
}

function loadModelTranslations(lang) {
  const filePath = path.join(ROOT, 'locales', lang, 'models.json')
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }
  return {}
}

// ===== Data Processing =====
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

// ===== File Helpers =====
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function renderTemplate(templatePath, data) {
  const fullPath = path.join(TEMPLATES, templatePath)
  const templateStr = fs.readFileSync(fullPath, 'utf-8')
  return ejs.render(templateStr, data, {
    filename: fullPath,
    views: [TEMPLATES],
  })
}

/** Render a page: first render the body template, then wrap in base layout */
function renderPage(bodyTemplatePath, pageData, layoutData) {
  const body = renderTemplate(bodyTemplatePath, pageData)
  return renderTemplate('layouts/base.ejs', { ...layoutData, body })
}

function writePage(filePath, html) {
  const fullPath = path.join(DIST, filePath)
  ensureDir(path.dirname(fullPath))
  fs.writeFileSync(fullPath, html, 'utf-8')
  console.log(`  Generated: ${filePath}`)
}

// ===== Page Generation =====
async function generatePages() {
  console.log('Loading data...')
  const models = await loadModels()
  const categories = groupByCategory(models)

  console.log(`Found ${models.length} models in ${Object.keys(categories).length} categories`)

  // Copy static assets
  ensureDir(path.join(DIST, 'assets'))
  const cssSource = path.join(TEMPLATES, 'assets', 'styles.css')
  if (fs.existsSync(cssSource)) {
    fs.copyFileSync(cssSource, path.join(DIST, 'assets', 'styles.css'))
  }
  const authModalJs = path.join(TEMPLATES, 'assets', 'auth-modal.js')
  if (fs.existsSync(authModalJs)) {
    fs.copyFileSync(authModalJs, path.join(DIST, 'assets', 'auth-modal.js'))
  }
  const detailEditorJs = path.join(TEMPLATES, 'assets', 'detail-editor.js')
  if (fs.existsSync(detailEditorJs)) {
    fs.copyFileSync(detailEditorJs, path.join(DIST, 'assets', 'detail-editor.js'))
  }
  const authStateJs = path.join(TEMPLATES, 'assets', 'auth-state.js')
  if (fs.existsSync(authStateJs)) {
    fs.copyFileSync(authStateJs, path.join(DIST, 'assets', 'auth-state.js'))
  }

  let totalPages = 0

  for (const lang of LANGUAGES) {
    console.log(`\nGenerating ${lang} pages...`)

    const t = loadTranslation(lang)
    const modelTranslations = loadModelTranslations(lang)
    const prefix = lang === DEFAULT_LANG ? '' : `${lang}/`
    const langPrefix = lang === DEFAULT_LANG ? '' : `/${lang}`

    // Shared layout data builder
    function layout(title, description, canonical, opts = {}) {
      return {
        lang,
        title,
        description,
        canonical,
        ogImage: opts.ogImage || null,
        hreflangLinks: opts.hreflangLinks || [],
        structuredData: opts.structuredData || null,
        t,
        currentPath: opts.currentPath || '/',
      }
    }

    // 1. Home
    const homeHtml = renderPage('pages/home.ejs', {
      lang, t, baseUrl: BASE_URL, categories, featuredModels: models.slice(0, 8),
    }, layout(
      t.seo.homeTitle,
      t.seo.homeDescription,
      `${BASE_URL}/${prefix}`,
      {
        ogImage: `${BASE_URL}/images/og-home.jpg`,
        hreflangLinks: [
          { lang: 'en', url: `${BASE_URL}/` },
          { lang: 'zh', url: `${BASE_URL}/zh/` },
          { lang: 'x-default', url: `${BASE_URL}/` },
        ],
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: t.site.name,
          url: BASE_URL,
          description: t.site.description,
        },
        currentPath: '/',
      }
    ))
    writePage(`${prefix}index.html`, homeHtml)
    totalPages++

    // 2. All mockups listing
    const allTitle = t.seo.categoryTitleTemplate.replace(/\{category\}/g, t.nav.mockups)
    const allDesc = t.seo.categoryDescriptionTemplate.replace(/\{category\}/g, t.nav.mockups)
    const allHtml = renderPage('pages/category.ejs', {
      lang, t, baseUrl: BASE_URL, category: 'all', models, subcategories: [], activeSubcategory: null,
    }, layout(allTitle, allDesc, `${BASE_URL}/${prefix}mockups/`, {
      ogImage: models[0] ? models[0].object.thumbnail : null,
      hreflangLinks: [
        { lang: 'en', url: `${BASE_URL}/mockups/` },
        { lang: 'zh', url: `${BASE_URL}/zh/mockups/` },
        { lang: 'x-default', url: `${BASE_URL}/mockups/` },
      ],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'All Mockups',
        numberOfItems: models.length,
        itemListElement: models.slice(0, 20).map((m, i) => ({
          '@type': 'ListItem', position: i + 1, url: `${BASE_URL}/mockups/${m.id}.html`,
        })),
      },
      currentPath: '/mockups/',
    }))
    writePage(`${prefix}mockups/index.html`, allHtml)
    totalPages++

    // 3. Category pages
    for (const [cat, catData] of Object.entries(categories)) {
      const catName = t.categories[cat] || cat
      const catTitle = t.seo.categoryTitleTemplate.replace(/\{category\}/g, catName)
      const catDesc = t.seo.categoryDescriptionTemplate.replace(/\{category\}/g, catName)

      const catHtml = renderPage('pages/category.ejs', {
        lang, t, baseUrl: BASE_URL, category: cat, models: catData.models,
        subcategories: catData.subcategories, activeSubcategory: null,
      }, layout(catTitle, catDesc, `${BASE_URL}/${prefix}mockups/${cat}/`, {
        ogImage: catData.models[0] ? catData.models[0].object.thumbnail : null,
        hreflangLinks: [
          { lang: 'en', url: `${BASE_URL}/mockups/${cat}/` },
          { lang: 'zh', url: `${BASE_URL}/zh/mockups/${cat}/` },
          { lang: 'x-default', url: `${BASE_URL}/mockups/${cat}/` },
        ],
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${catName} Mockups`,
          numberOfItems: catData.models.length,
          itemListElement: catData.models.map((m, i) => ({
            '@type': 'ListItem', position: i + 1, url: `${BASE_URL}/mockups/${m.id}.html`,
          })),
        },
        currentPath: `/mockups/${cat}/`,
      }))
      writePage(`${prefix}mockups/${cat}/index.html`, catHtml)
      totalPages++

      // 4. Subcategory pages
      for (const sub of catData.subcategories) {
        const subModels = catData.models.filter(m =>
          m.meta.subcategories && m.meta.subcategories.includes(sub)
        )
        const subName = t.subcategories[sub] || sub
        const subTitle = t.seo.categoryTitleTemplate.replace(/\{category\}/g, subName)
        const subDesc = t.seo.categoryDescriptionTemplate.replace(/\{category\}/g, subName)

        const subHtml = renderPage('pages/category.ejs', {
          lang, t, baseUrl: BASE_URL, category: cat, models: subModels,
          subcategories: catData.subcategories, activeSubcategory: sub,
        }, layout(subTitle, subDesc, `${BASE_URL}/${prefix}mockups/${cat}/${sub}/`, {
          hreflangLinks: [
            { lang: 'en', url: `${BASE_URL}/mockups/${cat}/${sub}/` },
            { lang: 'zh', url: `${BASE_URL}/zh/mockups/${cat}/${sub}/` },
            { lang: 'x-default', url: `${BASE_URL}/mockups/${cat}/${sub}/` },
          ],
          currentPath: `/mockups/${cat}/${sub}/`,
        }))
        writePage(`${prefix}mockups/${cat}/${sub}/index.html`, subHtml)
        totalPages++
      }
    }

    // 5. Model detail pages
    for (const model of models) {
      const relatedModels = getRelatedModels(model, models)
      const modelTranslation = modelTranslations[model.id] || null
      const modelTitle = modelTranslation ? modelTranslation.title : model.meta.title
      const modelDesc = modelTranslation
        ? modelTranslation.description
        : `Customize this ${model.meta.category} mockup with your design. Upload, adjust colors and background, and export high-quality 3D product images.`

      // Build structured data array: Product + optional FAQPage
      const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: modelTitle,
        description: modelDesc,
        image: model.object.thumbnail,
        category: t.categories[model.meta.category] || model.meta.category,
        offers: {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
          price: model.pro ? '9.99' : '0',
          priceCurrency: 'USD',
        },
      }

      let structuredData = productSchema
      if (modelTranslation && modelTranslation.faq && modelTranslation.faq.length > 0) {
        structuredData = [
          productSchema,
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: modelTranslation.faq.map(f => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: f.answer,
              },
            })),
          },
        ]
      }

      const detailHtml = renderPage('pages/model-detail.ejs', {
        lang, t, baseUrl: BASE_URL, model, relatedModels, modelTranslation,
      }, layout(`${modelTitle} | 3D Mockup`, modelDesc, `${BASE_URL}/${prefix}mockups/${model.id}.html`, {
        ogImage: model.object.thumbnail,
        hreflangLinks: [
          { lang: 'en', url: `${BASE_URL}/mockups/${model.id}.html` },
          { lang: 'zh', url: `${BASE_URL}/zh/mockups/${model.id}.html` },
          { lang: 'x-default', url: `${BASE_URL}/mockups/${model.id}.html` },
        ],
        structuredData,
        currentPath: `/mockups/${model.id}.html`,
      }))
      writePage(`${prefix}mockups/${model.id}.html`, detailHtml)
      totalPages++
    }

    // 6. Pricing
    const pricingHtml = renderPage('pages/pricing.ejs', {
      lang, t, baseUrl: BASE_URL,
    }, layout(t.seo.pricingTitle, t.seo.pricingDescription, `${BASE_URL}/${prefix}pricing.html`, {
      hreflangLinks: [
        { lang: 'en', url: `${BASE_URL}/pricing.html` },
        { lang: 'zh', url: `${BASE_URL}/zh/pricing.html` },
        { lang: 'x-default', url: `${BASE_URL}/pricing.html` },
      ],
      currentPath: '/pricing.html',
    }))
    writePage(`${prefix}pricing.html`, pricingHtml)
    totalPages++
  }

  // 7. Sitemap
  generateSitemap(models, categories)
  totalPages++

  // 8. Robots.txt
  generateRobotsTxt()
  totalPages++

  console.log(`\nDone! ${totalPages} files generated.`)
}

// ===== Sitemap =====
function generateSitemap(models, categories) {
  const urls = []
  const today = new Date().toISOString().split('T')[0]

  for (const lang of LANGUAGES) {
    const prefix = lang === DEFAULT_LANG ? '' : `${lang}/`

    urls.push({ loc: `${BASE_URL}/${prefix}`, changefreq: 'weekly', priority: '1.0', lastmod: today })
    urls.push({ loc: `${BASE_URL}/${prefix}pricing.html`, changefreq: 'monthly', priority: '0.7', lastmod: today })

    for (const cat of Object.keys(categories)) {
      urls.push({ loc: `${BASE_URL}/${prefix}mockups/${cat}/`, changefreq: 'weekly', priority: '0.8', lastmod: today })
    }

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
Disallow: /admin/
Disallow: /api/
`
  writePage('robots.txt', content)
}

// ===== Run =====
generatePages().catch(err => {
  console.error('Page generation failed:', err)
  process.exit(1)
})
