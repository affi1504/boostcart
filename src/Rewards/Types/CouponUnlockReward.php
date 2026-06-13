<?php

declare(strict_types=1);

namespace CartMilestones\Rewards\Types;

use CartMilestones\Rewards\Contracts\RewardInterface;

class CouponUnlockReward implements RewardInterface {

	public function apply( array $milestone, array $context ): void {
		$coupon_code = trim( $milestone['reward_meta']['coupon_code'] ?? '' );
		if ( empty( $coupon_code ) ) {
			return;
		}

		// Add the coupon to the cart if not already applied.
		if ( ! WC()->cart->has_discount( $coupon_code ) ) {
			WC()->cart->apply_coupon( $coupon_code );
		}

		WC()->session->set( 'cm_coupon_milestone_' . $milestone['id'], $coupon_code );
	}

	public function remove( array $milestone ): void {
		$coupon_code = WC()->session->get( 'cm_coupon_milestone_' . $milestone['id'] );
		if ( $coupon_code && WC()->cart->has_discount( $coupon_code ) ) {
			WC()->cart->remove_coupon( $coupon_code );
		}
		WC()->session->__unset( 'cm_coupon_milestone_' . $milestone['id'] );
	}
}
