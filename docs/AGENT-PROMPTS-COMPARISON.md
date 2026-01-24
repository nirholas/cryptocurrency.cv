

## Agent 5: Feature Gap Analysis & Migration Implementation Guide

```markdown
# TASK: Comprehensive Feature Gap Analysis and Migration Guide

Create a complete migration guide for feature parity between FCN and CDA.

## Objectives

1. **Feature Gap Matrix**
   Create a complete matrix of ALL features:
   - Pages (40 FCN vs 48 CDA)
   - Components (84 FCN vs 90 CDA)
   - API Routes (~45 FCN vs ~50 CDA)
   - Library Functions
   - Hooks
   - External Integrations

2. **Priority Ranking**
   Rank each missing feature by:
   - User impact (1-10)
   - Implementation complexity (1-10)
   - Dependencies required
   - Estimated dev hours

3. **FCN → CDA Migration Guide**
   Features to add to CDA:
   - Complete i18n system
     - Step-by-step implementation
     - Files to create
     - Config changes needed
   - DeFi sub-pages (chain/protocol)
   - Alpha signal engine
   - X402 payment integration
   - Unit test patterns

4. **CDA → FCN Migration Guide**
   Features to add to FCN:
   - Heatmap page
     - Complete component code
     - API requirements
     - i18n integration
   - Crypto Calculator
   - Gas Tracker
   - Correlation Matrix
   - Dominance Chart
   - Liquidations Feed
   - Screener
   - Social Buzz
   - LivePrice component
   - Export functionality
   - Admin panel
   - Multiple data sources (CoinCap, CoinPaprika)

5. **Shared Library Unification**
   Create a list of utilities that should be identical:
   - market-data.ts
   - cache.ts
   - alerts.ts
   - portfolio.ts
   - etc.

## Output Format

Generate `/workspaces/free-crypto-news/docs/FEATURE-MIGRATION-GUIDE.md` with:

### Section 1: Feature Gap Matrix
| Feature | FCN Status | CDA Status | Priority | Complexity |

### Section 2: FCN → CDA Migration Tasks
For each feature:
- [ ] Task name
  - Files to create
  - Config changes
  - Dependencies
  - Code snippets
  - Testing requirements

### Section 3: CDA → FCN Migration Tasks
For each feature:
- [ ] Task name
  - Files to create
  - Config changes
  - Dependencies
  - i18n considerations
  - Code snippets
  - Testing requirements

### Section 4: Implementation Order
Recommended order of implementation:
1. Phase 1: Quick wins (< 2 hours each)
2. Phase 2: Medium complexity (2-8 hours each)
3. Phase 3: Complex features (8+ hours each)

### Section 5: Estimated Timeline
| Phase | Features | FCN Hours | CDA Hours |

### Section 6: Technical Considerations
- Breaking changes to avoid
- Backwards compatibility requirements
- Performance considerations
- Testing requirements

### Section 7: GitHub Issue Templates
Provide issue templates for each major feature to migrate.
```

---

## Usage Instructions

### Option A: Run Sequentially (Recommended)
Run each agent prompt one at a time, waiting for completion:
1. Run Agent 1 → Get FCN-ARCHITECTURE-COMPLETE.md
2. Run Agent 2 → Get CDA-ARCHITECTURE-COMPLETE.md
3. Run Agent 3 → Get COMPONENT-COMPARISON.md
4. Run Agent 4 → Get API-BACKEND-COMPARISON.md
5. Run Agent 5 → Get FEATURE-MIGRATION-GUIDE.md

### Option B: Run in Parallel (Faster)
Agents 1 & 2 can run simultaneously (no dependencies).
Agents 3, 4, 5 should run after 1 & 2 complete.

### Expected Total Output
5 comprehensive markdown documents totaling ~50,000+ words of documentation.

---

## Post-Analysis Actions

After all agents complete:

1. **Review Generated Docs**
   - Verify accuracy
   - Identify quick wins
   - Prioritize user-facing features

2. **Create GitHub Issues**
   - One issue per major feature migration
   - Link to relevant documentation
   - Assign complexity labels

3. **Start Implementation**
   - Begin with Phase 1 quick wins
   - Test each migration thoroughly
   - Update docs as you go

4. **Continuous Sync**
   - Establish shared component library
   - Create automation for keeping in sync
   - Regular comparison audits
