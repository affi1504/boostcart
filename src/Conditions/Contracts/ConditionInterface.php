<?php

declare(strict_types=1);

namespace CartMilestones\Conditions\Contracts;

interface ConditionInterface {

	/**
	 * Evaluate whether this condition passes for the given cart context.
	 *
	 * @param array $condition  The condition row from the database.
	 * @param array $context    Cart context: cart object, customer, cart total, etc.
	 */
	public function evaluate( array $condition, array $context ): bool;
}
