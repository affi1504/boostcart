<?php

declare(strict_types=1);

namespace CartMilestones\Admin;

use CartMilestones\Core\Assets;

class AdminMenu {

	public function __construct( private readonly Assets $assets ) {}

	public function register_menu(): void {
		add_menu_page(
			__( 'Boostcart', 'boostcart' ),
			__( 'Boostcart', 'boostcart' ),
			'manage_woocommerce',
			'boostcart',
			[ $this, 'render_page' ],
			'dashicons-awards',
			58
		);

		add_submenu_page(
			'boostcart',
			__( 'Campaigns', 'boostcart' ),
			__( 'Campaigns', 'boostcart' ),
			'manage_woocommerce',
			'boostcart',
			[ $this, 'render_page' ]
		);

		add_submenu_page(
			'boostcart',
			__( 'Analytics', 'boostcart' ),
			__( 'Analytics', 'boostcart' ),
			'manage_woocommerce',
			'boostcart-analytics',
			[ $this, 'render_page' ]
		);

		add_submenu_page(
			'boostcart',
			__( 'Settings', 'boostcart' ),
			__( 'Settings', 'boostcart' ),
			'manage_woocommerce',
			'boostcart-settings',
			[ $this, 'render_page' ]
		);
	}

	public function render_page(): void {
		echo '<div id="cm-admin-root" class="cm-admin-app"></div>';
	}
}
