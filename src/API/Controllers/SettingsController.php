<?php

declare(strict_types=1);

namespace CartMilestones\API\Controllers;

use CartMilestones\API\Middleware\AuthMiddleware;

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
	}

	public function show( \WP_REST_Request $request ): \WP_REST_Response {
		return new \WP_REST_Response( get_option( 'cm_settings', [] ), 200 );
	}

	public function update( \WP_REST_Request $request ): \WP_REST_Response {
		$current  = (array) get_option( 'cm_settings', [] );
		$incoming = $this->sanitize_settings( $request->get_params() );
		$merged   = array_merge( $current, $incoming );
		update_option( 'cm_settings', $merged );
		return new \WP_REST_Response( $merged, 200 );
	}

	private function sanitize_settings( array $data ): array {
		$allowed_locations = [ 'cart', 'checkout', 'product', 'category', 'mini_cart', 'floating_widget' ];
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

		// Never overwrite these via the API.
		unset( $data['update_channel'], $data['license_key'] );

		return $data;
	}
}
