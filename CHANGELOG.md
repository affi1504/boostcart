## [Unreleased]

## [1.0.0] - Initial Release

### Added
- Campaign system with unlimited campaigns
- 7 trigger types: cart value, product/category quantity, product/category spend, lifetime spend, lifetime orders
- 7 reward types: percentage discount, fixed discount, free shipping, free product, store credit, coupon unlock, custom
- AND/OR condition groups with recursive tree evaluator
- Best Value milestone marker
- Horizontal and vertical progress widgets
- Floating widget (desktop bottom-right, mobile sticky bar)
- Mini cart widget
- Dynamic message templates with {remaining}, {label}, {threshold} tokens
- Confetti, toast, and fireworks celebrations with session-based dedup
- Analytics dashboard: milestone reach rate, reward redemptions, revenue influenced, AOV, avg discount
- Display locations: product, category, cart, checkout, mini cart, floating widget
- [boostcart] shortcode
- Gutenberg block: boostcart/progress
- React-based admin SPA: Campaign Builder, Milestone Builder, Condition Builder, Analytics, Settings, Import/Export
- GitHub Releases auto-update system
- UpdateProviderInterface abstraction (GitHubUpdateProvider, CustomApiUpdateProvider)
- Version rollback support
- GitHub Actions CI/CD: PR checks, develop CI, release workflow
- HPOS (High Performance Order Storage) compatibility
- WooCommerce Blocks compatibility
- Translation-ready (boostcart text domain)
- RTL-ready CSS
