<?php

declare(strict_types=1);

namespace CartMilestones\Rewards\Types;

use CartMilestones\Rewards\Contracts\RewardInterface;

class CustomReward implements RewardInterface {

	public function apply( array $milestone, array $context ): void {
		WC()->session->set( 'cm_custom_reward_' . $milestone['id'], true );

		/**
		 * Fires when a custom reward milestone is reached.
		 *
		 * @param array $milestone  The milestone row.
		 * @param array $context    Cart context.
		 */
		do_action( 'boostcart_custom_reward_apply', $milestone, $context );
	}

	public function remove( array $milestone ): void {
		WC()->session->__unset( 'cm_custom_reward_' . $milestone['id'] );

		/**
		 * Fires when a custom reward milestone is no longer met.
		 *
		 * @param array $milestone  The milestone row.
		 */
		do_action( 'boostcart_custom_reward_remove', $milestone );
	}
}
