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
		$loader->add_filter(
			'pre_set_site_transient_update_plugins',
			[ $this, 'check_for_update' ]
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

		// Schedule a daily cache flush so update notices stay fresh.
		if ( ! wp_next_scheduled( 'cm_check_for_updates' ) ) {
			wp_schedule_event( time(), 'daily', 'cm_check_for_updates' );
		}
	}

	/**
	 * Inject our update data into the WordPress plugin update transient.
	 */
	public function check_for_update( object $transient ): object {
		if ( empty( $transient->checked ) ) {
			return $transient;
		}

		$latest = $this->provider->get_latest_version();

		if ( version_compare( $latest, CM_VERSION, '>' ) ) {
			$transient->response[ CM_PLUGIN_BASENAME ] = (object) [
				'slug'        => 'cart-milestones',
				'plugin'      => CM_PLUGIN_BASENAME,
				'new_version' => $latest,
				'url'         => "https://github.com/" . CM_GITHUB_REPO,
				'package'     => $this->provider->get_download_url( $latest ),
				'icons'       => [],
				'banners'     => [],
				'tested'      => get_bloginfo( 'version' ),
				'requires_php' => '8.1',
			];
		} else {
			// Tell WordPress the plugin is up to date.
			$transient->no_update[ CM_PLUGIN_BASENAME ] = (object) [
				'slug'        => 'cart-milestones',
				'plugin'      => CM_PLUGIN_BASENAME,
				'new_version' => CM_VERSION,
				'url'         => "https://github.com/" . CM_GITHUB_REPO,
				'package'     => '',
			];
		}

		return $transient;
	}

	/**
	 * Provide plugin information for the "View version details" popup.
	 */
	public function plugin_info( mixed $result, string $action, object $args ): mixed {
		if ( 'plugin_information' !== $action ) {
			return $result;
		}

		if ( empty( $args->slug ) || 'cart-milestones' !== $args->slug ) {
			return $result;
		}

		return $this->provider->get_plugin_info();
	}

	/**
	 * After a successful update install, record the new version in history.
	 */
	public function after_install( bool|array|\WP_Error $response, array $hook_extra, array $result ): bool|array|\WP_Error {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( empty( $hook_extra['plugin'] ) || CM_PLUGIN_BASENAME !== $hook_extra['plugin'] ) {
			return $response;
		}

		$new_version = $this->provider->get_latest_version();
		$download_url = $this->provider->get_download_url( $new_version );
		$changelog    = $this->provider->get_changelog( $new_version );

		$this->history->record( $new_version, $download_url, $changelog );
		update_option( 'cm_version', $new_version );

		// Bust our own caches.
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
