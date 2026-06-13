<?php

declare(strict_types=1);

namespace CartMilestones\Progress;

class ProgressCalculator {

	/**
	 * Calculate progress state for a single campaign against a cart value.
	 *
	 * @param  array $milestones  Sorted ascending by threshold_value.
	 * @param  float $cart_value  Current cart subtotal.
	 * @return array{
	 *   current_value: float,
	 *   next_milestone: array|null,
	 *   prev_milestone: array|null,
	 *   earned_milestones: array,
	 *   remaining: float,
	 *   percent: float,
	 *   all_earned: bool
	 * }
	 */
	public function calculate( array $milestones, float $cart_value ): array {
		if ( empty( $milestones ) ) {
			return $this->empty_state( $cart_value );
		}

		// Ensure ascending sort.
		usort( $milestones, static fn( $a, $b ) => $a['threshold_value'] <=> $b['threshold_value'] );

		$earned     = [];
		$next       = null;
		$prev       = null;

		foreach ( $milestones as $ms ) {
			if ( $cart_value >= (float) $ms['threshold_value'] ) {
				$earned[] = $ms;
				$prev     = $ms;
			} else {
				$next = $ms;
				break;
			}
		}

		$all_earned = count( $earned ) === count( $milestones );
		$remaining  = $next ? max( 0.0, (float) $next['threshold_value'] - $cart_value ) : 0.0;

		// Percent: between prev threshold and next threshold.
		$percent = 100.0;
		if ( $next ) {
			$from    = $prev ? (float) $prev['threshold_value'] : 0.0;
			$to      = (float) $next['threshold_value'];
			$range   = $to - $from;
			$percent = $range > 0 ? min( 100.0, ( ( $cart_value - $from ) / $range ) * 100 ) : 0.0;
		}

		return [
			'current_value'     => $cart_value,
			'next_milestone'    => $next,
			'prev_milestone'    => $prev,
			'earned_milestones' => $earned,
			'remaining'         => $remaining,
			'percent'           => round( $percent, 2 ),
			'all_earned'        => $all_earned,
		];
	}

	private function empty_state( float $cart_value ): array {
		return [
			'current_value'     => $cart_value,
			'next_milestone'    => null,
			'prev_milestone'    => null,
			'earned_milestones' => [],
			'remaining'         => 0.0,
			'percent'           => 0.0,
			'all_earned'        => false,
		];
	}
}
