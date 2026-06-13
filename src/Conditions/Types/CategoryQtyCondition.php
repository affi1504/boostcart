<?php

declare(strict_types=1);

namespace CartMilestones\Conditions\Types;

use CartMilestones\Conditions\Contracts\ConditionInterface;

class CategoryQtyCondition implements ConditionInterface {

	public function evaluate( array $condition, array $context ): bool {
		$category_ids = (array) ( $condition['meta']['category_ids'] ?? [] );
		$cart_items   = (array) ( $context['cart_items'] ?? [] );

		$qty = 0;
		foreach ( $cart_items as $item ) {
			if ( $this->item_in_categories( $item, $category_ids ) ) {
				$qty += (int) ( $item['quantity'] ?? 0 );
			}
		}

		return $this->compare( $qty, $condition['comparator'], (float) $condition['value'] );
	}

	private function item_in_categories( array $item, array $category_ids ): bool {
		$product_id = (int) ( $item['product_id'] ?? 0 );
		if ( ! $product_id ) {
			return false;
		}
		foreach ( $category_ids as $cat_id ) {
			if ( has_term( (int) $cat_id, 'product_cat', $product_id ) ) {
				return true;
			}
		}
		return false;
	}

	private function compare( float $actual, string $comparator, float $threshold ): bool {
		return match ( $comparator ) {
			'>='    => $actual >= $threshold,
			'<='    => $actual <= $threshold,
			'>'     => $actual > $threshold,
			'<'     => $actual < $threshold,
			'='     => $actual == $threshold,
			'!='    => $actual != $threshold,
			default => false,
		};
	}
}
