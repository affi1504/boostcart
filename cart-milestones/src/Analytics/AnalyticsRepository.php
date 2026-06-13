<?php

declare(strict_types=1);

namespace CartMilestones\Analytics;

class AnalyticsRepository {

	private string $table;

	public function __construct() {
		global $wpdb;
		$this->table = $wpdb->prefix . 'cm_analytics_events';
	}

	public function record( array $data ): int {
		global $wpdb;
		$wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$this->table,
			[
				'event_type'      => $data['event_type'],
				'campaign_id'     => (int) $data['campaign_id'],
				'milestone_id'    => (int) $data['milestone_id'],
				'order_id'        => $data['order_id'] ?? null,
				'session_id'      => $data['session_id'] ?? null,
				'user_id'         => (int) ( $data['user_id'] ?? 0 ),
				'cart_value'      => $data['cart_value'] ?? null,
				'discount_amount' => $data['discount_amount'] ?? null,
			],
			[ '%s', '%d', '%d', '%d', '%s', '%d', '%f', '%f' ]
		);
		return (int) $wpdb->insert_id;
	}

	public function get_summary( array $args = [] ): array {
		global $wpdb;

		$where  = '1=1';
		$values = [];

		if ( ! empty( $args['date_from'] ) ) {
			$where   .= ' AND created_at >= %s';
			$values[] = $args['date_from'];
		}
		if ( ! empty( $args['date_to'] ) ) {
			$where   .= ' AND created_at <= %s';
			$values[] = $args['date_to'];
		}
		if ( ! empty( $args['campaign_id'] ) ) {
			$where   .= ' AND campaign_id = %d';
			$values[] = (int) $args['campaign_id'];
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$sql = "SELECT
			COUNT(DISTINCT CASE WHEN event_type = 'milestone_reached' THEN id END) AS milestones_reached,
			COUNT(DISTINCT CASE WHEN event_type = 'reward_applied' THEN id END)    AS rewards_applied,
			COUNT(DISTINCT CASE WHEN event_type = 'reward_redeemed' THEN id END)   AS rewards_redeemed,
			SUM(CASE WHEN event_type = 'reward_applied' THEN discount_amount ELSE 0 END) AS total_discount,
			AVG(CASE WHEN event_type = 'reward_applied' THEN cart_value ELSE NULL END)   AS avg_cart_value,
			COUNT(DISTINCT order_id) AS influenced_orders
		FROM {$this->table} WHERE {$where}";

		if ( ! empty( $values ) ) {
			$sql = $wpdb->prepare( $sql, ...$values ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		}

		$row = $wpdb->get_row( $sql, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery
		return $row ?? [];
	}

	public function get_milestone_reach_rates( ?int $campaign_id = null ): array {
		global $wpdb;

		$where  = "event_type = 'milestone_reached'";
		$values = [];

		if ( $campaign_id ) {
			$where   .= ' AND campaign_id = %d';
			$values[] = $campaign_id;
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$sql = "SELECT milestone_id, COUNT(*) AS reach_count
				FROM {$this->table}
				WHERE {$where}
				GROUP BY milestone_id
				ORDER BY reach_count DESC";

		if ( ! empty( $values ) ) {
			$sql = $wpdb->prepare( $sql, ...$values ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		}

		return $wpdb->get_results( $sql, ARRAY_A ) ?? []; // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery
	}

	public function get_events( array $args = [] ): array {
		global $wpdb;

		$per_page = (int) ( $args['per_page'] ?? 50 );
		$page     = (int) ( $args['page'] ?? 1 );
		$offset   = ( $page - 1 ) * $per_page;

		$sql = $wpdb->prepare( // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"SELECT * FROM {$this->table} ORDER BY created_at DESC LIMIT %d OFFSET %d",
			$per_page,
			$offset
		);

		return $wpdb->get_results( $sql, ARRAY_A ) ?? []; // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery
	}
}
