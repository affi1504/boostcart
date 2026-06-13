<?php

declare(strict_types=1);

namespace CartMilestones\Rewards\Contracts;

interface RewardInterface {

	/**
	 * Apply this reward to the WooCommerce cart/session.
	 *
	 * @param array $milestone  The milestone row that triggered this reward.
	 * @param array $context    Cart context.
	 */
	public function apply( array $milestone, array $context ): void;

	/**
	 * Remove this reward (if reversible) when the milestone is no longer met.
	 *
	 * @param array $milestone  The milestone row.
	 */
	public function remove( array $milestone ): void;
}
