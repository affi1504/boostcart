<?php

declare(strict_types=1);

namespace CartMilestones\Update;

use CartMilestones\Update\Contracts\UpdateProviderInterface;

class GitHubUpdateProvider implements UpdateProviderInterface {

	private const CACHE_TTL = 6 * HOUR_IN_SECONDS;

	public function __construct( private readonly string $repo ) {}

	public function get_latest_version(): string {
		$release = $this->fetch_latest_release();
		if ( empty( $release->tag_name ) ) {
			return CM_VERSION;
		}
		return ltrim( $release->tag_name, 'v' );
	}

	public function get_download_url( string $version ): string {
		$releases = $this->fetch_all_releases();
		foreach ( $releases as $release ) {
			if ( ltrim( $release->tag_name, 'v' ) === $version ) {
				foreach ( $release->assets ?? [] as $asset ) {
					if ( str_ends_with( $asset->name, '.zip' ) ) {
						return $asset->browser_download_url;
					}
				}
				// Fallback to zipball.
				return $release->zipball_url ?? '';
			}
		}
		return '';
	}

	public function get_changelog( string $version ): string {
		$releases = $this->fetch_all_releases();
		foreach ( $releases as $release ) {
			if ( ltrim( $release->tag_name, 'v' ) === $version ) {
				return $release->body ?? '';
			}
		}
		return '';
	}

	public function get_version_list(): array {
		$releases = $this->fetch_all_releases();
		return array_map(
			static fn( $r ) => ltrim( $r->tag_name, 'v' ),
			$releases
		);
	}

	public function get_plugin_info(): object {
		$release = $this->fetch_latest_release();
		$version = $this->get_latest_version();

		return (object) [
			'name'          => 'Cart Milestones',
			'slug'          => 'cart-milestones',
			'version'       => $version,
			'author'        => 'Your Name',
			'homepage'      => "https://github.com/{$this->repo}",
			'download_link' => $this->get_download_url( $version ),
			'sections'      => [
				'description' => 'Increase Average Order Value through milestone-based rewards and gamification.',
				'changelog'   => $release->body ?? '',
			],
			'last_updated'  => $release->published_at ?? '',
			'requires'      => '6.4',
			'tested'        => get_bloginfo( 'version' ),
			'requires_php'  => '8.1',
		];
	}

	private function fetch_latest_release(): object {
		$cache_key = 'cm_github_latest_' . md5( $this->repo );
		$cached    = get_transient( $cache_key );

		if ( false !== $cached ) {
			return $cached;
		}

		$response = wp_remote_get(
			"https://api.github.com/repos/{$this->repo}/releases/latest",
			[
				'headers' => [
					'Accept'     => 'application/vnd.github.v3+json',
					'User-Agent' => 'WordPress/CartMilestones-' . CM_VERSION,
				],
				'timeout' => 10,
			]
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new \stdClass();
		}

		$release = json_decode( wp_remote_retrieve_body( $response ) );
		if ( ! is_object( $release ) ) {
			return new \stdClass();
		}

		set_transient( $cache_key, $release, self::CACHE_TTL );
		return $release;
	}

	private function fetch_all_releases(): array {
		$cache_key = 'cm_github_releases_' . md5( $this->repo );
		$cached    = get_transient( $cache_key );

		if ( false !== $cached ) {
			return $cached;
		}

		$response = wp_remote_get(
			"https://api.github.com/repos/{$this->repo}/releases?per_page=20",
			[
				'headers' => [
					'Accept'     => 'application/vnd.github.v3+json',
					'User-Agent' => 'WordPress/CartMilestones-' . CM_VERSION,
				],
				'timeout' => 10,
			]
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return [];
		}

		$releases = json_decode( wp_remote_retrieve_body( $response ) );
		if ( ! is_array( $releases ) ) {
			return [];
		}

		set_transient( $cache_key, $releases, self::CACHE_TTL );
		return $releases;
	}
}
