<?php

declare(strict_types=1);

namespace CartMilestones\Conditions\Types;

use CartMilestones\Conditions\Contracts\ConditionInterface;

class LifetimeSpendCondition implements ConditionInterface {

	public function evaluate( array $condition, array $context ): bool {
		$customer_id = (int) ( $context['customer_id'] ?? 0 );
		if ( ! $customer_id ) {
			return false;
		}

		$spend = $this->get_lifetime_spend( $customer_id );
		return $this->compare( $spend, $condition['comparator'], (float) $condition['value'] );
	}

	private function get_lifetime_spend( int $customer_id ): float {
		$cache_key = "cm_lifetime_spend_{$customer_id}";
		$cached    = wp_cache_get( $cache_key, 'boostcart' );
		if ( false !== $cached ) {
			return (float) $cached;
		}

		// HPOS-compatible: use wc_get_orders instead of WP_Query on posts.
		$orders = wc_get_orders(
			[
				'customer_id' => $customer_id,
				'status'      => [ 'wc-completed', 'wc-processing' ],
				'limit'       => -1,
				'return'      => 'ids',
			]
		);

		$spend = 0.0;
		foreach ( $orders as $order_id ) {
			$order = wc_get_order( $order_id );
			if ( $order ) {
				$spend += (float) $order->get_total();
			}
		}

		wp_cache_set( $cache_key, $spend, 'boostcart', 5 * MINUTE_IN_SECONDS );
		return $spend;
	}

	private function compare( float $actual, string $comparator, float $threshold ): bool {
		return match ( $comparator ) {
			'>='    => $actual >= $threshold,
			'<='    => $actual <= $threshold,
			'>'     => $actual > $threshold,
			'<'     => $actual < $threshold,
			'='     => abs( $actual - $threshold ) < 0.001,
			'!='    => abs( $actual - $threshold ) >= 0.001,
			default => false,
		};
	}
}
