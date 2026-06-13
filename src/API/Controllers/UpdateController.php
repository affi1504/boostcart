<?php

declare(strict_types=1);

namespace CartMilestones\API\Controllers;

use CartMilestones\API\Middleware\AuthMiddleware;
use CartMilestones\Update\UpdateManager;

class UpdateController {

	public function __construct( private readonly UpdateManager $manager ) {}

	public function register_routes( string $namespace ): void {
		register_rest_route( $namespace, '/update/status', [
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => [ $this, 'status' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
		] );

		register_rest_route( $namespace, '/update/apply', [
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => [ $this, 'apply' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
		] );

		register_rest_route( $namespace, '/update/history', [
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => [ $this, 'history' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
		] );

		register_rest_route( $namespace, '/update/rollback', [
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => [ $this, 'rollback' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			'args'                => [
				'version' => [ 'type' => 'string', 'required' => true ],
			],
		] );
	}

	public function status( \WP_REST_Request $request ): \WP_REST_Response {
		$provider = $this->manager->get_provider();
		$latest   = $provider->get_latest_version();

		return new \WP_REST_Response( [
			'current_version'    => CM_VERSION,
			'latest_version'     => $latest,
			'update_available'   => version_compare( $latest, CM_VERSION, '>' ),
			'changelog'          => $provider->get_changelog( $latest ),
			'download_url'       => $provider->get_download_url( $latest ),
		], 200 );
	}

	public function apply( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$provider = $this->manager->get_provider();
		$latest   = $provider->get_latest_version();

		if ( ! version_compare( $latest, CM_VERSION, '>' ) ) {
			return new \WP_REST_Response( [ 'message' => __( 'Already on the latest version.', 'boostcart' ) ], 200 );
		}

		// Trigger WP core upgrade mechanism.
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-ajax-upgrader-skin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';

		\WP_Filesystem();
		$skin     = new \WP_Ajax_Upgrader_Skin();
		$upgrader = new \Plugin_Upgrader( $skin );
		$result   = $upgrader->upgrade( CM_PLUGIN_BASENAME );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new \WP_REST_Response( [
			'success'      => true,
			'new_version'  => $latest,
		], 200 );
	}

	public function history( \WP_REST_Request $request ): \WP_REST_Response {
		return new \WP_REST_Response( $this->manager->get_history()->get_all(), 200 );
	}

	public function rollback( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$version = $request->get_param( 'version' );
		$result  = $this->manager->get_rollback_manager()->rollback_to( $version );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new \WP_REST_Response( [
			'success'  => true,
			'version'  => $version,
			'message'  => sprintf(
				/* translators: %s: version number */
				__( 'Successfully rolled back to version %s.', 'boostcart' ),
				$version
			),
		], 200 );
	}
}
