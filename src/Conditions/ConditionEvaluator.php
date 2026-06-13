<?php

declare(strict_types=1);

namespace CartMilestones\Conditions;

use CartMilestones\Conditions\Contracts\ConditionInterface;
use CartMilestones\Conditions\Types\CartValueCondition;
use CartMilestones\Conditions\Types\CategoryQtyCondition;
use CartMilestones\Conditions\Types\CategorySpendCondition;
use CartMilestones\Conditions\Types\CustomerRoleCondition;
use CartMilestones\Conditions\Types\DateRangeCondition;
use CartMilestones\Conditions\Types\ProductQtyCondition;
use CartMilestones\Conditions\Types\ProductSpendCondition;

class ConditionEvaluator {

	/** @var array<string, ConditionInterface> */
	private array $handlers;

	public function __construct() {
		$this->handlers = [
			'cart_value'     => new CartValueCondition(),
			'product_qty'    => new ProductQtyCondition(),
			'category_qty'   => new CategoryQtyCondition(),
			'category_spend' => new CategorySpendCondition(),
			'product_spend'  => new ProductSpendCondition(),
			'customer_role'  => new CustomerRoleCondition(),
			'date_range'     => new DateRangeCondition(),
		];
	}

	/**
	 * Evaluate a condition tree recursively.
	 *
	 * @param array $nodes   Condition tree nodes (from ConditionRepository::get_tree).
	 * @param array $context Cart context built by CampaignEvaluator.
	 */
	public function evaluate_tree( array $nodes, array $context ): bool {
		if ( empty( $nodes ) ) {
			return true;
		}

		// A single root group node is the entry point.
		if ( 1 === count( $nodes ) && 'group' === $nodes[0]['condition_type'] ) {
			return $this->evaluate_group( $nodes[0], $context );
		}

		// Multiple root nodes — treat as implicit AND.
		foreach ( $nodes as $node ) {
			if ( ! $this->evaluate_node( $node, $context ) ) {
				return false;
			}
		}
		return true;
	}

	private function evaluate_group( array $group, array $context ): bool {
		$children = $group['children'] ?? [];
		if ( empty( $children ) ) {
			return true;
		}

		$operator = strtoupper( $group['operator'] ?? 'AND' );

		if ( 'OR' === $operator ) {
			foreach ( $children as $child ) {
				if ( $this->evaluate_node( $child, $context ) ) {
					return true;
				}
			}
			return false;
		}

		// AND.
		foreach ( $children as $child ) {
			if ( ! $this->evaluate_node( $child, $context ) ) {
				return false;
			}
		}
		return true;
	}

	private function evaluate_node( array $node, array $context ): bool {
		if ( 'group' === $node['condition_type'] ) {
			return $this->evaluate_group( $node, $context );
		}

		$handler = $this->handlers[ $node['condition_type'] ] ?? null;
		if ( null === $handler ) {
			// Unknown condition type — skip permissively.
			return true;
		}

		return $handler->evaluate( $node, $context );
	}
}
