<?php

declare(strict_types=1);

namespace CartMilestones\API\Controllers;

use CartMilestones\API\Middleware\AuthMiddleware;
use CartMilestones\Core\Logger;

class SettingsController {

	public function register_routes( string $namespace ): void {
		register_rest_route( $namespace, '/settings', [
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'show' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			],
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'update' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			],
		] );

		// Debug log endpoints.
		register_rest_route( $namespace, '/debug/log', [
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_log' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			],
			[
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => [ $this, 'clear_log' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			],
		] );

		register_rest_route( $namespace, '/debug/info', [
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => [ $this, 'get_system_info' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
		] );
	}

	public function show( \WP_REST_Request $request ): \WP_REST_Response {
		return new \WP_REST_Response( get_option( 'cm_settings', [] ), 200 );
	}

	public function update( \WP_REST_Request $request ): \WP_REST_Response {
		$current  = (array) get_option( 'cm_settings', [] );
		$incoming = $this->sanitize_settings( $request->get_params() );
		$merged   = array_merge( $current, $incoming );
		update_option( 'cm_settings', $merged );

		// Re-boot logger in case debug_mode changed.
		Logger::boot();

		return new \WP_REST_Response( $merged, 200 );
	}

	public function get_log( \WP_REST_Request $request ): \WP_REST_Response {
		return new \WP_REST_Response(
			[
				'enabled'  => Logger::is_enabled(),
				'contents' => Logger::get_log_contents(),
			],
			200
		);
	}

	public function clear_log( \WP_REST_Request $request ): \WP_REST_Response {
		Logger::clear_log();
		return new \WP_REST_Response( [ 'cleared' => true ], 200 );
	}

	public function get_system_info( \WP_REST_Request $request ): \WP_REST_Response {
		global $wpdb;
		$tables = [
			'cm_campaigns',
			'cm_milestones',
			'cm_conditions',
			'cm_analytics_events',
			'cm_update_history',
		];

		$table_status = [];
		foreach ( $tables as $table ) {
			$full  = $wpdb->prefix . $table;
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$exists = (bool) $wpdb->get_var( "SHOW TABLES LIKE '{$full}'" );
			$count  = $exists
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				? (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$full}" )
				: null;
			$table_status[ $table ] = [ 'exists' => $exists, 'rows' => $count ];
		}

		return new \WP_REST_Response(
			[
				'plugin_version'    => CM_VERSION,
				'plugin_basename'   => CM_PLUGIN_BASENAME,
				'github_repo'       => CM_GITHUB_REPO,
				'php_version'       => PHP_VERSION,
				'wp_version'        => get_bloginfo( 'version' ),
				'wc_version'        => defined( 'WC_VERSION' ) ? WC_VERSION : 'unknown',
				'debug_mode'        => Logger::is_enabled(),
				'rest_url'          => rest_url( 'boostcart/v1/' ),
				'tables'            => $table_status,
				'last_db_error'     => $wpdb->last_error ?: null,
			],
			200
		);
	}

	private function sanitize_settings( array $data ): array {
		$allowed_locations    = [ 'cart', 'checkout', 'product', 'category', 'mini_cart', 'floating_widget' ];
		$allowed_celebrations = [ 'confetti', 'toast', 'fireworks' ];

		if ( isset( $data['display_locations'] ) ) {
			$data['display_locations'] = array_intersect( (array) $data['display_locations'], $allowed_locations );
		}
		if ( isset( $data['celebration_types'] ) ) {
			$data['celebration_types'] = array_intersect( (array) $data['celebration_types'], $allowed_celebrations );
		}
		if ( isset( $data['github_repo'] ) ) {
			$data['github_repo'] = sanitize_text_field( $data['github_repo'] );
		}
		if ( isset( $data['debug_mode'] ) ) {
			$data['debug_mode'] = (bool) $data['debug_mode'];
		}

		unset( $data['update_channel'], $data['license_key'] );
		return $data;
	}
}
