<?php

declare(strict_types=1);

namespace CartMilestones\Frontend;

use CartMilestones\Core\Loader;

class LocationManager {

	private FrontendRenderer $renderer;

	public function __construct() {
		$this->renderer = new FrontendRenderer();
	}

	public function register( Loader $loader ): void {
		$settings  = (array) get_option( 'cm_settings', [] );
		$locations = (array) ( $settings['display_locations'] ?? [ 'cart', 'checkout', 'mini_cart' ] );

		if ( in_array( 'cart', $locations, true ) ) {
			$loader->add_action( 'woocommerce_before_cart_table', [ $this, 'render_horizontal' ], 10 );
		}
		if ( in_array( 'checkout', $locations, true ) ) {
			$loader->add_action( 'woocommerce_before_checkout_form', [ $this, 'render_horizontal' ], 5 );
		}
		if ( in_array( 'product', $locations, true ) ) {
			$loader->add_action( 'woocommerce_single_product_summary', [ $this, 'render_horizontal' ], 35 );
		}
		if ( in_array( 'mini_cart', $locations, true ) ) {
			$loader->add_action( 'woocommerce_before_mini_cart_contents', [ $this, 'render_mini_cart' ], 5 );
		}
	}

	public function render_horizontal(): void {
		$this->renderer->render_widget( 'horizontal' );
	}

	public function render_mini_cart(): void {
		$this->renderer->render_mini_cart_widget();
	}
}
