# 🚀 Quick Reference: Feature Parity Checklist

## Immediate Action Items

### CDA Features to Add to FCN (High Priority)

| Feature | Files Needed | Complexity | Impact |
|---------|--------------|------------|--------|
| **Heatmap** | `Heatmap.tsx`, `/heatmap/page.tsx` | Medium | High |
| **Crypto Calculator** | `CryptoCalculator.tsx`, `/calculator/page.tsx` | Low | High |
| **Gas Tracker** | `GasTracker.tsx`, `/gas/page.tsx` | Low | Medium |
| **Screener** | `Screener.tsx`, `/screener/page.tsx` | High | High |
| **Live Price** | `LivePrice.tsx`, `price-websocket.ts` | Medium | High |
| **Liquidations** | `LiquidationsFeed.tsx`, `/liquidations/page.tsx` | Medium | Medium |
| **Correlation Matrix** | `CorrelationMatrix.tsx`, `/correlation/page.tsx` | Medium | Medium |
| **Dominance Chart** | `DominanceChart.tsx`, `/dominance/page.tsx` | Low | Medium |
| **Social Buzz** | `SocialBuzz.tsx`, `/buzz/page.tsx` | Medium | Medium |
| **Export Data** | `ExportData.tsx` | Low | Medium |
| **Currency Selector** | `CurrencySelector.tsx` | Low | Medium |

### FCN Features to Add to CDA (High Priority)

| Feature | Files Needed | Complexity | Impact |
|---------|--------------|------------|--------|
| **Full i18n** | `[locale]/` routing, 18 message files | High | Critical |
| **Language Switcher** | `LanguageSwitcher.tsx` | Low | High |
| **DeFi Chain Pages** | `/defi/chain/[slug]/page.tsx` | Medium | Medium |
| **DeFi Protocol Pages** | `/defi/protocol/[slug]/page.tsx` | Medium | Medium |
| **Alpha Signals** | `alpha-signal-engine.ts`, `useAlphaSignals.ts` | High | High |
| **Unit Tests** | Multiple `.test.tsx` files | Medium | High |
| **OpenAPI Spec** | `/api/openapi.json/route.ts` | Low | Medium |
| **X402 Payments** | `X402PaymentButton.tsx`, `x402-*.ts` | Medium | Low |

---

## Quick Stats Comparison

```
┌─────────────────────────────────────────────────────────────┐
│                    REPOSITORY COMPARISON                      │
├─────────────────────────────────────────────────────────────┤
│                     FCN          │          CDA              │
├─────────────────────────────────────────────────────────────┤
│ TypeScript Files:   398          │          416              │
│ Components:          84          │           90              │
│ Pages:               40          │           48              │
│ API Routes:         ~45          │          ~50              │
│ i18n Locales:        18          │            0              │
│ Test Files:          12+         │           4+              │
│ Trading Tools:        2          │           10              │
│ Data Sources:         3          │            5              │
└─────────────────────────────────────────────────────────────┘
```

---

## Copy-Paste Migration Commands

### Copy CDA Components to FCN
```bash
# From CDA to FCN (run from /workspaces/free-crypto-news)
cp /tmp/cda-source/src/components/Heatmap.tsx src/components/
cp /tmp/cda-source/src/components/CryptoCalculator.tsx src/components/
cp /tmp/cda-source/src/components/GasTracker.tsx src/components/
cp /tmp/cda-source/src/components/Screener.tsx src/components/
cp /tmp/cda-source/src/components/LivePrice.tsx src/components/
cp /tmp/cda-source/src/components/LiquidationsFeed.tsx src/components/
cp /tmp/cda-source/src/components/CorrelationMatrix.tsx src/components/
cp /tmp/cda-source/src/components/DominanceChart.tsx src/components/
cp /tmp/cda-source/src/components/SocialBuzz.tsx src/components/
cp /tmp/cda-source/src/components/ExportData.tsx src/components/
cp /tmp/cda-source/src/components/CurrencySelector.tsx src/components/
cp /tmp/cda-source/src/components/icons.tsx src/components/
```

### Copy CDA Lib Files to FCN
```bash
cp /tmp/cda-source/src/lib/bitcoin-onchain.ts src/lib/
cp /tmp/cda-source/src/lib/coincap.ts src/lib/
cp /tmp/cda-source/src/lib/coinpaprika.ts src/lib/
cp /tmp/cda-source/src/lib/defi-yields.ts src/lib/
cp /tmp/cda-source/src/lib/price-websocket.ts src/lib/
cp /tmp/cda-source/src/lib/logger.ts src/lib/
cp /tmp/cda-source/src/lib/category-icons.ts src/lib/
```

### Copy CDA Pages to FCN (need i18n adaptation)
```bash
# These need to be adapted for [locale] routing
mkdir -p src/app/[locale]/heatmap
mkdir -p src/app/[locale]/calculator
mkdir -p src/app/[locale]/gas
mkdir -p src/app/[locale]/screener
mkdir -p src/app/[locale]/liquidations
mkdir -p src/app/[locale]/correlation
mkdir -p src/app/[locale]/dominance
mkdir -p src/app/[locale]/buzz

# Copy and adapt each page
cp /tmp/cda-source/src/app/heatmap/page.tsx src/app/[locale]/heatmap/
cp /tmp/cda-source/src/app/calculator/page.tsx src/app/[locale]/calculator/
cp /tmp/cda-source/src/app/gas/page.tsx src/app/[locale]/gas/
cp /tmp/cda-source/src/app/screener/page.tsx src/app/[locale]/screener/
cp /tmp/cda-source/src/app/liquidations/page.tsx src/app/[locale]/liquidations/
cp /tmp/cda-source/src/app/correlation/page.tsx src/app/[locale]/correlation/
cp /tmp/cda-source/src/app/dominance/page.tsx src/app/[locale]/dominance/
cp /tmp/cda-source/src/app/buzz/page.tsx src/app/[locale]/buzz/
```

---

## Next Steps

1. ✅ Created: `REPO-COMPARISON-ANALYSIS.md` - Full comparison
2. ✅ Created: `AGENT-PROMPTS-COMPARISON.md` - 5 agent prompts
3. ✅ Created: `FEATURE-PARITY-CHECKLIST.md` - This file

### To Run Deep Analysis:
```
Use the 5 agent prompts in AGENT-PROMPTS-COMPARISON.md
to generate complete architecture documentation
```

### To Start Migration:
```
1. Start with "Low Complexity" items
2. Copy components first
3. Adapt pages for i18n
4. Add translations to messages/*.json
5. Test thoroughly
```
