<?php

declare(strict_types=1);

namespace CartMilestones\Tests\Unit\Conditions;

use CartMilestones\Conditions\ConditionEvaluator;
use PHPUnit\Framework\TestCase;

class ConditionEvaluatorTest extends TestCase {

	private ConditionEvaluator $evaluator;

	protected function setUp(): void {
		$this->evaluator = new ConditionEvaluator();
	}

	public function test_empty_tree_passes(): void {
		$this->assertTrue( $this->evaluator->evaluate_tree( [], [] ) );
	}

	public function test_single_cart_value_passes_when_met(): void {
		$tree = [
			[
				'condition_type' => 'group',
				'operator'       => 'AND',
				'children'       => [
					[
						'condition_type' => 'cart_value',
						'comparator'     => '>=',
						'value'          => '100',
						'meta'           => [],
					],
				],
			],
		];
		$context = [ 'cart_total' => 150.0 ];
		$this->assertTrue( $this->evaluator->evaluate_tree( $tree, $context ) );
	}

	public function test_single_cart_value_fails_when_not_met(): void {
		$tree = [
			[
				'condition_type' => 'group',
				'operator'       => 'AND',
				'children'       => [
					[
						'condition_type' => 'cart_value',
						'comparator'     => '>=',
						'value'          => '200',
						'meta'           => [],
					],
				],
			],
		];
		$context = [ 'cart_total' => 50.0 ];
		$this->assertFalse( $this->evaluator->evaluate_tree( $tree, $context ) );
	}

	public function test_and_group_requires_all_conditions(): void {
		$tree = [
			[
				'condition_type' => 'group',
				'operator'       => 'AND',
				'children'       => [
					[ 'condition_type' => 'cart_value', 'comparator' => '>=', 'value' => '50',  'meta' => [] ],
					[ 'condition_type' => 'cart_value', 'comparator' => '>=', 'value' => '200', 'meta' => [] ],
				],
			],
		];
		$this->assertFalse( $this->evaluator->evaluate_tree( $tree, [ 'cart_total' => 100.0 ] ) );
	}

	public function test_or_group_passes_with_one_matching(): void {
		$tree = [
			[
				'condition_type' => 'group',
				'operator'       => 'OR',
				'children'       => [
					[ 'condition_type' => 'cart_value', 'comparator' => '>=', 'value' => '200', 'meta' => [] ],
					[ 'condition_type' => 'cart_value', 'comparator' => '>=', 'value' => '50',  'meta' => [] ],
				],
			],
		];
		$this->assertTrue( $this->evaluator->evaluate_tree( $tree, [ 'cart_total' => 75.0 ] ) );
	}

	public function test_nested_groups(): void {
		$tree = [
			[
				'condition_type' => 'group',
				'operator'       => 'AND',
				'children'       => [
					[ 'condition_type' => 'cart_value', 'comparator' => '>=', 'value' => '50', 'meta' => [] ],
					[
						'condition_type' => 'group',
						'operator'       => 'OR',
						'children'       => [
							[ 'condition_type' => 'cart_value', 'comparator' => '>=', 'value' => '500', 'meta' => [] ],
							[ 'condition_type' => 'cart_value', 'comparator' => '>=', 'value' => '90',  'meta' => [] ],
						],
					],
				],
			],
		];
		$this->assertTrue( $this->evaluator->evaluate_tree( $tree, [ 'cart_total' => 100.0 ] ) );
	}
}
