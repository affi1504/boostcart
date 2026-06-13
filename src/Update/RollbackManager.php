<?php

declare(strict_types=1);

namespace CartMilestones\Update;

class RollbackManager {

	public function __construct( private readonly VersionHistory $history ) {}

	/**
	 * Roll back to a specific version by its ZIP URL.
	 *
	 * @return true|\WP_Error
	 */
	public function rollback_to( string $version ): true|\WP_Error {
		$entry = $this->history->get_by_version( $version );

		if ( null === $entry || empty( $entry['zip_url'] ) ) {
			return new \WP_Error(
				'cm_rollback_not_found',
				sprintf(
					/* translators: %s: version number */
					__( 'Version %s is not available for rollback.', 'boostcart' ),
					$version
				)
			);
		}

		return $this->install_from_url( $entry['zip_url'], $version );
	}

	/**
	 * Roll back one step to the previously installed version.
	 *
	 * @return true|\WP_Error
	 */
	public function rollback_previous(): true|\WP_Error {
		$previous = $this->history->get_previous();

		if ( null === $previous ) {
			return new \WP_Error(
				'cm_rollback_no_previous',
				__( 'No previous version available for rollback.', 'boostcart' )
			);
		}

		return $this->rollback_to( $previous['version'] );
	}

	private function install_from_url( string $zip_url, string $version ): true|\WP_Error {
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-ajax-upgrader-skin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';

		// Silence the upgrader output during REST calls.
		$skin     = new \WP_Ajax_Upgrader_Skin();
		$upgrader = new \Plugin_Upgrader( $skin );

		// The upgrader requires a direct filesystem connection.
		if ( ! \WP_Filesystem() ) {
			return new \WP_Error( 'cm_rollback_filesystem', __( 'Could not initialise filesystem.', 'boostcart' ) );
		}

		$result = $upgrader->install(
			$zip_url,
			[
				'overwrite_package' => true,
				'clear_update_cache' => true,
			]
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( false === $result ) {
			return new \WP_Error( 'cm_rollback_failed', __( 'Rollback installation failed.', 'boostcart' ) );
		}

		// Record the rolled-back version as the current one.
		$this->history->record( $version, $zip_url, '(rollback)' );
		update_option( 'cm_version', $version );

		return true;
	}
}
