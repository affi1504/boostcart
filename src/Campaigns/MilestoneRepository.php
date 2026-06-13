<?php

declare(strict_types=1);

namespace CartMilestones\Campaigns;

class MilestoneRepository {

	private string $table;

	public function __construct() {
		global $wpdb;
		$this->table = $wpdb->prefix . 'cm_milestones';
	}

	/**
	 * @return array<array>
	 */
	public function find_by_campaign( int $campaign_id ): array {
		global $wpdb;

		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT * FROM {$this->table} WHERE campaign_id = %d ORDER BY sort_order ASC, threshold_value ASC", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$campaign_id
			),
			ARRAY_A
		);

		return array_map( [ $this, 'hydrate' ], $rows ?? [] );
	}

	public function find( int $id ): ?array {
		global $wpdb;
		$row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare( "SELECT * FROM {$this->table} WHERE id = %d", $id ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);
		return $row ? $this->hydrate( $row ) : null;
	}

	public function create( int $campaign_id, array $data ): int {
		global $wpdb;
		$data['campaign_id'] = $campaign_id;
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

	public function delete_by_campaign( int $campaign_id ): void {
		global $wpdb;
		$wpdb->delete( $this->table, [ 'campaign_id' => $campaign_id ], [ '%d' ] ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
	}

	/** Clear best_value flag on all milestones for a campaign, then set on one. */
	public function set_best_value( int $campaign_id, int $milestone_id ): void {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( $wpdb->prepare( "UPDATE {$this->table} SET is_best_value = 0 WHERE campaign_id = %d", $campaign_id ) );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( $wpdb->prepare( "UPDATE {$this->table} SET is_best_value = 1 WHERE id = %d", $milestone_id ) );
	}

	private function hydrate( array $row ): array {
		$row['reward_meta']      = ! empty( $row['reward_meta'] ) ? json_decode( $row['reward_meta'], true ) : [];
		$row['threshold_value']  = (float) $row['threshold_value'];
		$row['reward_value']     = isset( $row['reward_value'] ) ? (float) $row['reward_value'] : null;
		$row['is_best_value']    = (bool) $row['is_best_value'];
		$row['sort_order']       = (int) $row['sort_order'];
		return $row;
	}

	private function prepare_data( array $data ): array {
		if ( isset( $data['reward_meta'] ) && is_array( $data['reward_meta'] ) ) {
			$data['reward_meta'] = wp_json_encode( $data['reward_meta'] );
		}
		unset( $data['id'], $data['created_at'] );
		return $data;
	}

	private function formats( array $data ): array {
		$float_cols  = [ 'threshold_value', 'reward_value' ];
		$string_cols = [ 'reward_type', 'reward_meta', 'label', 'message_template' ];
		$formats     = [];
		foreach ( array_keys( $data ) as $col ) {
			if ( in_array( $col, $float_cols, true ) ) {
				$formats[] = '%f';
			} elseif ( in_array( $col, $string_cols, true ) ) {
				$formats[] = '%s';
			} else {
				$formats[] = '%d';
			}
		}
		return $formats;
	}
}
