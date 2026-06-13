<?php

declare(strict_types=1);

namespace CartMilestones\Conditions\Types;

use CartMilestones\Conditions\Contracts\ConditionInterface;

class LifetimeOrdersCondition implements ConditionInterface {

	public function evaluate( array $condition, array $context ): bool {
		$customer_id = (int) ( $context['customer_id'] ?? 0 );
		if ( ! $customer_id ) {
			return false;
		}

		$count = $this->get_order_count( $customer_id );
		return $this->compare( $count, $condition['comparator'], (float) $condition['value'] );
	}

	private function get_order_count( int $customer_id ): int {
		$cache_key = "cm_lifetime_orders_{$customer_id}";
		$cached    = wp_cache_get( $cache_key, 'boostcart' );
		if ( false !== $cached ) {
			return (int) $cached;
		}

		// HPOS-compatible.
		$count = wc_get_customer_order_count( $customer_id );
		wp_cache_set( $cache_key, $count, 'boostcart', 5 * MINUTE_IN_SECONDS );
		return (int) $count;
	}

	private function compare( float $actual, string $comparator, float $threshold ): bool {
		return match ( $comparator ) {
			'>='    => $actual >= $threshold,
			'<='    => $actual <= $threshold,
			'>'     => $actual > $threshold,
			'<'     => $actual < $threshold,
			'='     => $actual == $threshold,
			'!='    => $actual != $threshold,
			default => false,
		};
	}
}
