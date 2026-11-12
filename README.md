# 📚 Paper Reading Notes & Research Notebook

個人專屬的學術論文閱讀清單與深入筆記本，基於 **Jekyll** 與 **GitHub Pages** 建置。

- 🌐 **網站網址**：[https://n26092043.github.io/](https://n26092043.github.io/)
- 📖 **論文清單 (Reading List)**：[https://n26092043.github.io/reading/](https://n26092043.github.io/reading/)
- 📝 **筆記總覽 (All Notes)**：[https://n26092043.github.io/posts/](https://n26092043.github.io/posts/)
- 📦 **GitHub 儲存庫**：[https://github.com/n26092043/n26092043.github.io](https://github.com/n26092043/n26092043.github.io)

---

## ✨ 核心特色

1. **結構化論文清單 (`/reading/`)**：
   - 頂部話題膠囊（Topic Chips）：自動統計各領域論文數量，點選快速平滑滾動跳轉。
   - 每篇論文卡片：論文標題（外連 arXiv/會議）、發表會議/期刊標籤、發表年份、作者群、獲獎勳章（★ Oral / Best Paper）、核心一句話筆記（Note）。
   - 純 YAML 資料驅動，不需要碰 HTML 就能輕鬆管理成百上千篇論文。
2. **長篇深度閱讀筆記 (`/posts/`)**：
   - 原生支援 **MathJax 3**，即時渲染行內公式 `$E=mc^2$` 與獨立區塊公式 `$$\Delta W = B \cdot A$$`。
   - 頂部平滑閱讀進度條（Reading Progress Bar）。
   - 右側自動生成目錄（TOC）與即時捲動監聽（Scroll-Spy）。
3. **洗練的美學排版**：
   - **深色模式**：曜石深灰藍（Obsidian `#0A0D14`）搭配電氣薰衣草/青紫高亮（`#818CF8`）與溫暖琥珀金勳章（`#F59E0B`）。
   - **淺色模式**：細膩乾淨的 Slate Paper（`#F8FAFC`）。
   - **字體**：搭配現代學術無襯線字體 `Plus Jakarta Sans`（標題）、`Inter`（內文）與 `JetBrains Mono`（程式碼/終端機）。
4. **首頁互動終端機**：
   - 支援 `help`、`ls`、`reading`、`posts`、`whoami`、`theme` 等指令，動態檢索網站論文與筆記內容。
5. **零本地維護負擔**：
   - 雲端自動建置發布，每次只要 push 到 GitHub，幾十秒內自動重新編譯上線。

---

## 🛠️ 日常使用與更新手冊

### 一、如何新增論文到 Reading List？

所有論文清單統一在 **`_data/reading.yml`** 中管理。

#### 1. 在現有分類下新增一篇論文
打開 `_data/reading.yml`，在對應的分組（例如 `items:`）下方追加：

```yaml
      - title: "QLoRA: Efficient Finetuning of Quantized LLMs"
        authors: "Dettmers, Pagnoni, Holtzman, Zettlemoyer"
        venue: "NeurIPS"                                # 發表會議或期刊
        year: 2023                                      # 發表年份
        award: "Oral"                                   # [選填] 獲獎勳章（會帶有金黃色星號 ★）
        url: "https://arxiv.org/abs/2305.14314"         # 論文外部連結 (arXiv/會議頁面)
        note: "4-bit NormalFloat 量化與 Paged Optimizers。" # 一至兩句短評或核心概念
        review: "/posts/qlora-paper-review/"            # [選填] 若有寫長篇筆記可直接連結跳轉
```

#### 2. 新增一個全新的研究領域分類
若讀到了全新領域的論文，直接在 `groups:` 下方追加一個分類：

```yaml
  - id: agentic-ai                                      # 英文 ID（網頁錨點跳轉用）
    label: "Agentic Systems & Autonomous Agents"        # 顯示在頂部導航膠囊的名稱
    blurb: "探索具備推理、工具調用與多步驟規劃能力的自主智能體系統。" # 該分類的說明
    items:
      - title: "..."
```
> 💡 儲存後，網頁頂部會自動新增該領域的膠囊，並自動統計論文數量！

---

### 二、如何新增一篇長篇深度閱讀筆記（Post）？

長篇筆記都放在 **`_posts/`** 目錄下。

#### 1. 建立 Markdown 檔案
檔名格式**必須嚴格遵循**：
`YYYY-MM-DD-你的文章英文名稱.md`  
例如：`2024-03-20-qlora-paper-review.md`

#### 2. 文章標準格式範本
檔案開頭必須包含 Front Matter（兩個 `---` 之間的設定）：

```markdown
---
title: "Paper Review: QLoRA 4-bit 量化微調解析"
subtitle: "如何用一張 48GB 顯卡微調 65B 大語言模型"
date: 2024-03-20 14:00:00 +0800
categories: [Paper Review, Efficient ML]
tags: [qlora, quantization, peft, llm]
toc: true      # 是否開啟右側目錄導航（建議 true）
math: true     # 是否啟用 LaTeX 數學公式渲染（建議 true）
---

> **Citation**: Dettmers et al. (NeurIPS 2023)  
> **Links**: [arXiv:2305.14314](https://arxiv.org/abs/2305.14314) · [Official Code](https://github.com/artidoro/qlora)

---

## 1. 一句話總結 (TL;DR)
QLoRA 將預訓練權重量化至 4-bit NormalFloat (NF4)，大幅降低微調顯存需求...

## 2. 核心公式
支援行內公式 $W \in \mathbb{R}^{d \times k}$，以及獨立區塊公式：

$$Q(X) = \text{round}\left(\frac{X}{c}\right)$$

## 3. 實驗對比

| Method | Trainable Params | GPU Memory | Performance |
| :--- | :---: | :---: | :---: |
| Full 16-bit | 100% | >780 GB | Baseline |
| QLoRA 4-bit | 0.2% | ~48 GB | 99.3% |

## 4. 我的心得與啟發
...
```

---

### 三、修改個人與網站基本設定

打開 **`_config.yml`**：
- `title`：網站標題
- `tagline`：網站副標題
- `author.name`：你的名字或暱稱
- `author.email`：你的 Email
- `author.bio`：個人一句話簡介

---

### 四、日常推播發布流程（標準 SOP）

每次在本地修改了 `_data/reading.yml` 或新增了 `_posts/*.md` 之後，打開終端機（PowerShell）：

```powershell
cd D:\projects\my-reading-list

# 1. 檢查變更
git status

# 2. 加入所有變更並建立 commit
git add .
git commit -m "Add new paper reading note"

# 3. 推送到 GitHub
git push
```

推送完成後，等待約 30~60 秒，重新整理 [https://n26092043.github.io/](https://n26092043.github.io/) 即可看到最新內容上線！

---

## 🔧 常見問題與疑難排解 (FAQ)

### Q1: 終端機出現「無法將 'git' 字詞辨識為 Cmdlet、函式...」？
**原因**：當前 PowerShell 尚未載入 Git 路徑。  
**解法**：在 PowerShell 貼上這行即可立刻認得 Git：
```powershell
$env:Path += ";C:\Users\ritahung\AppData\Local\OpenResearch\PortableGit\cmd"
```
（或在 PowerShell 執行 `[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\ritahung\AppData\Local\OpenResearch\PortableGit\cmd", "User")` 永久生效）。

### Q2: 點選 `/reading/` 或 `/posts/` 出現 404？
**原因**：Jekyll 預設會忽略以底線開頭的資料夾（如 `_pages/`）。  
**解法**：本專案已在 `_config.yml` 中設定了 `include: [_pages]`。只要確認執行一次 `git push` 將最新設定推送到 GitHub，等待 GitHub 重新編譯完成後即可正常顯示。

### Q3: 如何確認 GitHub 雲端編譯狀態？
直接前往你的 GitHub 儲存庫頁面：
[https://github.com/n26092043/n26092043.github.io/actions](https://github.com/n26092043/n26092043.github.io/actions)  
可以看到每次 push 觸發的自動建置進度，綠色打勾表示發布成功！

---

## 📂 專案檔案結構清單

```text
my-reading-list/
├── .github/workflows/
│   └── pages-deploy.yml     # GitHub Actions 自動部署腳本
├── .gitignore               # Git 忽略檔案清單
├── _config.yml              # 網站全域設定（作者資訊、網站標題、插件）
├── Gemfile                  # Jekyll 套件依賴管理
├── index.html               # 首頁入口（互動終端機與最近動態）
├── 404.html                 # 404 找不到頁面
├── README.md                # 本說明文件
├── _data/                   # 核心資料庫
│   ├── nav.yml              # 頂部導覽列連結
│   ├── reading.yml          # 論文閱讀清單資料庫
│   └── now.yml              # 當前專注閱讀主題
├── _layouts/                # 頁面版型範本
│   ├── default.html         # 基礎 HTML 架構與 MathJax 載入
│   ├── home.html            # 首頁版型
│   ├── page.html            # 一般頁面版型
│   ├── post.html            # 深入筆記文章版型（含進度條與 TOC）
│   └── posts.html           # 筆記總覽封存版型
├── _pages/                  # 各獨立分頁
│   ├── reading.html         # /reading/ 論文清單頁
│   ├── posts.html           # /posts/ 筆記總覽頁
│   └── about.html           # /about/ 關於作者頁
├── _posts/                  # 長篇論文筆記 Markdown 檔案
│   └── 2024-03-15-lora-paper-review.md
└── assets/                  # 靜態資源
    ├── css/main.scss        # 現代主題樣式表（深淺色模式與字體）
    ├── data/index.json      # 終端機 CLI 檢索索引
    ├── js/terminal.js       # 首頁終端機模擬器
    └── js/post.js           # 閱讀進度條與目錄捲動監聽
```
