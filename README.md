# Boostcart for WooCommerce

Production-ready WooCommerce plugin that increases Average Order Value through milestone-based rewards, progress tracking, and gamification.

**GitHub:** https://github.com/affi1504/boostcart

---

## Features

- **Campaign System** — unlimited campaigns with flexible trigger types, date scheduling, and priority ordering
- **7 Trigger Types** — Cart Value, Product/Category Quantity, Product/Category Spend, Lifetime Spend, Lifetime Orders
- **7 Reward Types** — Percentage Discount, Fixed Discount, Free Shipping, Free Product, Store Credit, Coupon Unlock, Custom
- **Progress Widgets** — Horizontal timeline, Vertical list, Floating Widget (desktop + mobile), Mini Cart
- **Dynamic Messaging** — token-based templates: `{remaining}`, `{label}`, `{threshold}`, `{percent}`
- **Celebrations** — Confetti, Toast notifications, Fireworks; dedup via WooCommerce session + sessionStorage
- **Analytics Dashboard** — Milestone reach rate, Reward redemptions, Revenue influenced, AOV, Avg discount
- **GitHub Auto-Update** — One-click updates and rollback from the WordPress admin
- **React Admin UI** — Full SPA with Campaign Builder, Milestone Builder, Condition Builder, Analytics, Settings, Import/Export
- **Gutenberg Block** — `boostcart/progress` block with style and campaign-ID attributes
- **Shortcode** — `[boostcart]` / `[boostcart style="vertical"]`

---

## Requirements

| Requirement | Minimum |
|---|---|
| PHP | 8.1 |
| WordPress | 6.4 |
| WooCommerce | 9.0 |
| Node.js (dev) | 20 |
| Composer (dev) | 2 |

---

## Installation

### From GitHub Release (recommended)

1. Download `boostcart-vX.X.X.zip` from [Releases](https://github.com/affi1504/boostcart/releases)
2. Upload via **Plugins → Add New → Upload Plugin**
3. Activate
4. Navigate to **Boostcart** in the admin sidebar

### From Source

```bash
git clone https://github.com/affi1504/boostcart.git
cd boostcart
composer install --no-dev --optimize-autoloader
npm ci && npm run build
```

Zip the directory (excluding dev files) and upload.

---

## Build Instructions

```bash
# Install PHP deps
composer install

# Install Node deps
npm ci

# Development build with file watching
npm run start

# Production build
npm run build
```

Build output lands in `assets/build/`.

---

## Development

### Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only |
| `develop` | Integration branch |
| `feature/*` | New features, merged into develop |
| `bugfix/*` | Bug fixes, merged into develop |
| `release/*` | Release preparation |
| `hotfix/*` | Critical fixes from main |

### Versioning

Semantic Versioning: `MAJOR.MINOR.PATCH`

### Creating a Release

```bash
git checkout develop
git pull
git checkout -b release/v1.2.0
# bump version in boostcart.php
git commit -m "chore: bump to 1.2.0"
git checkout main && git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags
```

The `release.yml` GitHub Action automatically:
- Builds production assets
- Generates a changelog from git log
- Creates a GitHub Release
- Uploads the distribution ZIP

---

## Update System

The plugin checks [GitHub Releases](https://github.com/affi1504/boostcart/releases) for updates and surfaces them in the standard WordPress **Dashboard → Updates** screen.

### Rollback

Go to **Boostcart → Settings → Updates** (REST endpoint `/wp-json/boostcart/v1/update/history`) or use the REST API:

```
POST /wp-json/boostcart/v1/update/rollback
{ "version": "1.1.0" }
```

---

## REST API

Base: `/wp-json/boostcart/v1/`

All write endpoints require the `manage_woocommerce` capability. Public endpoints (`/progress`, `/active`) are nonce-gated.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/campaigns` | List campaigns |
| POST | `/campaigns` | Create campaign |
| GET | `/campaigns/{id}` | Get campaign + milestones + conditions |
| PUT | `/campaigns/{id}` | Update campaign |
| DELETE | `/campaigns/{id}` | Delete campaign |
| POST | `/campaigns/{id}/duplicate` | Clone campaign |
| PATCH | `/campaigns/{id}/status` | Toggle status |
| GET/PUT | `/campaigns/{id}/milestones` | Milestone CRUD |
| GET/PUT | `/campaigns/{id}/conditions` | Condition tree |
| GET | `/progress` | Current cart progress (public) |
| GET | `/analytics/summary` | Aggregate metrics |
| GET/PUT | `/settings` | Plugin settings |
| GET | `/export` | Export all campaigns as JSON |
| POST | `/import` | Import campaigns from JSON |
| GET | `/update/status` | Update availability |
| POST | `/update/rollback` | Rollback to version |

---

## Shortcode

```
[boostcart]
[boostcart style="vertical"]
[boostcart style="horizontal" campaign_id="3"]
```

---

## Running Tests

```bash
# Unit tests only (no WP required)
composer test:unit

# Full suite (requires WP test environment)
bash bin/install-wp-tests.sh wordpress_test root root localhost latest
composer test
```

---

## Project Structure

```
boostcart/
├── boostcart.php     Plugin entry point
├── src/
│   ├── Core/               Plugin bootstrap, DI container, assets
│   ├── Update/             GitHub update system + rollback
│   ├── Campaigns/          Campaign + milestone repositories and services
│   ├── Conditions/         Condition evaluator + all condition types
│   ├── Rewards/            Reward factory + all reward types
│   ├── Progress/           Progress calculator, message renderer, cart hash tracker
│   ├── Celebrations/       Celebration manager
│   ├── Analytics/          Event tracker + analytics service
│   ├── API/                REST controllers + registrar
│   ├── Blocks/             Gutenberg block
│   ├── Admin/              WP admin menu
│   └── Frontend/           Shortcode, location manager, frontend loader
├── assets/
│   ├── admin/              React SPA source
│   ├── frontend/           Vanilla JS widgets
│   ├── blocks/             Gutenberg block source
│   └── build/              Compiled output (git-ignored)
├── templates/              PHP widget templates
├── languages/              Translation files
└── tests/                  PHPUnit test suites
```

---

## License

GPL-2.0-or-later
