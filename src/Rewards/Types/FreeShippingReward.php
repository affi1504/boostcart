<?php

declare(strict_types=1);

namespace CartMilestones\Rewards\Types;

use CartMilestones\Rewards\Contracts\RewardInterface;

class FreeShippingReward implements RewardInterface {

	private const SESSION_KEY = 'cm_free_shipping_milestone_ids';

	public function apply( array $milestone, array $context ): void {
		$ids   = (array) ( WC()->session->get( self::SESSION_KEY ) ?? [] );
		$ids[] = (int) $milestone['id'];
		WC()->session->set( self::SESSION_KEY, array_unique( $ids ) );

		// Hook into WooCommerce free shipping rate availability.
		add_filter(
			'woocommerce_package_rates',
			[ $this, 'force_free_shipping' ],
			100
		);
	}

	public function remove( array $milestone ): void {
		$ids = (array) ( WC()->session->get( self::SESSION_KEY ) ?? [] );
		$ids = array_diff( $ids, [ (int) $milestone['id'] ] );
		WC()->session->set( self::SESSION_KEY, array_values( $ids ) );
	}

	/** Make all free-shipping methods available and hide paid ones. */
	public function force_free_shipping( array $rates ): array {
		$ids = (array) ( WC()->session->get( self::SESSION_KEY ) ?? [] );
		if ( empty( $ids ) ) {
			return $rates;
		}

		$free = [];
		foreach ( $rates as $rate_id => $rate ) {
			if ( 0 == $rate->cost ) { // phpcs:ignore WordPress.PHP.StrictComparisons
				$free[ $rate_id ] = $rate;
			}
		}

		return ! empty( $free ) ? $free : $rates;
	}
}
