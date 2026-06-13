<?php
/**
 * PHPUnit bootstrap for Boostcart for WooCommerce unit tests.
 */

declare(strict_types=1);

// Define plugin constants so classes can be loaded without WP.
define( 'CM_VERSION', '1.0.0' );
define( 'CM_PLUGIN_FILE', dirname( __DIR__ ) . '/boostcart.php' );
define( 'CM_PLUGIN_DIR', dirname( __DIR__ ) . '/' );
define( 'CM_PLUGIN_URL', 'http://example.com/wp-content/plugins/boostcart/' );
define( 'CM_PLUGIN_BASENAME', 'boostcart/boostcart.php' );
define( 'CM_GITHUB_REPO', 'test-org/boostcart' );

// Autoloader.
require_once dirname( __DIR__ ) . '/vendor/autoload.php';

// Stub global WordPress functions used by business logic so unit tests
// don't require a full WP install.
if ( ! function_exists( 'apply_filters' ) ) {
	function apply_filters( string $hook, mixed $value, mixed ...$args ): mixed {
		return $value;
	}
}
if ( ! function_exists( 'do_action' ) ) {
	function do_action( string $hook, mixed ...$args ): void {}
}
if ( ! function_exists( 'wp_json_encode' ) ) {
	function wp_json_encode( mixed $data ): string|false {
		return json_encode( $data );
	}
}
if ( ! function_exists( 'current_time' ) ) {
	function current_time( string $type ): string {
		return ( 'timestamp' === $type ) ? (string) time() : date( 'Y-m-d H:i:s' );
	}
}
if ( ! function_exists( 'wc_price' ) ) {
	function wc_price( float $amount ): string {
		return '$' . number_format( $amount, 2 );
	}
}
if ( ! function_exists( 'wc_get_price_decimals' ) ) {
	function wc_get_price_decimals(): int { return 2; }
}
if ( ! function_exists( '__' ) ) {
	function __( string $text, string $domain = 'default' ): string { return $text; }
}
if ( ! function_exists( 'has_term' ) ) {
	function has_term( int $term, string $taxonomy, int $post_id ): bool { return false; }
}
if ( ! function_exists( 'wp_cache_get' ) ) {
	function wp_cache_get( string $key, string $group = '' ): mixed { return false; }
}
if ( ! function_exists( 'wp_cache_set' ) ) {
	function wp_cache_set( string $key, mixed $value, string $group = '', int $ttl = 0 ): void {}
}
if ( ! function_exists( 'get_current_user_id' ) ) {
	function get_current_user_id(): int { return 0; }
}
if ( ! function_exists( 'wp_get_current_user' ) ) {
	function wp_get_current_user(): object {
		return new class { public array $roles = []; public function exists(): bool { return false; } };
	}
}
