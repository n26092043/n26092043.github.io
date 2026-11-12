---
title: "Paper Review: LoRA — Low-Rank Adaptation of Large Language Models"
subtitle: "Decomposing weight updates into low-rank matrices for efficient adaptation."
date: 2024-03-15 14:00:00 +0800
categories: [Paper Review, Efficient ML]
tags: [peft, lora, llm, fine-tuning]
toc: true
math: true
---

> **Citation**: Hu, E. J., Shen, Y., Wallis, P., Allen-Zhu, Z., Li, Y., Wang, S., Wang, L., & Chen, W. (2022).  
> **Venue**: ICLR 2022  
> **Links**: [arXiv:2106.09685](https://arxiv.org/abs/2106.09685) · [Official Code](https://github.com/microsoft/LoRA)

---

## 1. Executive Summary (TL;DR)

**LoRA (Low-Rank Adaptation)** freezes the pre-trained model weights and injects trainable rank-decomposition matrices into each layer of the Transformer architecture. This drastically reduces the number of trainable parameters for downstream tasks by up to **10,000x** and GPU memory requirement by **3x**, while maintaining or exceeding full fine-tuning performance without adding any inference latency.

---

## 2. Background & Motivation

Fine-tuning all parameters of modern large language models (e.g. GPT-3 175B, LLaMA) creates substantial engineering friction:
1. **Storage Bottleneck**: Storing separate 175B checkpoints for different downstream tasks is prohibitively expensive.
2. **Inference Latency in Adapters**: Traditional adapter layers insert small neural networks sequentially into Transformer layers, which forces sequential execution and introduces non-negligible inference latency.

LoRA addresses this by hypothesizing that **weight updates during task adaptation have a low "intrinsic dimension"**.

---

## 3. Methodology

### 3.1 Mathematical Formulation

Let $W_0 \in \mathbb{R}^{d \times k}$ denote a pre-trained weight matrix. Instead of optimizing the full parameter update $\Delta W \in \mathbb{R}^{d \times k}$, LoRA decomposes $\Delta W$ into the product of two low-rank matrices:

$$\Delta W = B \cdot A$$

where:
- $B \in \mathbb{R}^{d \times r}$
- $A \in \mathbb{R}^{r \times k}$
- The rank satisfies $r \ll \min(d, k)$.

During forward propagation, the output hidden state $h$ is computed as:

$$h = W_0 x + \Delta W x = W_0 x + \frac{\alpha}{r} B A x$$

```text
       Forward Pass with LoRA Decomposition:
       
                 h = W_0 * x + (alpha/r) * B * A * x
                           ┌───┐
                           │ x │ (Input d-dim)
                           └───┘
                          /     \
               W_0 (Fixed)       \ A (Rank r, Gaussian Init)
                        ▼         ▼
                     ┌─────┐   ┌─────┐
                     │     │   │  A  │ (r x d)
                     │ W_0 │   └─────┘
                     │     │      │
                     │     │      ▼
                     │     │   ┌─────┐
                     │     │   │  B  │ (d x r, Zero Init)
                     └─────┘   └─────┘
                        \         /
                         ▼       ▼
                           ┌───┐
                           │ + │ ──► Output h (d-dim)
                           └───┘
```

### 3.2 Key Training Properties
1. **Zero Initialization**: Matrix $A$ is initialized from a Gaussian distribution $\mathcal{N}(0, \sigma^2)$, while $B$ is initialized to 0, ensuring $\Delta W = 0$ at the start of training.
2. **Scaling Factor $\alpha$**: The scaling factor $\frac{\alpha}{r}$ stabilizes training when experimenting with different rank values $r$.
3. **Zero Inference Latency**: At deployment, one can directly fold the low-rank delta back into the pre-trained weights: $W_{\text{deployed}} = W_0 + \frac{\alpha}{r} B A$.

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
