<?php

declare(strict_types=1);

namespace CartMilestones\Conditions\Types;

use CartMilestones\Conditions\Contracts\ConditionInterface;

class DateRangeCondition implements ConditionInterface {

	public function evaluate( array $condition, array $context ): bool {
		$now        = current_time( 'timestamp' );
		$start_str  = $condition['meta']['start_date'] ?? null;
		$end_str    = $condition['meta']['end_date'] ?? null;

		if ( $start_str && strtotime( $start_str ) > $now ) {
			return false;
		}
		if ( $end_str && strtotime( $end_str ) < $now ) {
			return false;
		}
		return true;
	}
}
