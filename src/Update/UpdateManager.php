<?php

declare(strict_types=1);

namespace CartMilestones\Update;

use CartMilestones\Core\Loader;
use CartMilestones\Update\Contracts\UpdateProviderInterface;

class UpdateManager {

	private UpdateProviderInterface $provider;
	private VersionHistory $history;
	private RollbackManager $rollback;

	public function __construct() {
		$settings = get_option( 'cm_settings', [] );
		$channel  = $settings['update_channel'] ?? 'github';

		if ( 'github' === $channel ) {
			$repo           = $settings['github_repo'] ?? CM_GITHUB_REPO;
			$this->provider = new GitHubUpdateProvider( $repo );
		} else {
			$this->provider = new CustomApiUpdateProvider(
				$settings['api_url'] ?? '',
				$settings['license_key'] ?? ''
			);
		}

		$this->history  = new VersionHistory();
		$this->rollback = new RollbackManager( $this->history );
	}

	public function register( Loader $loader ): void {
		// Hook into the READ filter — fires every time WP reads the transient.
		// This is the reliable way to inject update data without depending on
		// whether WP has already "checked" this plugin.
		$loader->add_filter(
			'site_transient_update_plugins',
			[ $this, 'inject_update_data' ]
		);

		// Also hook the WRITE filter for completeness.
		$loader->add_filter(
			'pre_set_site_transient_update_plugins',
			[ $this, 'inject_update_data' ]
		);

		$loader->add_filter(
			'plugins_api',
			[ $this, 'plugin_info' ],
			20,
			3
		);
		$loader->add_filter(
			'upgrader_post_install',
			[ $this, 'after_install' ],
			10,
			3
		);
		$loader->add_action(
			'cm_check_for_updates',
			[ $this, 'flush_update_cache' ]
		);
		$loader->add_action(
			'load-plugins.php',
			[ $this, 'force_update_check' ]
		);

		if ( ! wp_next_scheduled( 'cm_check_for_updates' ) ) {
			wp_schedule_event( time(), 'daily', 'cm_check_for_updates' );
		}
	}

	public function force_update_check(): void {
		// Flush our GitHub cache so the next read gets a fresh version number.
		delete_transient( 'cm_github_latest_' . md5( CM_GITHUB_REPO ) );
		delete_transient( 'cm_github_releases_' . md5( CM_GITHUB_REPO ) );
		// Delete WP's update transient so it re-runs the full check.
		delete_site_transient( 'update_plugins' );
		// Trigger an immediate check so the banner appears on this page load.
		wp_update_plugins();
	}

	/**
	 * Inject our update into the transient — works on both read and write.
	 */
	public function inject_update_data( mixed $transient ): mixed {
		if ( ! is_object( $transient ) ) {
			return $transient;
		}

		// Ensure the standard arrays exist.
		if ( ! isset( $transient->response ) ) {
			$transient->response = [];
		}
		if ( ! isset( $transient->no_update ) ) {
			$transient->no_update = [];
		}

		$latest = $this->provider->get_latest_version();

		if ( version_compare( $latest, CM_VERSION, '>' ) ) {
			$transient->response[ CM_PLUGIN_BASENAME ] = (object) [
				'slug'         => 'boostcart',
				'plugin'       => CM_PLUGIN_BASENAME,
				'new_version'  => $latest,
				'url'          => 'https://github.com/' . CM_GITHUB_REPO,
				'package'      => $this->provider->get_download_url( $latest ),
				'icons'        => [],
				'banners'      => [],
				'tested'       => get_bloginfo( 'version' ),
				'requires_php' => '8.1',
			];
			// Remove from no_update if previously cached there.
			unset( $transient->no_update[ CM_PLUGIN_BASENAME ] );
		} else {
			$transient->no_update[ CM_PLUGIN_BASENAME ] = (object) [
				'slug'        => 'boostcart',
				'plugin'      => CM_PLUGIN_BASENAME,
				'new_version' => CM_VERSION,
				'url'         => 'https://github.com/' . CM_GITHUB_REPO,
				'package'     => '',
			];
			// Remove from response if previously cached there.
			unset( $transient->response[ CM_PLUGIN_BASENAME ] );
		}

		return $transient;
	}

	public function plugin_info( mixed $result, string $action, object $args ): mixed {
		if ( 'plugin_information' !== $action ) {
			return $result;
		}
		if ( empty( $args->slug ) || 'boostcart' !== $args->slug ) {
			return $result;
		}
		return $this->provider->get_plugin_info();
	}

	public function after_install( bool|array|\WP_Error $response, array $hook_extra, array $result ): bool|array|\WP_Error {
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		if ( empty( $hook_extra['plugin'] ) || CM_PLUGIN_BASENAME !== $hook_extra['plugin'] ) {
			return $response;
		}

		$new_version  = $this->provider->get_latest_version();
		$download_url = $this->provider->get_download_url( $new_version );
		$changelog    = $this->provider->get_changelog( $new_version );

		$this->history->record( $new_version, $download_url, $changelog );
		update_option( 'cm_version', $new_version );
		$this->flush_update_cache();

		return $response;
	}

	public function flush_update_cache(): void {
		delete_transient( 'cm_github_latest_' . md5( CM_GITHUB_REPO ) );
		delete_transient( 'cm_github_releases_' . md5( CM_GITHUB_REPO ) );
		delete_site_transient( 'update_plugins' );
	}

	public function get_provider(): UpdateProviderInterface {
		return $this->provider;
	}

	public function get_rollback_manager(): RollbackManager {
		return $this->rollback;
	}

	public function get_history(): VersionHistory {
		return $this->history;
	}
}
