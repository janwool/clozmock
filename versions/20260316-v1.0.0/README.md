# 版本 v1.0.0

- **创建日期**: 2026-03-16
- **状态**: Plan 已生成

## 目标

构建 3D Mockup 在线设计 SaaS 平台的完整 MVP 版本，支持用户浏览、定制和导出 3D 产品样机，具备 SEO 友好的静态页面、会员订阅和单次购买体系、多语言支持，并为后续模型扩展奠定架构基础。

## 范围

### 核心功能
1. **SEO 静态页面系统** — Node.js + EJS 从 model.json 生成首页、分类页、模型详情页等完整静态 HTML
2. **3D 编辑器** — Vue 3 + Three.js 实时 3D 预览、设计图贴图、颜色/背景自定义、导出
3. **会员与支付** — Firebase Auth + Lemon Squeezy，Free/Pro 订阅 + 单次购买
4. **多语言** — 英文 + 中文，静态页面多语言路径 + Vue 应用 vue-i18n
5. **模型扩展性** — 新增模型辅助脚本、数据验证、增量构建

### 技术架构
- **SEO 层**: Node.js + EJS 静态页面生成
- **交互层**: Vue 3 + Vite MPA（编辑器 + 仪表盘）
- **后端**: Firebase (Auth / Firestore / Cloud Functions / Hosting)
- **支付**: Lemon Squeezy
- **3D**: Three.js (GLTFLoader)

### 模型数据
- 当前 48 个模型，9 个分类
- 支持 Free/Pro 双版本模型

## Plan 文件列表
| Plan | 需求 | 描述 |
|------|------|------|
| PLAN-REQ-001 | 项目架构与技术栈 | 项目初始化、目录结构、Vite/Vue/Firebase/TS 配置 |
| PLAN-REQ-002 | SEO 静态页面系统 | EJS 模板、页面生成脚本、sitemap、多语言翻译文件 |
| PLAN-REQ-003 | 3D 编辑器 | Three.js 场景管理、模型加载、贴图、颜色、导出 |
| PLAN-REQ-004 | 会员与支付系统 | Firebase Auth、Lemon Squeezy Webhook、用户仪表盘 |
| PLAN-REQ-005 | 多语言支持 | vue-i18n 配置、语言检测与切换 |
| PLAN-REQ-006 | 模型管理与扩展性 | 新增模型脚本、数据验证、SEO 扩展字段 |
