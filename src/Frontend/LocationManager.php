<?php

declare(strict_types=1);

namespace CartMilestones\Frontend;

use CartMilestones\Core\Loader;

class LocationManager {

	public function register( Loader $loader ): void {
		$settings  = (array) get_option( 'cm_settings', [] );
		$locations = (array) ( $settings['display_locations'] ?? [ 'cart', 'checkout', 'floating_widget' ] );

		if ( in_array( 'cart', $locations, true ) ) {
			$loader->add_action( 'woocommerce_before_cart_table', [ $this, 'render_horizontal' ], 10 );
		}
		if ( in_array( 'checkout', $locations, true ) ) {
			$loader->add_action( 'woocommerce_before_checkout_form', [ $this, 'render_horizontal' ], 5 );
		}
		if ( in_array( 'product', $locations, true ) ) {
			$loader->add_action( 'woocommerce_single_product_summary', [ $this, 'render_horizontal' ], 35 );
		}
		if ( in_array( 'category', $locations, true ) ) {
			$loader->add_action( 'woocommerce_before_shop_loop', [ $this, 'render_horizontal' ], 5 );
		}
		if ( in_array( 'mini_cart', $locations, true ) ) {
			$loader->add_action( 'woocommerce_before_mini_cart_contents', [ $this, 'render_mini_cart' ], 5 );
		}
		if ( in_array( 'floating_widget', $locations, true ) ) {
			$loader->add_action( 'wp_footer', [ $this, 'render_floating_widget' ], 100 );
		}
	}

	public function render_horizontal(): void {
		$template = CM_PLUGIN_DIR . 'templates/progress-horizontal.php';
		if ( file_exists( $template ) ) {
			include $template;
		}
	}

	public function render_vertical(): void {
		$template = CM_PLUGIN_DIR . 'templates/progress-vertical.php';
		if ( file_exists( $template ) ) {
			include $template;
		}
	}

	public function render_mini_cart(): void {
		$template = CM_PLUGIN_DIR . 'templates/mini-cart-widget.php';
		if ( file_exists( $template ) ) {
			include $template;
		}
	}

	public function render_floating_widget(): void {
		$template = CM_PLUGIN_DIR . 'templates/floating-widget.php';
		if ( file_exists( $template ) ) {
			include $template;
		}
	}
}
