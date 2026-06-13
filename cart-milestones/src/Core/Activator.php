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

	private static function create_tables(): void {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();

		$sql = [];

		$sql[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}cm_campaigns (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			name VARCHAR(255) NOT NULL,
			status ENUM('active','inactive','scheduled','expired') NOT NULL DEFAULT 'inactive',
			trigger_type ENUM('cart_value','product_qty','category_qty','category_spend','product_spend','lifetime_spend','lifetime_orders') NOT NULL DEFAULT 'cart_value',
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

		$sql[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}cm_milestones (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			campaign_id BIGINT UNSIGNED NOT NULL,
			sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
			threshold_value DECIMAL(15,4) NOT NULL,
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
			CONSTRAINT fk_cm_milestones_campaign FOREIGN KEY (campaign_id) REFERENCES {$wpdb->prefix}cm_campaigns (id) ON DELETE CASCADE
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
			CONSTRAINT fk_cm_conditions_campaign FOREIGN KEY (campaign_id) REFERENCES {$wpdb->prefix}cm_campaigns (id) ON DELETE CASCADE
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

	private static function set_default_options(): void {
		$defaults = [
			'display_locations'  => [ 'cart', 'checkout', 'floating_widget' ],
			'celebration_types'  => [ 'confetti', 'toast' ],
			'currency_symbol'    => get_woocommerce_currency_symbol(),
			'update_channel'     => 'github',
			'github_repo'        => CM_GITHUB_REPO,
		];

		if ( false === get_option( 'cm_settings' ) ) {
			add_option( 'cm_settings', $defaults );
		}
	}
}
