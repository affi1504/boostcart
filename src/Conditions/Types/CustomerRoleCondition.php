<?php

declare(strict_types=1);

namespace CartMilestones\Conditions\Types;

use CartMilestones\Conditions\Contracts\ConditionInterface;

class CustomerRoleCondition implements ConditionInterface {

	public function evaluate( array $condition, array $context ): bool {
		$allowed_roles = (array) ( $condition['meta']['roles'] ?? [] );
		$customer_roles = (array) ( $context['customer_roles'] ?? [] );

		if ( empty( $allowed_roles ) ) {
			return true;
		}

		foreach ( $allowed_roles as $role ) {
			if ( in_array( $role, $customer_roles, true ) ) {
				return '!=' !== $condition['comparator'];
			}
		}

		return '!=' === $condition['comparator'];
	}
}
