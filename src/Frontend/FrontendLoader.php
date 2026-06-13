<?php

declare(strict_types=1);

namespace CartMilestones\Frontend;

use CartMilestones\Core\Assets;
use CartMilestones\Core\Loader;

class FrontendLoader {

	public function __construct( private readonly Assets $assets ) {}

	public function register( Loader $loader ): void {
		$loader->add_action( 'wp_enqueue_scripts', [ $this->assets, 'enqueue_frontend_scripts' ] );
		$loader->add_action( 'woocommerce_after_mini_cart', [ $this->assets, 'enqueue_mini_cart_scripts' ] );

		$shortcode = new ShortcodeHandler();
		$loader->add_action( 'init', [ $shortcode, 'register' ] );

		$location = new LocationManager();
		$location->register( $loader );
	}
}
