<?php

declare(strict_types=1);

namespace CartMilestones\Core;

/**
 * Simple file-based debug logger.
 * Writes to wp-content/uploads/boostcart-debug.log when debug mode is on.
 */
class Logger {

	private static bool $enabled = false;
	private static string $log_file = '';

	public static function boot(): void {
		$settings        = get_option( 'cm_settings', [] );
		self::$enabled   = ! empty( $settings['debug_mode'] );
		self::$log_file  = WP_CONTENT_DIR . '/uploads/boostcart-debug.log';
	}

	public static function log( string $level, string $message, array $context = [] ): void {
		if ( ! self::$enabled ) {
			return;
		}

		$entry = sprintf(
			"[%s] [%s] %s %s\n",
			current_time( 'Y-m-d H:i:s' ),
			strtoupper( $level ),
			$message,
			empty( $context ) ? '' : wp_json_encode( $context )
		);

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( self::$log_file, $entry, FILE_APPEND | LOCK_EX );
	}

	public static function info( string $message, array $context = [] ): void {
		self::log( 'info', $message, $context );
	}

	public static function error( string $message, array $context = [] ): void {
		self::log( 'error', $message, $context );
	}

	public static function warning( string $message, array $context = [] ): void {
		self::log( 'warning', $message, $context );
	}

	public static function get_log_contents(): string {
		if ( ! file_exists( self::$log_file ) ) {
			return '';
		}
		// Return last 200 lines to avoid huge payloads.
		$lines = file( self::$log_file, FILE_IGNORE_NEW_LINES );
		if ( ! $lines ) {
			return '';
		}
		return implode( "\n", array_slice( $lines, -200 ) );
	}

	public static function clear_log(): void {
		if ( file_exists( self::$log_file ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			file_put_contents( self::$log_file, '' );
		}
	}

	public static function is_enabled(): bool {
		return self::$enabled;
	}

	public static function log_file_url(): string {
		return WP_CONTENT_URL . '/uploads/boostcart-debug.log';
	}
}
