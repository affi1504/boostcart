<?php

declare(strict_types=1);

namespace CartMilestones\Rewards\Types;

use CartMilestones\Rewards\Contracts\RewardInterface;

class PercentageDiscountReward implements RewardInterface {

	public function apply( array $milestone, array $context ): void {
		$pct   = (float) ( $milestone['reward_value'] ?? 0.0 );
		$label = $milestone['label'] ?? sprintf(
			/* translators: %s: discount percentage */
			__( '%s%% OFF', 'boostcart' ),
			$pct
		);
		$cart_total = (float) WC()->cart->get_cart_contents_total();
		$amount     = round( $cart_total * ( $pct / 100 ), wc_get_price_decimals() );

		WC()->cart->add_fee( $label, -$amount, true, '' );

		WC()->session->set( 'cm_applied_milestone_' . $milestone['id'], true );
	}

	public function remove( array $milestone ): void {
		WC()->session->__unset( 'cm_applied_milestone_' . $milestone['id'] );
	}
}
