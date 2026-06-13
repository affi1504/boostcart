<?php

declare(strict_types=1);

namespace CartMilestones\Core;

class Activator {

	public static function activate(): void {
		self::create_tables();
		self::set_default_options();
		flush_rewrite_rules();
		update_option( 'cm_version', CM_VERSION );
	}

	/**
	 * Run on every plugin load to apply schema migrations for existing installs.
	 * Safe to call repeatedly — only alters if the column is missing.
	 */
	public static function maybe_migrate(): void {
		$db_version = get_option( 'cm_db_version', '0' );
		if ( version_compare( $db_version, '2.0', '>=' ) ) {
			return;
		}
		self::create_tables();
		self::alter_milestones_table(); // dbDelta doesn't reliably ADD columns — use ALTER TABLE.
		self::migrate_trigger_type_to_milestones();
		update_option( 'cm_db_version', '2.0' );
	}

	/**
	 * Explicitly ADD columns to cm_milestones if they don't exist.
	 * dbDelta only creates tables reliably; for ALTER TABLE we do it ourselves.
	 */
	private static function alter_milestones_table(): void {
		global $wpdb;
		$table = $wpdb->prefix . 'cm_milestones';

		$columns_to_add = [
			'trigger_type'       => "VARCHAR(30) NOT NULL DEFAULT 'cart_value' AFTER sort_order",
			'trigger_target_ids' => "JSON NULL AFTER trigger_type",
			'comparator'         => "VARCHAR(2) NOT NULL DEFAULT '>=' AFTER trigger_target_ids",
		];

		foreach ( $columns_to_add as $column => $definition ) {
			// Check if column already exists.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$exists = $wpdb->get_var( $wpdb->prepare(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
				 WHERE TABLE_SCHEMA = DATABASE()
				   AND TABLE_NAME = %s
				   AND COLUMN_NAME = %s",
				$table,
				$column
			) );

			if ( ! $exists ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$wpdb->query( "ALTER TABLE {$table} ADD COLUMN {$column} {$definition}" );
				\CartMilestones\Core\Logger::info( "Added column {$column} to {$table}" );
			}
		}
	}

	private static function create_tables(): void {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();

		$sql = [];

		// Keep trigger_type on campaigns for backwards compat but it is now
		// informational only — the real trigger lives on each milestone.
		$sql[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}cm_campaigns (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			name VARCHAR(255) NOT NULL,
			status ENUM('active','inactive','scheduled','expired') NOT NULL DEFAULT 'inactive',
			stacking_mode ENUM('stackable','exclusive') NOT NULL DEFAULT 'exclusive',
			target_scope ENUM('store','categories','products','roles') NOT NULL DEFAULT 'store',
			target_ids JSON NULL,
			start_date DATETIME NULL,
			end_date DATETIME NULL,
			priority SMALLINT UNSIGNED NOT NULL DEFAULT 10,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY status (status),
			KEY start_date (start_date),
			KEY end_date (end_date)
		) $charset_collate;";

		// trigger_type, trigger_target_ids and comparator are new in v2.
		$sql[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}cm_milestones (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			campaign_id BIGINT UNSIGNED NOT NULL,
			sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
			trigger_type VARCHAR(30) NOT NULL DEFAULT 'cart_value',
			trigger_target_ids JSON NULL,
			comparator VARCHAR(2) NOT NULL DEFAULT '>=',
			threshold_value DECIMAL(15,4) NOT NULL DEFAULT 0,
			reward_type ENUM('percentage_discount','fixed_discount','free_shipping','free_product','store_credit','coupon_unlock','custom') NOT NULL,
			reward_value DECIMAL(15,4) NULL,
			reward_meta JSON NULL,
			is_best_value TINYINT(1) NOT NULL DEFAULT 0,
			label VARCHAR(255) NULL,
			message_template VARCHAR(500) NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY campaign_id (campaign_id),
			KEY sort_order (sort_order),
			CONSTRAINT fk_cm_milestones_campaign FOREIGN KEY (campaign_id)
				REFERENCES {$wpdb->prefix}cm_campaigns (id) ON DELETE CASCADE
		) $charset_collate;";

		$sql[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}cm_conditions (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			campaign_id BIGINT UNSIGNED NOT NULL,
			parent_id BIGINT UNSIGNED NULL,
			condition_type ENUM('group','cart_value','product_qty','category_qty','category_spend','product_spend','lifetime_spend','lifetime_orders','customer_role','date_range') NOT NULL,
			operator ENUM('AND','OR') NULL,
			comparator ENUM('>=','<=','>','<','=','!=') NULL,
			value VARCHAR(255) NULL,
			meta JSON NULL,
			sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
			PRIMARY KEY (id),
			KEY campaign_id (campaign_id),
			KEY parent_id (parent_id),
			CONSTRAINT fk_cm_conditions_campaign FOREIGN KEY (campaign_id)
				REFERENCES {$wpdb->prefix}cm_campaigns (id) ON DELETE CASCADE
		) $charset_collate;";

		$sql[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}cm_analytics_events (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			event_type ENUM('milestone_reached','reward_applied','reward_redeemed') NOT NULL,
			campaign_id BIGINT UNSIGNED NOT NULL,
			milestone_id BIGINT UNSIGNED NOT NULL,
			order_id BIGINT UNSIGNED NULL,
			session_id VARCHAR(64) NULL,
			user_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
			cart_value DECIMAL(15,4) NULL,
			discount_amount DECIMAL(15,4) NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY event_type (event_type),
			KEY campaign_id (campaign_id),
			KEY milestone_id (milestone_id),
			KEY created_at (created_at),
			KEY order_id (order_id)
		) $charset_collate;";

		$sql[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}cm_update_history (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			version VARCHAR(20) NOT NULL,
			zip_url VARCHAR(500) NOT NULL,
			changelog LONGTEXT NULL,
			installed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY version (version)
		) $charset_collate;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		foreach ( $sql as $query ) {
			dbDelta( $query );
		}
	}

	/**
	 * For v1 installs: copy trigger_type from campaign to all its milestones.
	 */
	private static function migrate_trigger_type_to_milestones(): void {
		global $wpdb;

		// Check if the old trigger_type column still exists on campaigns.
		$col = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			"SHOW COLUMNS FROM {$wpdb->prefix}cm_campaigns LIKE 'trigger_type'" // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);

		if ( empty( $col ) ) {
			return; // Already migrated or fresh install — nothing to do.
		}

		// Copy trigger_type from each campaign to milestones that don't have one yet.
		$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.NotPrepared
			"UPDATE {$wpdb->prefix}cm_milestones m
			 JOIN {$wpdb->prefix}cm_campaigns c ON c.id = m.campaign_id
			 SET m.trigger_type = c.trigger_type
			 WHERE m.trigger_type = 'cart_value'
			   AND c.trigger_type != 'cart_value'" // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);
	}

	private static function set_default_options(): void {
		$defaults = [
			'display_locations' => [ 'cart', 'checkout', 'floating_widget' ],
			'celebration_types' => [ 'confetti', 'toast' ],
			'currency_symbol'   => get_woocommerce_currency_symbol(),
			'update_channel'    => 'github',
			'github_repo'       => CM_GITHUB_REPO,
		];

		if ( false === get_option( 'cm_settings' ) ) {
			add_option( 'cm_settings', $defaults );
		}
	}
}
