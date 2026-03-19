# Coding Plan: REQ-006 模型管理与扩展性

## 概述
确保系统架构支持模型库持续增长。本 Plan 涵盖：模型数据验证（已在 REQ-002 中实现）、新增模型工作流脚手架、自动化构建部署流程。

## 前置条件
- PLAN-REQ-001 和 PLAN-REQ-002 完成
- `scripts/validate-models.js` 已创建

## 实现步骤

### Step 1: 创建新增模型辅助脚本

**目标**: 提供交互式脚本辅助新增模型，确保数据格式正确

**涉及文件**:
- `scripts/add-model.js` - 新建

**代码变更**:

`scripts/add-model.js`：
```javascript
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MODEL_FILE = path.join(ROOT, 'model.json')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(resolve => rl.question(q, resolve))

const CATEGORIES = ['apparel', 'mugs', 'boxes', 'devices', 'cans', 'print', 'bottles', 'pouchs', 'tubes']

async function main() {
  console.log('=== Add New Model ===\n')

  const id = await ask('Model ID (e.g., 3d-animated-mug-mockup-006): ')
  const name = await ask('Model name: ')
  const category = await ask(`Category (${CATEGORIES.join(', ')}): `)
  const subcategory = await ask('Subcategory (e.g., mug, t-shirt): ')
  const isPro = (await ask('Is Pro? (y/n): ')).toLowerCase() === 'y'
  const glbUrl = await ask('GLB file URL: ')
  const thumbnailUrl = await ask('Thumbnail URL: ')
  const title = await ask('SEO title: ')

  // 验证 category
  if (!CATEGORIES.includes(category)) {
    console.log(`Note: "${category}" is a new category. It will be created automatically.`)
  }

  const newModel = {
    id,
    name,
    pro: isPro,
    object: {
      url: glbUrl,
      thumbnail: thumbnailUrl,
      'preview-thumbnail': thumbnailUrl,
      videoThumbnail: '',
      elements: [],
    },
    scene: {
      dimensions: { width: 560, height: 700 },
      position: { y: 0, x: 0 },
      rotation: { y: 1 },
    },
    guide: {},
    controls: {
      distance: { max: 10, min: 5 },
    },
    camera: {
      position: { x: 4, y: 2, z: 0 },
      perspective: { fov: 35, aspect: 1.4, near: 0.1, far: 1000 },
    },
    designs: [],
    background: true,
    meta: {
      title,
      category,
      subcategories: [subcategory],
      tags: [],
    },
  }

  // 读取现有数据
  let raw = fs.readFileSync(MODEL_FILE, 'utf-8')
  if (raw.startsWith("'")) raw = raw.slice(1)
  if (raw.endsWith("'")) raw = raw.slice(0, -1)
  const models = JSON.parse(raw)

  // 检查 ID 唯一性
  if (models.find(m => m.id === id)) {
    console.error(`Error: Model with ID "${id}" already exists.`)
    rl.close()
    process.exit(1)
  }

  models.push(newModel)
  fs.writeFileSync(MODEL_FILE, JSON.stringify(models, null, 4), 'utf-8')

  console.log(`\nModel "${id}" added successfully!`)
  console.log('Next steps:')
  console.log('  1. Update elements, designs, camera settings in model.json')
  console.log('  2. Add translations to locales/en/models.json and locales/zh/models.json')
  console.log('  3. Run: npm run validate')
  console.log('  4. Run: npm run generate')

  rl.close()
}

main().catch(console.error)
```

**注意事项**: 这个脚本生成模型模板数据，细节参数（elements、designs、camera 等）需要手动根据实际 GLB 模型调整。

---

### Step 2: 构建与部署自动化

**目标**: 完善 package.json 的构建脚本

**涉及文件**:
- `package.json` - 修改

**代码变更**:

在 `package.json` 的 `scripts` 中补充：
```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run validate && npm run generate && npm run build:vue",
    "build:vue": "vite build",
    "generate": "node scripts/generate-pages.js",
    "validate": "node scripts/validate-models.js",
    "add-model": "node scripts/add-model.js",
    "preview": "vite preview",
    "deploy": "npm run build && firebase deploy",
    "deploy:hosting": "npm run build && firebase deploy --only hosting",
    "deploy:functions": "cd functions && npm run build && cd .. && firebase deploy --only functions"
  }
}
```

---

### Step 3: 模型数据的 SEO 扩展字段

**目标**: 支持每个模型携带自定义 SEO 内容，用于内容运营

**涉及文件**:
- `locales/en/models.json` - 完善模板
- `scripts/generate-pages.js` - 修改（已在 REQ-002 中处理，此处补充长描述支持）

**代码变更**:

`locales/en/models.json` 完整模板：
```json
{
  "3d-oversized-tshirt-mockup-001": {
    "title": "3D Oversized T-Shirt Mockup",
    "description": "Showcase your t-shirt designs with this realistic 3D oversized t-shirt mockup. Customize colors, upload your artwork, and export professional product images.",
    "longDescription": "This premium 3D oversized t-shirt mockup lets you present your apparel designs in a professional and eye-catching way. Perfect for fashion designers, print-on-demand sellers, and brand owners. Features include real-time 3D preview, color customization for body and neckline, and high-resolution export options.",
    "seoKeywords": ["3d t-shirt mockup", "oversized tshirt mockup", "free tshirt mockup generator"],
    "faq": [
      {
        "question": "How do I use this t-shirt mockup?",
        "answer": "Click 'Start Designing', upload your design image, adjust colors and background, then export your mockup."
      },
      {
        "question": "What file format should I upload?",
        "answer": "We support PNG, JPG, and SVG formats. For best results, use a PNG with transparent background."
      }
    ]
  }
}
```

模型详情页模板更新 — 在 `templates/pages/model-detail.ejs` 中添加 FAQ 和长描述支持：

在现有模型详情模板的相关模型区域之前插入：
```ejs
${modelTranslation && modelTranslation.longDescription ? `
<section class="model-long-description">
  <div class="container">
    <h2>About This Mockup</h2>
    <p>${modelTranslation.longDescription}</p>
  </div>
</section>
` : ''}

${modelTranslation && modelTranslation.faq && modelTranslation.faq.length > 0 ? `
<section class="model-faq">
  <div class="container">
    <h2>Frequently Asked Questions</h2>
    <div itemscope itemtype="https://schema.org/FAQPage">
      ${modelTranslation.faq.map(f => `
        <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" class="faq-item">
          <h3 itemprop="name">${f.question}</h3>
          <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <p itemprop="text">${f.answer}</p>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</section>
` : ''}
```

同时在结构化数据中添加 FAQPage 支持：当模型有 FAQ 数据时，生成 FAQPage Schema。

---

## 验证方式
1. `npm run add-model` 交互式脚本可成功添加新模型到 model.json
2. `npm run validate` 验证新增模型数据完整性
3. `npm run build` 完整构建流程通过（验证 → 生成 → Vue 构建）
4. 新增模型的 SEO 扩展字段（长描述、FAQ）正确渲染在详情页中
5. FAQ 区域的 Schema 结构化数据正确生成

## 风险点
- 交互式脚本依赖 stdin，CI 环境中需提供其他方式（如 JSON 文件导入）
- 模型数量超过几百个后 model.json 会变大，可能需要拆分或迁移到数据库
- SEO 内容运营需要持续维护翻译文件
