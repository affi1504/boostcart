<?php

declare(strict_types=1);

namespace CartMilestones\Admin;

use CartMilestones\Core\Assets;
use CartMilestones\Update\UpdateManager;

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

	/**
	 * Add a "Check for Updates" action link on the Plugins page.
	 */
	public function add_action_links( array $links ): array {
		$check_url = wp_nonce_url(
			admin_url( 'admin-post.php?action=boostcart_check_for_updates' ),
			'boostcart_check_for_updates'
		);

		$check_link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( $check_url ),
			esc_html__( 'Check for Updates', 'boostcart' )
		);

		array_unshift( $links, $check_link );
		return $links;
	}

	/**
	 * Handle the "Check for Updates" admin-post action.
	 */
	public function handle_check_for_updates(): void {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'You do not have permission to do this.', 'boostcart' ) );
		}

		check_admin_referer( 'boostcart_check_for_updates' );

		// Clear all cached update data and force WordPress to re-check.
		( new UpdateManager() )->flush_update_cache();

		// Redirect back to the Plugins page with a success notice.
		wp_safe_redirect(
			add_query_arg(
				[ 'boostcart_updated' => '1' ],
				admin_url( 'plugins.php' )
			)
		);
		exit;
	}

	/**
	 * Show a success notice after manually checking for updates.
	 */
	public function show_update_check_notice(): void {
		if ( empty( $_GET['boostcart_updated'] ) ) {
			return;
		}
		echo '<div class="notice notice-success is-dismissible"><p>' .
			esc_html__( 'Boostcart update check complete. If a new version is available it will appear below.', 'boostcart' ) .
			'</p></div>';
	}
}
