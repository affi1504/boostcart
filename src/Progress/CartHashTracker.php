<?php

declare(strict_types=1);

namespace CartMilestones\Progress;

class CartHashTracker {

	private const SESSION_KEY = 'cm_celebrated_milestones';

	/**
	 * Check whether a celebration has already fired for this milestone + cart hash combo.
	 */
	public function has_celebrated( int $milestone_id, string $cart_hash ): bool {
		$key     = "{$milestone_id}_{$cart_hash}";
		$session = (array) ( WC()->session->get( self::SESSION_KEY ) ?? [] );
		return in_array( $key, $session, true );
	}

	/**
	 * Mark a milestone + cart hash combination as celebrated.
	 */
	public function mark_celebrated( int $milestone_id, string $cart_hash ): void {
		$key     = "{$milestone_id}_{$cart_hash}";
		$session = (array) ( WC()->session->get( self::SESSION_KEY ) ?? [] );
		if ( ! in_array( $key, $session, true ) ) {
			$session[] = $key;
			WC()->session->set( self::SESSION_KEY, $session );
		}
	}

	/**
	 * Get the current WooCommerce cart hash.
	 */
	public function current_hash(): string {
		return WC()->cart ? WC()->cart->get_cart_hash() : '';
	}

	/**
	 * Clear all celebration records (e.g. on cart empty).
	 */
	public function clear(): void {
		WC()->session->set( self::SESSION_KEY, [] );
	}
}
