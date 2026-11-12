---
title: "Paper Review: LoRA — Low-Rank Adaptation of Large Language Models"
subtitle: "Decomposing weight updates into low-rank matrices for efficient adaptation."
date: 2024-03-15 14:00:00 +0800
categories: [Paper Review, Efficient ML]
tags: [peft, lora, llm, fine-tuning]
toc: true
math: true
---

> **Citation**: [Jungho Kim](https://kimjh7669.github.io/), [Jiyong Oh](https://scholar.google.com/citations?hl=en&user=C10ysNMAAAAJ), [Seunghoon Yu](https://scholar.google.com/citations?user=RJnWLIUAAAAJ&hl=en&authuser=1&oi=ao), [Hongjae Shin](https://scholar.google.com/citations?user=4zQMBBAAAAAJ&hl=en&oi=ao), Donghyuk Kwak, [Jun Won Choi](https://scholar.google.com/citations?user=IHH2PyYAAAAJ&hl=en&oi=ao)  
> **Venue**: CVPR 2026  
> **Links**: [arXiv:2602.18887](https://arxiv.org/abs/2602.18887) · [Project Page](https://spa-junghokim.github.io/SafeDrive-Page) · [GitHub: SPA-junghokim/SafeDrive](https://github.com/SPA-junghokim/SafeDrive)

---

## 1. Executive Summary (TL;DR)

SafeDrive 將端到端駕駛重新表述為“稀疏世界中的細粒度安全推理”。模型不僅輸出規劃軌跡，還顯式生成碰撞、越界等風險評估，並把風險推理作為規劃約束，使決策過程更可審計、可解釋。與後處理規則不同，SafeDrive 把動態風險推理內生到規劃器中。這類顯式安全層直接關係到功能安全與責任認定，也是 2026 年工程側尤其關注的方向。

ref: [說說你經歷的/聽說的故事，留給你很大體會和感觸的？ - 知乎](https://www.zhihu.com/question/268727704/answer/2055224611281823120)

![img](https://cvpr.thecvf.com/media/PosterPDFs/CVPR%202026/39705.png?t=1779874045.8642163)

[CVPR Poster SafeDrive: Fine-Grained Safety Reasoning for End-to-End Driving in a Sparse World](https://cvpr.thecvf.com/virtual/2026/poster/39705)



---

## 2. Background & Motivation



![Intro teaser image](https://spa-junghokim.github.io/SafeDrive-Page/static/figure/Intro.png)



- **過往端到端模型的盲點（Figure 1 (b) 上半部：Scene-level Safety）**：
  過去的模型（如 VAD、DiffusionDrive、WoTE）在評估一條候選軌跡好不好時，神經網絡通常只給出一個籠統的綜合分數（例如「這條軌跡安全分是 0.6」）。
  **致命缺點**：如果分數低，系統根本說不清楚：**「究竟是會在第幾秒、撞上哪一輛特定的車、還是壓到了哪條線？」**。
- **SafeDrive 的核心構想（Figure 1 (b) 下半部：Fine-grained Safety）**：
  安全評估必須像人類安全員一樣精確：
  必須能具體輸出**「對象（哪一個障礙物）」**與**「時間（未來第幾秒）」**的矩陣。只要能精準指出「在第 1.5 秒會撞到左前方卡車」，系統就能精準避開它。



SafeDrive 想解決什麼問題？

現有端到端駕駛方法通常採用密集場景表示（如 Occupancy 或 BEV）或隱式的軌跡評分機制，缺乏對動態互動的顯式建模。這就帶來了一個問題：模型知道某條軌跡"可能不太好"，但說不出具體哪裡不好、什麼時候會出問題、跟誰可能碰撞。

這種粗粒度的安全判斷，在複雜互動場景下是不夠的。比如路口有多個行人、車輛同時運動，模型需要精確識別出"第 3 秒時左前方那輛自行車可能拐進來"這種實例級的安全風險，才能做出真正安全的決策。現有的端到端方法很難做到這種細粒度的安全推理。



它是怎麼做的？

SafeDrive 的核心思路是用稀疏世界模型來替代密集場景表示，在保持計算效率的同時實現實例級的安全推理。框架包含兩個互補網路：稀疏世界網路（SWNet）和細粒度推理網路（FRNet）。

SWNet 負責建構稀疏世界：不再對整個場景做密集的 Occupancy 預測，而是以實例為中心，只建模關鍵動態實體（車輛、行人等）的未來行為。通過建構稀疏 BEV 表示和實例查詢，SWNet 生成稀疏軌跡預測，大幅減少計算冗餘。

FRNet 則在 SWNet 的基礎上進行細粒度安全檢查：對多步軌跡預測進行碰撞風險評估，精準識別安全關鍵事件。它不只給出一個籠統的安全分數，而是能定位到具體時刻、具體實例的碰撞風險，實現可解釋的安全推理。



現有端到端自駕（包括 VAD、SparseDrive 等）在評估安全性時，多半仰賴全域的「場景級評分（Scene-level Safety Evaluation）」或單純的軌跡回歸損失。這導致了兩大缺陷：

1. **缺乏實例空間定位（Lack of Agent-level Risk Localization）**：系統若判斷一條路徑不安全，無法指出究竟是哪一輛車、哪位行人造成了衝突。
2. **缺乏時間維度精確度（Lack of Timestep-level Temporal Grounding）**：無法精確預測「碰撞將發生在未來第幾秒」，導致決策過度保守或避讓不及。

SafeDrive 提出在**稀疏世界（Sparse World）**中引入「軌跡條件化」與「細粒度推理」，精確定位危險的對象與時間。



---

## 3. Methodology

SafeDrive 的完整推論流程由四個子網絡構成：

#### (1) 特徵提取與提案生成（ProposalNet）

- **感測器輸入**：支援純視覺（Camera-only）或多模態融合（Camera + LiDAR，採用 BEVFormer-M 提取時空 BEV 特徵 FBEV*F*BEV）。
- **實例檢測**：利用可學習物體查詢（Object Queries）解碼出周圍動態物件的 Instance Queries。
- **提案生成**：ProposalNet 評估預設軌跡錨點（Trajectory Anchors），基於場景級特徵預先挑選出 K*K* 條粗篩的候選軌跡。

#### (2) 稀疏世界網絡（Sparse World Network, SWNet）

傳統世界模型試圖預測整個世界的未來變化，計算量極大且容易失焦。SWNet 採用**軌跡條件化（Trajectory-conditioned）**：

- 針對每一條候選自車軌跡 TjT*j*，構建一個專屬的局部稀疏世界 WjW*j*。
- 透過 **World-Self-Attention** 與 **Trajectory-guided Deformable Attention**，推演在「自車如果走這條軌跡」的假設下，周遭關鍵障礙物會如何運動，確保自車意圖與周圍實例的動態演變在特徵層面完成交互博弈。

#### (3) 細粒度推理網絡（Fine-grained Reasoning Network, FRNet）

FRNet 是 SafeDrive 的核心創新，負責對每個候選世界的軌跡計算兩大指標：

- **指標 A：兩兩無碰撞機率（Pair-wise No Collision, PwNC）**
  將自車規劃查詢（Planning Query）與周圍第 i*i* 個實例查詢在同一世界特徵下進行兩兩拼接（Pair-wise Concat），經過 MLP 輸出該障礙物在未來第 h*h* 步的無碰撞機率 ppwnci,j(h)∈[0,1]*p*pwnc*i*,*j*​(*h*)∈[0,1]。
  候選軌跡 j*j* 的總 PwNC 得分為所有實例在全時域（Horizon H*H*）的連乘積：

  PPwNCj=∏i=1N∏h=1Hppwnci,j(h)*P*PwNC*j*=*i*=1∏*N**h*=1∏*H**p*pwnc*i*,*j*(*h*)

- **指標 B：時序可行駛區域合規評分（Time-wise Drivable Area Compliance, TwDAC）**
  評估軌跡在各時間步 h*h* 是否維持在道路邊界與車道拓撲內。透過靜態 BEV 特徵與地圖分割遮罩，以軌跡引導的可變形注意力預測時序上的車道違規懲罰。

最後，系統結合 ProposalNet 的原始模仿分數、PwNC 與 TwDAC 進行綜合打分，挑選出數值最高的軌跡執行。

```text
                       【SafeDrive 全流程架構】
                              多視角影像 + LiDAR
                                     │
                                     ▼
                       [BEV Encoder (BEVFormer-M)]
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
             [Object Detection]                 [ProposalNet]
             (生成 Instance Queries)        (從 Trajectory Anchors
                    │                        挑出 K 條候選軌跡)
                    └────────────────┬────────────────┘
                                     ▼
                       【SWNet (Sparse World Network)】
                        為每條候選軌跡生成條件化世界
                        - World-Self-Attention
                        - Trajectory-guided Deformable Attention
                                     │
                                     ▼
                       【FRNet (Fine-grained Reasoning)】
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
         [PwNC (Pair-wise No Collision)]   [TwDAC (Time-wise Drivable Area)]
           計算：自車與特定障礙物              計算：候選軌跡在各時間步
           在未來第 h 步的無碰撞機率           對車道與道路邊界的合規評分
                    └────────────────┬────────────────┘
                                     ▼
                          【最終安全最優軌跡選擇】
```

---

## 4. Empirical Evaluation

| Method | Trainable Params | Storage per Task | RoBERTa-large (GLUE) | GPT-3 175B (WikiSQL) |
| :--- | :---: | :---: | :---: | :---: |
| **Full Fine-Tuning** | $100\%$ (~355M / 175B) | ~1.4 GB / 350 GB | 88.9 | 73.8 |
| **BitFit** | ~0.1% | ~1.4 MB | 87.2 | 71.3 |
| **Prefix-Tuning** | ~0.1% - 2% | ~5 MB | 88.6 | 70.1 |
| **LoRA ($r=4$)** | **~0.01% - 0.2%** | **~2 MB - 35 MB** | **89.3** | **74.0** |

---

## 5. Personal Takeaways & Ideas

- **Why does rank $r \in \{4, 8\}$ work so well?**  
  The intrinsic subspace of specialized tasks appears surprisingly compact. Most variance in weight updates concentrates in a tiny subspace spanned by the top singular vectors.
- **Modularity**:  
  Serving multi-tenant models becomes trivial: maintain one base model in memory and dynamically swap in 10MB task-specific LoRA weights on the fly.
- **Future Directions**:  
  Exploring dynamic rank allocation (such as AdaLoRA) and quantization synergies (QLoRA) for edge device deployment.
