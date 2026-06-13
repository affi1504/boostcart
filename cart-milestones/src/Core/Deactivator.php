<?php

declare(strict_types=1);

namespace CartMilestones\Core;

class Deactivator {

	public static function deactivate(): void {
		wp_clear_scheduled_hook( 'cm_check_for_updates' );
		flush_rewrite_rules();
	}
}
