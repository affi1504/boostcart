<?php

declare(strict_types=1);

namespace CartMilestones\Update\Contracts;

interface UpdateProviderInterface {

	/**
	 * Get the latest available version string (e.g. "1.2.0").
	 */
	public function get_latest_version(): string;

	/**
	 * Get the download URL for a specific version ZIP.
	 */
	public function get_download_url( string $version ): string;

	/**
	 * Get changelog text for a specific version.
	 */
	public function get_changelog( string $version ): string;

	/**
	 * Get list of all available versions, newest first.
	 *
	 * @return string[]
	 */
	public function get_version_list(): array;

	/**
	 * Get plugin info object for WordPress plugins_api hook.
	 */
	public function get_plugin_info(): object;
}
