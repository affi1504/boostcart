<?php

declare(strict_types=1);

namespace CartMilestones\Campaigns;

class CampaignRepository {

	private string $table;

	public function __construct() {
		global $wpdb;
		$this->table = $wpdb->prefix . 'cm_campaigns';
	}

	public function find( int $id ): ?array {
		global $wpdb;
		$row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare( "SELECT * FROM {$this->table} WHERE id = %d", $id ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);
		if ( ! $row ) {
			return null;
		}
		return $this->hydrate( $row );
	}

	/**
	 * @return array<array>
	 */
	public function find_all( array $args = [] ): array {
		global $wpdb;

		$where  = '1=1';
		$values = [];

		if ( ! empty( $args['status'] ) ) {
			$where   .= ' AND status = %s';
			$values[] = $args['status'];
		}

		$order_by = 'priority ASC, created_at DESC';
		$limit    = '';

		if ( isset( $args['per_page'] ) ) {
			$offset = ( ( $args['page'] ?? 1 ) - 1 ) * $args['per_page'];
			$limit  = $wpdb->prepare( 'LIMIT %d OFFSET %d', $args['per_page'], $offset ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$sql = "SELECT * FROM {$this->table} WHERE {$where} ORDER BY {$order_by} {$limit}";

		if ( ! empty( $values ) ) {
			$sql = $wpdb->prepare( $sql, ...$values ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		}

		$rows = $wpdb->get_results( $sql, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery
		return array_map( [ $this, 'hydrate' ], $rows ?? [] );
	}

	/**
	 * Find campaigns currently active for a given datetime.
	 *
	 * @return array<array>
	 */
	public function find_active( string $datetime = '' ): array {
		global $wpdb;

		if ( empty( $datetime ) ) {
			$datetime = current_time( 'mysql' );
		}

		$sql = $wpdb->prepare( // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"SELECT * FROM {$this->table}
			WHERE status = 'active'
			  AND (start_date IS NULL OR start_date <= %s)
			  AND (end_date IS NULL OR end_date >= %s)
			ORDER BY priority ASC",
			$datetime,
			$datetime
		);

		$rows = $wpdb->get_results( $sql, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery
		return array_map( [ $this, 'hydrate' ], $rows ?? [] );
	}

	public function create( array $data ): int {
		global $wpdb;

		$insert = $this->prepare_data( $data );
		$wpdb->insert( $this->table, $insert, $this->formats( $insert ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

		return (int) $wpdb->insert_id;
	}

	public function update( int $id, array $data ): bool {
		global $wpdb;

		$update = $this->prepare_data( $data );
		$result = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$this->table,
			$update,
			[ 'id' => $id ],
			$this->formats( $update ),
			[ '%d' ]
		);

		return false !== $result;
	}

	public function delete( int $id ): bool {
		global $wpdb;
		$result = $wpdb->delete( $this->table, [ 'id' => $id ], [ '%d' ] ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		return false !== $result;
	}

	public function count( array $args = [] ): int {
		global $wpdb;

		$where  = '1=1';
		$values = [];

		if ( ! empty( $args['status'] ) ) {
			$where   .= ' AND status = %s';
			$values[] = $args['status'];
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$sql = "SELECT COUNT(*) FROM {$this->table} WHERE {$where}";

		if ( ! empty( $values ) ) {
			$sql = $wpdb->prepare( $sql, ...$values ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		}

		return (int) $wpdb->get_var( $sql ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery
	}

	private function hydrate( array $row ): array {
		$row['target_ids'] = ! empty( $row['target_ids'] ) ? json_decode( $row['target_ids'], true ) : [];
		return $row;
	}

	private function prepare_data( array $data ): array {
		if ( isset( $data['target_ids'] ) && is_array( $data['target_ids'] ) ) {
			$data['target_ids'] = wp_json_encode( $data['target_ids'] );
		}
		unset( $data['id'], $data['created_at'], $data['updated_at'] );

		// Remove null values — wpdb cannot bind NULL with %s/%d format strings.
		// Columns with no value should simply be omitted from INSERT/UPDATE.
		$data = array_filter( $data, static fn( $v ) => null !== $v );

		return $data;
	}

	private function formats( array $data ): array {
		// trigger_type removed from campaigns in v2 — lives on milestones now.
		$string_cols = [ 'name', 'status', 'stacking_mode', 'target_scope', 'target_ids', 'start_date', 'end_date' ];
		$formats     = [];
		foreach ( array_keys( $data ) as $col ) {
			$formats[] = in_array( $col, $string_cols, true ) ? '%s' : '%d';
		}
		return $formats;
	}
}
