<?php

declare(strict_types=1);

namespace CartMilestones\Conditions\Types;

use CartMilestones\Conditions\Contracts\ConditionInterface;

class ProductSpendCondition implements ConditionInterface {

	public function evaluate( array $condition, array $context ): bool {
		$product_ids = (array) ( $condition['meta']['product_ids'] ?? [] );
		$cart_items  = (array) ( $context['cart_items'] ?? [] );

		$spend = 0.0;
		foreach ( $cart_items as $item ) {
			$pid = (int) ( $item['product_id'] ?? 0 );
			$vid = (int) ( $item['variation_id'] ?? 0 );
			if ( in_array( $pid, $product_ids, true ) || in_array( $vid, $product_ids, true ) ) {
				$spend += (float) ( $item['line_total'] ?? 0.0 );
			}
		}

		return $this->compare( $spend, $condition['comparator'], (float) $condition['value'] );
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
