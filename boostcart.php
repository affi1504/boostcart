<?php
/**
 * Plugin Name:       Boostcart for WooCommerce
 * Plugin URI:        https://github.com/affi1504/boostcart
 * Description:       Increase Average Order Value through milestone-based rewards, progress tracking, gamification, and intelligent cart incentives.
 * Version:           2.0.12
 * Requires at least: 6.4
 * Requires PHP:      8.1
 * Author:            affi1504
 * Author URI:        https://github.com/affi1504
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       boostcart
 * Domain Path:       /languages
 * WC requires at least: 9.0
 * WC tested up to:   9.9
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CM_VERSION', '2.0.12' );
define( 'CM_PLUGIN_FILE', __FILE__ );
define( 'CM_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CM_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'CM_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );
define( 'CM_GITHUB_REPO', 'affi1504/boostcart' );

// Autoloader.
if ( file_exists( CM_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
	require_once CM_PLUGIN_DIR . 'vendor/autoload.php';
}

// Declare HPOS compatibility.
add_action(
	'before_woocommerce_init',
	static function (): void {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
				'custom_order_tables',
				__FILE__,
				true
			);
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
				'cart_checkout_blocks',
				__FILE__,
				true
			);
		}
	}
);

// Activation / deactivation hooks must be registered before the plugin boots.
register_activation_hook(
	__FILE__,
	static function (): void {
		\CartMilestones\Core\Activator::activate();
	}
);

register_deactivation_hook(
	__FILE__,
	static function (): void {
		\CartMilestones\Core\Deactivator::deactivate();
	}
);

/**
 * Boot the plugin after all plugins are loaded so WooCommerce is available.
 */
add_action(
	'plugins_loaded',
	static function (): void {
		if ( ! class_exists( 'WooCommerce' ) ) {
			add_action(
				'admin_notices',
				static function (): void {
					echo '<div class="notice notice-error"><p>' .
						esc_html__( 'Boostcart for WooCommerce requires WooCommerce 9.0 or higher.', 'boostcart' ) .
						'</p></div>';
				}
			);
			return;
		}

		\CartMilestones\Core\Plugin::get_instance()->run();
	}
);
