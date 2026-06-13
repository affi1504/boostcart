<?php

declare(strict_types=1);

namespace CartMilestones\Rewards\Types;

use CartMilestones\Rewards\Contracts\RewardInterface;

class StoreCreditReward implements RewardInterface {

	public function apply( array $milestone, array $context ): void {
		$amount = (float) ( $milestone['reward_value'] ?? 0.0 );
		$label  = $milestone['label'] ?? sprintf(
			/* translators: %s: formatted store credit amount */
			__( '%s Store Credit', 'boostcart' ),
			wc_price( $amount )
		);

		// Store credit is typically applied as a negative fee.
		// Integrates with WooCommerce store credit / points plugins via the session key.
		WC()->cart->add_fee( $label, -$amount, false, '' );
		WC()->session->set( 'cm_store_credit_milestone_' . $milestone['id'], $amount );
	}

	public function remove( array $milestone ): void {
		WC()->session->__unset( 'cm_store_credit_milestone_' . $milestone['id'] );
	}
}
