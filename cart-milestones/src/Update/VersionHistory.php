<?php

declare(strict_types=1);

namespace CartMilestones\Update;

class VersionHistory {

	private string $table;

	public function __construct() {
		global $wpdb;
		$this->table = $wpdb->prefix . 'cm_update_history';
	}

	public function record( string $version, string $zip_url, string $changelog = '' ): void {
		global $wpdb;
		$wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$this->table,
			[
				'version'   => $version,
				'zip_url'   => $zip_url,
				'changelog' => $changelog,
			],
			[ '%s', '%s', '%s' ]
		);
	}

	/**
	 * Get all recorded versions, newest first.
	 *
	 * @return array<array{id: int, version: string, zip_url: string, changelog: string, installed_at: string}>
	 */
	public function get_all(): array {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$results = $wpdb->get_results( "SELECT * FROM {$this->table} ORDER BY installed_at DESC", ARRAY_A );
		return $results ?? [];
	}

	/**
	 * Get the version just before the current one (for single-step rollback).
	 */
	public function get_previous(): ?array {
		$all = $this->get_all();
		// Index 0 is the current install; index 1 is the previous.
		return $all[1] ?? null;
	}

	public function get_by_version( string $version ): ?array {
		$all = $this->get_all();
		foreach ( $all as $entry ) {
			if ( $entry['version'] === $version ) {
				return $entry;
			}
		}
		return null;
	}
}
