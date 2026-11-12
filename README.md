# Paper Reading Notes & Research Notebook

基於 Jekyll 與 GitHub Pages 的學術論文閱讀清單與筆記本。
設計理念取材自頂尖研究者的個人筆記本，具備**深色/淺色模式**、**終端機互動介面**、**分領域論文清單**、以及**支援 LaTeX 數學公式的長篇論文閱讀筆記**。

---

## 🎨 特色功能

- **獨立的 `/reading/` 論文清單頁面**：
  - 頂端自動統計各領域論文數量（Topic Chips），點選快速平滑滾動跳轉。
  - 每篇論文包含：論文標題（外連 arXiv/會議）、發表會議（如 `CVPR`、`NeurIPS`、`ICLR`）、發表年份、作者群、獲獎標籤（如 `★ Oral`、`Best Paper`）、以及重點短評（Note）。
  - 資料庫導向：只要在 `_data/reading.yml` 填入 YAML 即可輕鬆新增。
- **長篇閱讀筆記與精闢分析（`/posts/`）**：
  - 原生支援 **MathJax 3**，即時渲染 LaTeX 數學公式（如 $\Delta W = B \cdot A$）。
  - 頂部平滑閱讀進度條（Reading Progress Bar）。
  - 右側自動生成目錄（TOC）與捲動監聽（Scroll-Spy）。
- **精心調整的美學與排版**：
  - **配色**：深邃的 Obsidian Midnight 深灰藍搭配電氣薰衣草/青紫高亮（`#818CF8`）與溫暖琥珀獲獎標籤（`#F59E0B`）；淺色模式為乾淨細膩的 Slate Paper。
  - **字體**：搭配現代高質感字體 `Plus Jakarta Sans`（標題）、`Inter`（內文）與 `JetBrains Mono`（程式碼/終端機）。
- **零本地環境負擔**：
  - 內建 GitHub Actions 自動部署腳本（`.github/workflows/pages-deploy.yml`）。每次在 GitHub 網頁上修改或 push commit，GitHub 就會在雲端自動 build 並上線。

---

## 🚀 如何部署到你的 GitHub Pages

### 1. 建立 GitHub Repository
1. 在你的 GitHub 建立一個新的公開儲存庫（Public Repo）。
   - 如果希望網址是主域名 `https://<你的帳號>.github.io/`，Repo 名稱必須精確命名為：`<你的帳號>.github.io`。
   - 如果希望網址是子目錄 `https://<你的帳號>.github.io/paper-notes/`，Repo 可隨意命名（如 `paper-notes`）。
2. 將本專案的所有檔案 push 到該 GitHub Repo 的 `main`（或 `master`）分支：
   ```bash
   git init
   git add .
   git commit -m "Initialize paper reading list notebook"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/<你的Repo名稱>.git
   git push -u origin main
   ```

### 2. 開啟 GitHub Actions 部署
1. 到 GitHub 專案頁面，點選上方 **Settings** $\rightarrow$ 左側 **Pages**。
2. 在 **Build and deployment** 下方的 **Source** 下拉選單：
   - 選擇 **`GitHub Actions`**。
3. 稍等約 1~2 分鐘，Actions 執行完成後即可看見你的網站上線！

---

## 📝 日常使用手冊

### 1. 新增論文到 Reading List
打開 `_data/reading.yml`，在對應的分組下加入：
```yaml
- title: "Attention Is All You Need"
  authors: "Vaswani et al."
  venue: "NeurIPS"
  year: 2017
  award: "Classic Oral" # 選填
  url: "https://arxiv.org/abs/1706.03762"
  note: "Transformer 架構奠基之作，以 Self-Attention 取代 RNN。" # 選填
  review: "/posts/transformer-review/" # 選填，如有寫長篇筆記可連結
```

### 2. 撰寫長篇閱讀筆記
在 `_posts/` 目錄下建立檔案，檔名格式為 `YYYY-MM-DD-title.md`（例如 `2024-03-15-lora-paper-review.md`）：
```markdown
---
title: "Paper Review: 你的論文標題"
subtitle: "論文核心亮點副標題"
date: 2024-03-15 14:00:00 +0800
categories: [Paper Review, 領域]
tags: [標籤1, 標籤2]
toc: true
math: true
---

## 1. 一句話總結 (TL;DR)
這篇論文解決了...

## 2. 核心公式
$$\Delta W = B \cdot A$$
```

### 3. 修改個人資訊
打開 `_config.yml`：
- 修改 `title`、`tagline`
- 修改 `author.name`、`author.github`、`author.email`
- 如果你的 repo 是子目錄，請設定 `baseurl: "/你的Repo名稱"`

---

## 📂 專案目錄結構

```text
├── .github/workflows/
│   └── pages-deploy.yml     # GitHub Actions 雲端自動建置腳本
├── _config.yml              # 網站核心設定（作者、標題、網址）
├── _data/
│   ├── nav.yml              # 頂部導覽列連結
│   ├── reading.yml          # 論文閱讀清單資料庫
│   └── now.yml              # 當前專注研究主題
├── _layouts/                # 版面範本（home, reading, post, default）
├── _pages/                  # 各獨立頁面（reading, posts, about）
├── _posts/                  # 長篇論文閱讀筆記 Markdown 檔案
├── assets/
│   ├── css/main.scss        # 現代深色/淺色主題樣式表
│   ├── js/terminal.js       # 首頁互動終端機
│   └── js/post.js           # 閱讀進度條與自動目錄
└── index.html               # 首頁入口
```
