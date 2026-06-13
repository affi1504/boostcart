<?php

declare(strict_types=1);

namespace CartMilestones\Conditions;

class ConditionRepository {

	private string $table;

	public function __construct() {
		global $wpdb;
		$this->table = $wpdb->prefix . 'cm_conditions';
	}

	/** Return the full condition tree for a campaign as a nested array. */
	public function get_tree( int $campaign_id ): array {
		global $wpdb;

		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT * FROM {$this->table} WHERE campaign_id = %d ORDER BY sort_order ASC", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$campaign_id
			),
			ARRAY_A
		);

		if ( empty( $rows ) ) {
			return [];
		}

		return $this->build_tree( $rows, null );
	}

	/** Atomically replace the entire condition tree for a campaign. */
	public function save_tree( int $campaign_id, array $tree ): void {
		global $wpdb;

		// Delete all existing conditions for this campaign.
		$wpdb->delete( $this->table, [ 'campaign_id' => $campaign_id ], [ '%d' ] ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

		if ( empty( $tree ) ) {
			return;
		}

		$this->insert_nodes( $campaign_id, $tree, null, 0 );
	}

	private function insert_nodes( int $campaign_id, array $nodes, ?int $parent_id, int $sort_order ): void {
		global $wpdb;

		foreach ( $nodes as $i => $node ) {
			$meta = $node['meta'] ?? null;

			$wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$this->table,
				[
					'campaign_id'    => $campaign_id,
					'parent_id'      => $parent_id,
					'condition_type' => $node['condition_type'],
					'operator'       => $node['operator'] ?? null,
					'comparator'     => $node['comparator'] ?? null,
					'value'          => $node['value'] ?? null,
					'meta'           => is_array( $meta ) ? wp_json_encode( $meta ) : null,
					'sort_order'     => $sort_order + $i,
				],
				[ '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%d' ]
			);

			$new_id = (int) $wpdb->insert_id;

			if ( ! empty( $node['children'] ) ) {
				$this->insert_nodes( $campaign_id, $node['children'], $new_id, 0 );
			}
		}
	}

	private function build_tree( array $rows, ?int $parent_id ): array {
		$nodes = [];
		foreach ( $rows as $row ) {
			$row_parent = isset( $row['parent_id'] ) ? (int) $row['parent_id'] : null;
			if ( $row_parent !== $parent_id ) {
				continue;
			}
			$row['meta']     = ! empty( $row['meta'] ) ? json_decode( $row['meta'], true ) : [];
			$row['children'] = $this->build_tree( $rows, (int) $row['id'] );
			$nodes[]         = $row;
		}
		return $nodes;
	}
}
