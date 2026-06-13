<?php
/**
 * Fired when the plugin is uninstalled.
 */

declare(strict_types=1);

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

global $wpdb;

// Drop all plugin tables.
$tables = [
	'cm_analytics_events',
	'cm_conditions',
	'cm_milestones',
	'cm_campaigns',
	'cm_update_history',
];

foreach ( $tables as $table ) {
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}{$table}" );
}

// Delete all plugin options.
$options = [
	'cm_version',
	'cm_settings',
	'cm_update_history',
	'cm_latest_version_cache',
];

foreach ( $options as $option ) {
	delete_option( $option );
}

// Clear scheduled events.
wp_clear_scheduled_hook( 'cm_check_for_updates' );
