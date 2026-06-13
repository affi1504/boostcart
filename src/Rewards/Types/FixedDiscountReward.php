<?php

declare(strict_types=1);

namespace CartMilestones\Rewards\Types;

use CartMilestones\Rewards\Contracts\RewardInterface;

class FixedDiscountReward implements RewardInterface {

	public function apply( array $milestone, array $context ): void {
		$amount = (float) ( $milestone['reward_value'] ?? 0.0 );
		$label  = $milestone['label'] ?? sprintf(
			/* translators: %s: formatted discount amount */
			__( '%s OFF', 'boostcart' ),
			wc_price( $amount )
		);

		WC()->cart->add_fee( $label, -$amount, true, '' );
		WC()->session->set( 'cm_applied_milestone_' . $milestone['id'], true );
	}

	public function remove( array $milestone ): void {
		WC()->session->__unset( 'cm_applied_milestone_' . $milestone['id'] );
	}
}
