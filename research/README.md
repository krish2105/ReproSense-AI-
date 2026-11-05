# Research — PCOS feature evidence (offline only)

Goal: one evidence slide showing which features the literature and the public Kaggle PCOS dataset link to PCOS
(cycle length, follicle count, AMH, weight/waist, acne, hair growth). This supports our rule choices.

Steps
1. Download the Kaggle PCOS dataset (541 women, 10 hospitals in Kerala) into `research/data/` (git-ignored). Check its licence.
2. Create `pcos_feature_evidence.ipynb`: describe groups, compare features (Mann-Whitney / chi-square), plot 4 charts.
3. Export one chart for the deck.

Never ship a model trained here to users, and never show a "PCOS probability". This dataset is not from the UAE.
