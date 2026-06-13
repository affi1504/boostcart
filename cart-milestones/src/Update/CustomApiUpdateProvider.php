<?php

declare(strict_types=1);

namespace CartMilestones\Update;

use CartMilestones\Update\Contracts\UpdateProviderInterface;

/**
 * Stub for a future custom licensing / update API.
 * Drop-in replacement for GitHubUpdateProvider — no plugin logic changes required.
 */
class CustomApiUpdateProvider implements UpdateProviderInterface {

	public function __construct(
		private readonly string $api_url,
		private readonly string $license_key = ''
	) {}

	public function get_latest_version(): string {
		$info = $this->fetch_info();
		return $info['version'] ?? CM_VERSION;
	}

	public function get_download_url( string $version ): string {
		$info = $this->fetch_info();
		return $info['download_url'] ?? '';
	}

	public function get_changelog( string $version ): string {
		$info = $this->fetch_info();
		return $info['changelog'] ?? '';
	}

	public function get_version_list(): array {
		$info = $this->fetch_info();
		return $info['versions'] ?? [ $this->get_latest_version() ];
	}

	public function get_plugin_info(): object {
		$info = $this->fetch_info();
		return (object) [
			'name'          => 'Cart Milestones',
			'slug'          => 'cart-milestones',
			'version'       => $info['version'] ?? CM_VERSION,
			'download_link' => $info['download_url'] ?? '',
			'sections'      => [
				'changelog' => $info['changelog'] ?? '',
			],
		];
	}

	private function fetch_info(): array {
		$cache_key = 'cm_custom_api_' . md5( $this->api_url . $this->license_key );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		$response = wp_remote_post(
			$this->api_url,
			[
				'body'    => [
					'action'      => 'get_version',
					'license_key' => $this->license_key,
					'plugin_slug' => 'cart-milestones',
					'version'     => CM_VERSION,
					'site_url'    => get_site_url(),
				],
				'timeout' => 10,
			]
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return [];
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $data ) ) {
			return [];
		}

		set_transient( $cache_key, $data, 6 * HOUR_IN_SECONDS );
		return $data;
	}
}
