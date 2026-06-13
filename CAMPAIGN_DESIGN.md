# Boostcart — Campaign & Milestone Design (v2)

## Core Principle

**One campaign = one progress bar = multiple independent milestones.**

Each milestone defines its own trigger condition. The bar shows all milestones as dots. Each dot lights up the moment its own condition is met, regardless of what other milestones measure.

---

## Data Model Change (v1 → v2)

### What changed

| | v1 | v2 |
|--|--|--|
| `trigger_type` | on Campaign | **on each Milestone** |
| `trigger_target_ids` | missing | **on each Milestone** (products/categories to measure) |
| `comparator` | missing | **on each Milestone** (default `>=`) |

### Campaign table (after change)
```
id, name, status, stacking_mode, target_scope, target_ids,
start_date, end_date, priority, created_at, updated_at
```
`trigger_type` removed from campaign.

### Milestone table (after change)
```
id, campaign_id, sort_order,
trigger_type,          ← NEW (moved from campaign)
trigger_target_ids,    ← NEW (products/categories to measure)
comparator,            ← NEW (default >=)
threshold_value,
reward_type, reward_value, reward_meta,
is_best_value, label, message_template, created_at
```

---

## Stacking Mode (redefined for mixed triggers)

### Exclusive
Within each trigger-type group, only the highest earned milestone applies its reward.
Across different trigger-type groups, each group contributes exactly one reward.

**Example:**
- Milestone 1: cart_value ≥ ₹449 → Free Shipping ✓ earned
- Milestone 2: category_qty ≥ 25  → 5% OFF
- Milestone 3: category_qty ≥ 50  → 15% OFF
- Milestone 4: category_qty ≥ 75  → 20% OFF ✓ earned

Result: Free Shipping + 20% OFF (milestones 2 & 3 overridden within the category_qty group)

### Stackable
All earned milestones apply their rewards simultaneously, regardless of trigger type.

---

## Trigger Types — Per Milestone

### cart_value
- **Measures:** Current cart subtotal
- **Threshold unit:** Currency (₹)
- **Extra fields on milestone:** none
- **Guest support:** Yes

### product_qty
- **Measures:** Count of specified products in cart
- **Threshold unit:** Integer (items)
- **Extra fields on milestone:** `trigger_target_ids` → product picker (required)
- **Guest support:** Yes

### category_qty
- **Measures:** Count of items from specified category in cart
- **Threshold unit:** Integer (items)
- **Extra fields on milestone:** `trigger_target_ids` → category picker (required)
- **Guest support:** Yes

### category_spend
- **Measures:** Total spend on items from specified category
- **Threshold unit:** Currency (₹)
- **Extra fields on milestone:** `trigger_target_ids` → category picker (required)
- **Guest support:** Yes

### product_spend
- **Measures:** Total spend on specified products
- **Threshold unit:** Currency (₹)
- **Extra fields on milestone:** `trigger_target_ids` → product picker (required)
- **Guest support:** Yes

### lifetime_spend
- **Measures:** Customer's total spend across all past orders
- **Threshold unit:** Currency (₹)
- **Extra fields on milestone:** none
- **Guest support:** No — show "Login to track your rewards" message

### lifetime_orders
- **Measures:** Customer's total order count
- **Threshold unit:** Integer (orders)
- **Extra fields on milestone:** none
- **Guest support:** No — same guest fallback

---

## Reward Types

### percentage_discount
- `reward_value`: 1–100 (the percentage)
- Applied as: negative cart fee = cart_total × (value/100)

### fixed_discount
- `reward_value`: currency amount
- Applied as: negative cart fee, capped at cart total (never below zero)

### free_shipping
- No value needed
- Applied as: overrides shipping to show only ₹0 methods

### free_product
- `reward_meta.product_id`: WC product ID (simple products only)
- `reward_meta.quantity`: default 1
- Applied as: add product at ₹0

### store_credit
- `reward_value`: currency amount
- Applied as: negative cart fee (no tax), session-based

### coupon_unlock
- `reward_meta.coupon_code`: must exist in WooCommerce
- Applied as: automatically call `WC()->cart->apply_coupon()`

### custom
- `reward_meta`: arbitrary JSON
- Applied as: `do_action('boostcart_custom_reward_apply', $milestone, $context)`

---

## Campaign Form — 4-Section Layout

```
┌─ 1. BASICS ──────────────────────────────────────────────┐
│  Campaign Name (required)                                 │
│  Status: Active / Inactive                                │
│  Stacking Mode: Exclusive / Stackable                    │
│  Priority (optional, default 10)                         │
│  Start Date / End Date (optional)                        │
└───────────────────────────────────────────────────────────┘

┌─ 2. WHO SEES THIS ───────────────────────────────────────┐
│  Target: All Customers / Specific Categories /            │
│          Specific Products / Customer Roles               │
│  [if not All] → searchable picker                        │
└───────────────────────────────────────────────────────────┘

┌─ 3. MILESTONES (at least 1 required) ────────────────────┐
│  ┌─ Milestone 1 ──────────────────────────────────────┐  │
│  │ Trigger:    [Cart Value ▼]                          │  │
│  │ Condition:  Cart subtotal ≥ [₹449]                 │  │
│  │ Reward:     [Free Shipping ▼]                       │  │
│  │ Label:      "Free Shipping"                        │  │
│  │ Message:    "Add {remaining} more for free shipping"│  │
│  └────────────────────────────────────────────────────┘  │
│  ┌─ Milestone 2 ──────────────────────────────────────┐  │
│  │ Trigger:    [Category Quantity ▼]                   │  │
│  │ Category:   [Summer Collection ×] [+ Add]           │  │
│  │ Condition:  Item count ≥ [25]                       │  │
│  │ Reward:     [% Discount ▼]  Value: [5]%             │  │
│  └────────────────────────────────────────────────────┘  │
│  [+ Add Milestone]                                       │
└───────────────────────────────────────────────────────────┘

┌─ 4. ADVANCED CONDITIONS (optional, collapsed) ───────────┐
│  Extra rules that must pass for this campaign to show.    │
│  Match [ALL ▼] of these rules:                           │
│  [Customer Role] [is] [Wholesale]          [✕]           │
│  [+ Add Rule]                                            │
└───────────────────────────────────────────────────────────┘
```

---

## Condition Builder — Simplified UI

**Remove:** nested group button from primary UI
**Keep:** AND/OR toggle as "Match ALL / Match ANY"
**Add:** context-aware fields per condition type

| Condition type | Fields shown |
|---|---|
| cart_value | Comparator + Currency value |
| product_qty | Product picker + Comparator + Integer |
| category_qty | Category picker + Comparator + Integer |
| category_spend | Category picker + Comparator + Currency |
| product_spend | Product picker + Comparator + Currency |
| lifetime_spend | Comparator + Currency |
| lifetime_orders | Comparator + Integer |
| customer_role | Role multiselect (no comparator needed) |
| date_range | Start date + End date |

Advanced nesting (groups within groups) hidden behind "Advanced" toggle.

---

## Frontend Progress Bar Logic

1. Fetch all milestones for active campaigns, sorted by `sort_order`
2. For each milestone, evaluate its own condition against the current cart/customer
3. Mark each milestone as `earned` or `not_earned`
4. The bar shows all milestones as dots left to right
5. Earned dots are filled, next unearned dot is highlighted
6. The message targets the NEXT unearned milestone that is closest to being earned

### Message selection logic:
- Group milestones by trigger_type
- For each group, find the next unearned milestone
- Compute `remaining` = threshold - current_value for that group
- Show the message for whichever group has the smallest `remaining` value
- After all milestones are earned: "You've unlocked all rewards! 🎉"

---

## Migration Plan (v1 → v2)

Existing installs need:
1. Add columns to `cm_milestones`: `trigger_type`, `trigger_target_ids`, `comparator`
2. Copy `trigger_type` from each campaign to its milestones
3. Remove (or leave unused) `trigger_type` from `cm_campaigns` — leave it for backwards compat, just ignore it

The migration runs automatically in `Activator::activate()` and also in a new `Activator::maybe_migrate()` that fires on `plugins_loaded` if the installed DB version doesn't match.

---

## Example Campaigns

### "Free Shipping + Volume Discount" (user's scenario)
- Campaign: "Mega Rewards" | Stacking: Exclusive
- Milestone 1: cart_value ≥ ₹449 → Free Shipping
- Milestone 2: category_qty ≥ 25 (Summer Collection) → 5% OFF
- Milestone 3: category_qty ≥ 50 (Summer Collection) → 15% OFF
- Milestone 4: category_qty ≥ 75 (Summer Collection) → 20% OFF

At 75+ items + ₹449+ cart: Free Shipping + 20% OFF ✓

### "Loyalty Rewards"
- Campaign: "Loyal Customer" | Stacking: Stackable
- Milestone 1: lifetime_spend ≥ ₹5000 → ₹250 Store Credit
- Milestone 2: lifetime_spend ≥ ₹10000 → Unlock Coupon "VIP500"
- Milestone 3: lifetime_orders ≥ 10 → Free Product (ID: 42)

### "Simple Free Shipping Bar"
- Campaign: "Free Shipping" | Stacking: Exclusive
- Milestone 1: cart_value ≥ ₹499 → Free Shipping

---

## Implementation Order

1. DB schema migration (Activator)
2. MilestoneRepository — add new columns
3. CampaignRepository — remove trigger_type from read/write
4. CampaignEvaluator — per-milestone evaluation engine
5. ProgressCalculator — multi-trigger progress logic
6. RewardApplicator — grouped stacking logic
7. REST API — update milestone schema
8. MilestoneBuilder UI — trigger per row + dynamic fields + pickers
9. CampaignEditor — remove trigger_type field
10. ConditionBuilder — simplified UI
11. Frontend progress.js — new progress rendering
12. Fix milestone load bug on edit screen
