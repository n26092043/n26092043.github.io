---
title: "Concept Note: 直白理解自動駕駛裡的 Query 與 Transformer 運作機制"
subtitle: "不用死背論文術語，從資料型態、常見 Query 種類到 Transformer 的 Q/K/V 處理流程一次看懂。"
date: 2026-11-20 11:00:00 +0800
categories: [Concept Note, Autonomous Driving]
tags: [autonomous-driving, transformer, query, attention, sparsedrive]
toc: true
math: true
---

## 1. TL;DR

1. **Query 是什麼？**
   在程式裡，Query **不是** Python 的 `dict`，本質就是一個可學習的**浮點數矩陣（`torch.Tensor`）**，常見形狀是 `(N, 256)`。可以把它想成 **`N` 個空槽位（或偵探）**，每個槽位背著一串 256 維的浮點數向量。
2. **Query 裡面裝什麼資料型態？**
   **一律是浮點數（`float32` / `float16` / `bfloat16`）**。因為它要直接做矩陣乘法與反向傳播（梯度下降），必須是連續可微分的實數。任何離散資訊（如類別、左轉/右轉指令）或座標，都會先經由 `Embedding` 或 `Positional Encoding` 轉成 `float` 向量再塞進去。
3. **為什麼叫「Query（查詢）」？**
   來自 Transformer 的 `(Q, K, V)` 機制：把影像特徵或歷史場景想成一個**資料庫（Key / Value）**，Query 就是丟進去查資料的**搜尋條件**——差別在於神經網路不是精準比對，而是靠相似度或 3D 幾何投影「軟性加權抓取」資訊。

![detr_fig2_object_queries](D:\projects\my-reading-list\_posts\images\detr_fig2_object_queries.png)

---

## 2. 自動駕駛中常見的 6 種 Query 型態

不管看哪篇自駕論文（BEVFormer、UniAD、ViP3D、VAD、SparseDrive 等），只要看到 `XXX Query`，幾乎都不脫離以下 6 種型態：

| Query 型態                                      | 常見 Tensor 形狀                   | 幾何錨點（在哪查）                       | 白話意義                                              | 代表架構                        |
|:--------------------------------------------- |:------------------------------ |:------------------------------- |:------------------------------------------------- |:--------------------------- |
| **1. 空間網格型**<br>BEV / Voxel Query             | `(H×W, C)`<br>例：`(40000, 256)` | 固定的 2D/3D 網格座標                  | 把馬路切成密集格子，每格放一個 Query 問：「我這格空間裡有什麼？」              | BEVFormer、UniAD、OccFormer   |
| **2. 動態物件型**<br>Object / Agent Query          | `(N, C)`<br>例：`(900, 256)`     | 可更新的 3D 框 `(x,y,z,w,l,h,yaw,v)` | 撒在場景裡的 `N` 個偵探，每人負責抓最多 1 台車或行人；沒抓到就輸出背景濾掉         | DETR3D、Sparse4D、SparseDrive |
| **3. 跨幀追蹤型**<br>Track Query                   | `(N_active, C)`                | 延續上一幀的 3D 框                     | **把上一幀已經找到車的 Query 直接傳到下一幀**，帶著歷史記憶繼續查，天然完成 ID 追蹤 | MOTR、ViP3D、UniAD            |
| **4. 靜態地圖型**<br>Map Query                     | `(N_m, C)`<br>例：`(100, 256)`   | 20 個 2D 點組成的折線                  | 每個 Query 負責一條車道線、斑馬線或路緣，沿著折線去影像抓路面紋理              | MapTR、VAD、SparseDrive       |
| **5. 多模態意圖型**<br>Motion / Planning Mode Query | `(K, C)`<br>例：`(6, 256)`       | K-Means 聚類出的典型終點                | 代表 `K` 種假設性走法（直行 / 左轉 / 減速），拿去問周圍車況以評估可行性         | MotionFormer、SparseDrive    |
| **6. 自車型**<br>Ego Query                       | `(1, C)`                       | 自車當前位置與速度                       | 就 1 個向量代表自車，專門收集他車、地圖與導航指令，最後解碼出自車軌跡              | UniAD、VAD、SparseDrive       |

> **一句話區分 Dense vs. Sparse**：
> 
> - 用第 1 種（鋪滿整張 $200\times 200$ 網格）就是 **Dense BEV**；
> - 跳過第 1 種、直接用第 2～6 種少數實例去查 2D 影像，就是 **Sparse Instance**。

![sparsedrive_fig1](D:\projects\my-reading-list\_posts\images\sparsedrive_fig1.png)

---

## 3. 直白看懂：Transformer 怎麼處理這些 Query？

不論是哪一種 Query，進到 Transformer Decoder 裡都跑著幾乎一模一樣的四步循環：

```text
  [初始 Query: Content 特徵 (N, 256)  +  Positional 幾何編碼 (N, 256)]
                                  │
                                  ▼
           ┌───────────────────────────────────────────┐
           │  Step 1. Self-Attention (內部互相溝通)      │
           │    Q = K = V = 這組 Queries 自己           │
           │    目的：避免重複偵測、理解物件間的相對關係    │
           └──────────────────────┬────────────────────┘
                                  ▼
           ┌───────────────────────────────────────────┐
           │  Step 2. Cross-Attention (向外查資料庫)    │
           │    Q = Queries                            │
           │    K, V = 外部資料（2D 影像 / 歷史幀 / 地圖）│
           │    目的：把跟自己有關的線索加權抓回來更新自己  │
           └──────────────────────┬────────────────────┘
                                  ▼
           ┌───────────────────────────────────────────┐
           │  Step 3. FFN (兩層 MLP 消化與融合特徵)      │
           └──────────────────────┬────────────────────┘
                                  ▼
           ┌───────────────────────────────────────────┐
           │  Step 4. 幾何微調 (Iterative Refinement)   │
           │    根據新特徵微調 3D 框或折線座標            │
           │    ──► 重複 Step 1~4（通常疊 3~6 層）       │
           └──────────────────────┬────────────────────┘
                                  ▼
              [Task Head (MLP)：把 256 維 float 翻譯成答案]
               類別分數 / 3D 框座標 / 未來軌跡點 / 佔用機率
```

### 拆解 4 個最容易卡住的細節

1. **為什麼每個 Query 通常有兩部分：`Content` + `Position`？**
   - `Content`（256 維）負責記「**它是什麼**」（外觀、語意、動態）。
   - `Position`（由 3D 座標或錨點框編碼而成）負責記「**它在哪裡**」。
   - 如果沒有 `Position`，900 個 Query 進 Attention 時根本分不清誰負責左前方、誰負責右後方。
2. **Self-Attention 在幹嘛？（偵探開會）**
   - `Q, K, V` 全都是這組 Query 自己。
   - 在感知階段，它讓 900 個偵探互看一眼：「*左前方那台白色 SUV 我已經抓了，你不要重複框！*」
   - 在預測／規劃階段，它讓自車與他車互看：「*我如果加速直行，旁邊那台車會不會切進來？*」
3. **Cross-Attention 在幹嘛？（查資料庫）＋ 自駕特化技巧「Deformable Attention」**
   - 原本的 Cross-Attention 會拿每個 Query 去跟**整張圖片的所有像素**算相似度，但自駕有 6 顆高解析度相機，像素總量太大，直接算會爆顯存。
   - 因此自駕幾乎都改用 **Deformable Attention（可變形注意力）**：每個 Query 直接把自己的 **3D 參考點投影回 2D 相機圖**，只在投影點周圍採樣少數幾個關鍵像素抓特徵，既精準又大幅省算力。
4. **為什麼要疊 3～6 層 Decoder（Iterative Refinement）？**
   - 第 1 層剛初始化時，Query 的 3D 位置只是粗略猜測，抓到的影像像素可能偏了一點；
   - 過完第 1 層後，Query 稍微看懂了車在哪，就把自己的 3D 框往車子中心挪近一點；
   - 第 2 層拿**更準的新位置**再去 2D 影像裡重查一次——如此反覆 6 次，框與特徵就越修越準。

![detr3d_fig1_3d_to_2d_sampling](D:\projects\my-reading-list\_posts\images\detr3d_fig1_3d_to_2d_sampling.png)

---

## 4. 具體舉例：同樣是 256 維 `float`，怎麼分別理解不同概念？

Query 剛初始化時只是隨機浮點數，本身什麼都不懂。它之所以能分別表達「車的外觀」、「車道線」或「規劃意圖」，關鍵在於三件事：**① 配對的幾何先驗不同、② Cross-Attention 去查的對象不同、③ 訓練 Loss 逼它記住的目標不同**。

1. **表達「一台車的外觀與狀態」（Agent Query）**
   
   - **幾何先驗**：配對一個 3D 框錨點（中心、長寬高、朝向）。
   - **去哪查**：在 3D 框周圍撒幾個 3D 採樣點（車頭、車尾、車頂附近），投影到 6 張 2D 相機特徵圖上抓像素特徵。
   - **Loss 逼它學什麼**：拿這 256 維向量去預測類別、3D 框偏移與未來軌跡；反向傳播會逼這 256 個數字自動壓縮進「這是一台 SUV、右轉方向燈亮著、車頭微偏、正在減速」等線索。

2. **表達「一條車道線」（Map Query）**
   
   - **幾何先驗**：一條由 **20 個 `(x, y)` 點**串成的折線。
   - **去哪查**：把這 20 個點投影到 2D 相機特徵圖上，沿著折線採樣路面油漆、虛實線紋理、路緣石邊界。
   - **Loss 逼它學什麼**：要求預測標線類別與 20 個點的微調偏移，於是這 256 個數字就學會編碼「在自車左側 1.7m、往前開始右彎的白色實線」這類拓撲資訊。

![sparsedrive_fig3_sparse_perception](D:\projects\my-reading-list\_posts\images\sparsedrive_fig3_sparse_perception.png)

3. **表達「一個規劃意圖」（Planning Mode Query）**
   - **幾何先驗**：對訓練集人類軌跡做 K-Means 聚類得到典型終點（例如「3 秒後直行 15m」、「減速到 5m」、「向左變道」），經位置編碼轉成 256 維浮點數。
   - **去哪查**：不直接看 2D 影像，而是加上自車特徵後，跟上面建好的 **Agent Queries（他車）** 與 **Map Queries（車道線）** 做 Cross-Attention——相當於在問：「*如果我照『直行 15m』走，會撞到哪台車？會偏出車道嗎？*」
   - **Loss 逼它學什麼**：輸出精細的 6 步軌跡與可行性分數；如果前方有行人擋路，吸收完行人特徵後，「直行 15m」的分數就會變低、「減速到 5m」的分數就會變高。

![sparsedrive_fig4_motion_planner](D:\projects\my-reading-list\_posts\images\sparsedrive_fig4_motion_planner.png)

| Query 類型               | 配對的先驗        | Cross-Attention 去查誰？        | Loss 逼這 256 個 float 記住什麼？ |
|:---------------------- |:------------ |:--------------------------- |:------------------------- |
| **Agent Query（車）**     | 3D 框錨點       | 2D 影像（物體周圍像素）+ 歷史幀          | 類別、外觀/車燈、精準 3D 位置與動態      |
| **Map Query（車道線）**     | 20 個折線點      | 2D 影像（沿線的路面像素）              | 標線種類、彎曲形狀與相對位置            |
| **Planning Query（意圖）** | K-Means 意圖終點 | Agent Queries + Map Queries | 該意圖在當前路況下的安全性與細部軌跡        |

> **重要觀念（分散式表徵 Distributed Representation）**：
> 這 256 個浮點數並不是「第 1 格存顏色、第 2 格存方向燈」這樣一格對一格，而是像 LLM 的 Word Embedding 一樣，所有語意與幾何資訊都以**高維空間裡的向量方向組合**混在一起，最後交給後端的 MLP 各自投影解碼成框、類別、軌跡或分數。

---

## 5. 實戰對照：SparseDrive 如何串起這些 Query？

以 [SparseDrive (arXiv:2405.19620)](https://www.alphaxiv.org/pdf/2405.19620) 為例，它剛好把上述多種 Query 串成一條完整的端到端流程（nuScenes 預設維度）：

| 階段           | 使用的 Query                       | 維度                            | 對應的實際輸出                                        |
|:------------ |:------------------------------- |:----------------------------- |:---------------------------------------------- |
| **感知：偵測＋追蹤** | Agent Query (`F_d`, `B_d`)      | `(900, 256)` + `(900, 11)`    | 3D 框（位置/尺寸/朝向/速度）、10 類分數、跨幀 `track_id`         |
| **感知：線上建圖**  | Map Query (`F_m`, `L_m`)        | `(100, 256)` + `(100, 20, 2)` | 100 條地圖折線（斑馬線、車道分隔線、路緣）                        |
| **預測：他車軌跡**  | Agent Query + Motion Mode Query | `(900, 6, 12, 2)`             | 每個物件 **6 種模態 × 12 步（未來 6 秒）** 的軌跡與機率           |
| **規劃：自車軌跡**  | Ego Query + Planning Mode Query | `(3, 6, 6, 2)`                | **3 種指令 × 6 種模態 × 6 步（未來 3 秒）**，經碰撞重評分選出最終安全軌跡 |

- **優點**：完全省去建構密集 $200\times 200$ BEV 的算力，速度比 UniAD 快 4–5 倍（RTX 4090 可達 7.3–9.0 FPS），且預測與規劃改為平行雙向交互。
- **延伸思考（Closed-Set 限制）**：純 3D Box 類的 Agent Query 天生受限於訓練集定義的類別，面對倒塌樹幹、掉落物等未知長尾障礙物容易漏檢；若需要「開放世界防漏檢」，實務上通常會額外搭配 **空間網格型（Occupancy / Flow）** 分支兜底。
