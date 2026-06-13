<?php

declare(strict_types=1);

namespace CartMilestones\Conditions\Types;

use CartMilestones\Conditions\Contracts\ConditionInterface;

class CartValueCondition implements ConditionInterface {

	public function evaluate( array $condition, array $context ): bool {
		$cart_total = (float) ( $context['cart_total'] ?? 0.0 );
		return $this->compare( $cart_total, $condition['comparator'], (float) $condition['value'] );
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
