<?php

declare(strict_types=1);

namespace CartMilestones\Rewards\Types;

use CartMilestones\Rewards\Contracts\RewardInterface;

class FreeProductReward implements RewardInterface {

	public function apply( array $milestone, array $context ): void {
		$product_id = (int) ( $milestone['reward_meta']['product_id'] ?? 0 );
		if ( ! $product_id ) {
			return;
		}

		$cart_key = 'cm_free_product_' . $milestone['id'];

		// Avoid adding twice.
		foreach ( WC()->cart->get_cart() as $key => $item ) {
			if ( ! empty( $item['cm_free_product_milestone'] ) && $item['cm_free_product_milestone'] === $milestone['id'] ) {
				return;
			}
		}

		WC()->cart->add_to_cart(
			$product_id,
			1,
			0,
			[],
			[
				'cm_free_product_milestone' => (int) $milestone['id'],
				'cm_free_product_price'     => 0,
			]
		);

		// Zero out the price via a cart item price filter.
		add_filter(
			'woocommerce_cart_item_price',
			[ $this, 'zero_price_label' ],
			10,
			3
		);

		add_filter(
			'woocommerce_product_get_price',
			[ $this, 'zero_price_value' ],
			10,
			2
		);
	}

	public function remove( array $milestone ): void {
		foreach ( WC()->cart->get_cart() as $key => $item ) {
			if ( ! empty( $item['cm_free_product_milestone'] ) && (int) $item['cm_free_product_milestone'] === (int) $milestone['id'] ) {
				WC()->cart->remove_cart_item( $key );
				return;
			}
		}
	}

	public function zero_price_label( string $price, array $cart_item, string $cart_item_key ): string {
		if ( ! empty( $cart_item['cm_free_product_price'] ) ) {
			return '<del>' . $price . '</del> ' . wc_price( 0 );
		}
		return $price;
	}

	public function zero_price_value( float|string $price, \WC_Product $product ): float|string {
		// Handled via cart fees; we don't actually change the product price globally.
		return $price;
	}
}
