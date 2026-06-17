<?php

declare(strict_types=1);

namespace CartMilestones\Core;

class Assets {

	public function enqueue_admin_scripts( string $hook_suffix ): void {
		// Only load on our own admin pages.
		if ( ! str_contains( $hook_suffix, 'boostcart' ) ) {
			return;
		}

		$asset_file = CM_PLUGIN_DIR . 'assets/build/admin.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : [ 'dependencies' => [], 'version' => CM_VERSION ];

		wp_enqueue_script(
			'cm-admin',
			CM_PLUGIN_URL . 'assets/build/admin.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_enqueue_style(
			'cm-admin',
			CM_PLUGIN_URL . 'assets/build/admin.css',
			[ 'wp-components' ],
			$asset['version']
		);

		// Determine which SPA route to open based on the WP submenu slug.
		$page       = sanitize_key( $_GET['page'] ?? 'boostcart' ); // phpcs:ignore WordPress.Security.NonceVerification
		$initial_route = match ( $page ) {
			'boostcart-analytics' => '/analytics',
			'boostcart-settings'  => '/settings',
			default               => '/campaigns',
		};

		wp_localize_script(
			'cm-admin',
			'cmAdminData',
			[
				'restUrl'      => esc_url_raw( rest_url( 'boostcart/v1/' ) ),
				'restRootUrl'  => esc_url_raw( rest_url() ),
				'nonce'        => wp_create_nonce( 'wp_rest' ),
				'version'      => CM_VERSION,
				'initialRoute' => $initial_route,
				'pluginBasename' => CM_PLUGIN_BASENAME,
				'currency'     => [
					'symbol'    => html_entity_decode( get_woocommerce_currency_symbol() ),
					'position'  => get_option( 'woocommerce_currency_pos' ),
					'decimals'  => wc_get_price_decimals(),
					'separator' => wc_get_price_decimal_separator(),
					'thousand'  => wc_get_price_thousand_separator(),
				],
				'siteUrl'  => get_site_url(),
				'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
			]
		);
	}

	public function enqueue_frontend_scripts(): void {
		$settings  = (array) get_option( 'cm_settings', [] );
		$locations = (array) ( $settings['display_locations'] ?? [ 'cart', 'checkout', 'mini_cart' ] );

		$is_targeted_page = (
			( in_array( 'cart', $locations, true )     && is_cart() ) ||
			( in_array( 'checkout', $locations, true ) && is_checkout() ) ||
			( in_array( 'product', $locations, true )  && is_product() ) ||
			( in_array( 'mini_cart', $locations, true ) )  // mini cart can appear on any page
		);

		if ( ! $is_targeted_page ) {
			return;
		}

		$this->enqueue_frontend_asset( 'progress' );
		$this->enqueue_frontend_asset( 'celebrations' );
		$this->enqueue_frontend_asset( 'injector' );
		$this->enqueue_frontend_asset( 'cart-watcher' );

		if ( in_array( 'mini_cart', $locations, true ) ) {
			$this->enqueue_frontend_asset( 'mini-cart' );
		}

		wp_localize_script(
			'cm-frontend-cart-watcher',
			'cmFrontendData',
			[
				'restUrl'       => esc_url_raw( rest_url( 'boostcart/v1/' ) ),
				'nonce'         => wp_create_nonce( 'wp_rest' ),
				'ajax'          => admin_url( 'admin-ajax.php' ),
				'locations'     => $locations,
				'progressStyle' => $settings['progress_style'] ?? 'classic',
				'currency'      => [
					'symbol'    => html_entity_decode( get_woocommerce_currency_symbol() ),
					'position'  => get_option( 'woocommerce_currency_pos' ),
					'decimals'  => wc_get_price_decimals(),
					'separator' => wc_get_price_decimal_separator(),
					'thousand'  => wc_get_price_thousand_separator(),
				],
			]
		);
	}

	public function enqueue_mini_cart_scripts(): void {
		$this->enqueue_frontend_asset( 'mini-cart' );
	}

	private function enqueue_frontend_asset( string $name ): void {
		$asset_file = CM_PLUGIN_DIR . "assets/build/frontend/{$name}.asset.php";
		$asset      = file_exists( $asset_file ) ? require $asset_file : [ 'dependencies' => [], 'version' => CM_VERSION ];
		$handle     = "cm-frontend-{$name}";

		wp_enqueue_script(
			$handle,
			CM_PLUGIN_URL . "assets/build/frontend/{$name}.js",
			$asset['dependencies'],
			$asset['version'],
			true
		);

		$css_path = CM_PLUGIN_DIR . "assets/build/frontend/{$name}.css";
		if ( file_exists( $css_path ) ) {
			wp_enqueue_style(
				$handle,
				CM_PLUGIN_URL . "assets/build/frontend/{$name}.css",
				[],
				$asset['version']
			);
		}
	}
}
