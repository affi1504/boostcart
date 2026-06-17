<?php

declare(strict_types=1);

namespace CartMilestones\Campaigns;

use CartMilestones\Conditions\ConditionEvaluator;
use CartMilestones\Conditions\ConditionRepository;

class CampaignEvaluator {

	public function __construct(
		private readonly CampaignRepository $campaigns,
		private readonly MilestoneRepository $milestones,
		private readonly ConditionRepository $conditions,
		private readonly ConditionEvaluator $evaluator
	) {}

	/**
	 * Return all active campaigns that pass conditions, with per-milestone
	 * evaluation results for the current cart.
	 *
	 * @return array<array{campaign: array, milestones: array, context: array}>
	 */
	public function get_active_for_cart(): array {
		$active = $this->campaigns->find_active();
		if ( empty( $active ) ) {
			return [];
		}

		$context = $this->build_context();
		$result  = [];

		foreach ( $active as $campaign ) {
			if ( ! $this->campaign_targets_context( $campaign, $context ) ) {
				continue;
			}

			// Campaign-level eligibility conditions (optional).
			$tree = $this->conditions->get_tree( (int) $campaign['id'] );
			if ( ! empty( $tree ) && ! $this->evaluator->evaluate_tree( $tree, $context ) ) {
				continue;
			}

			$milestones = $this->milestones->find_by_campaign( (int) $campaign['id'] );
			if ( empty( $milestones ) ) {
				continue;
			}

			$result[] = [
				'campaign'   => $campaign,
				'milestones' => $this->evaluate_milestones( $milestones, $context ),
				'context'    => $context,
			];
		}

		return $result;
	}

	/**
	 * Evaluate each milestone against its own trigger independently.
	 */
	public function evaluate_milestones( array $milestones, array $context ): array {
		return array_map( function ( array $ms ) use ( $context ): array {
			$current = $this->get_current_value(
				$ms['trigger_type'] ?? 'cart_value',
				$ms['trigger_target_ids'] ?? [],
				$context
			);
			$ms['current_value'] = $current;
			$ms['earned']        = $this->compare(
				$current,
				$ms['comparator'] ?? '>=',
				(float) $ms['threshold_value']
			);
			return $ms;
		}, $milestones );
	}

	/**
	 * Get the current measured value for a trigger type.
	 */
	public function get_current_value( string $trigger_type, array $target_ids, array $context ): float {
		return match ( $trigger_type ) {
			'cart_value'     => (float) ( $context['cart_total'] ?? 0.0 ),
			'product_qty'    => $this->sum_product_qty( $target_ids, $context ),
			'category_qty'   => $this->sum_category_qty( $target_ids, $context ),
			'category_spend' => $this->sum_category_spend( $target_ids, $context ),
			'product_spend'  => $this->sum_product_spend( $target_ids, $context ),
			default          => 0.0,
		};
	}

	private function sum_product_qty( array $product_ids, array $context ): float {
		$qty = 0;
		foreach ( $context['cart_items'] ?? [] as $item ) {
			if ( in_array( (int) $item['product_id'], $product_ids, true )
				|| in_array( (int) ( $item['variation_id'] ?? 0 ), $product_ids, true ) ) {
				$qty += (int) $item['quantity'];
			}
		}
		return (float) $qty;
	}

	private function sum_category_qty( array $category_ids, array $context ): float {
		$qty = 0;
		foreach ( $context['cart_items'] ?? [] as $item ) {
			if ( $this->item_in_categories( (int) $item['product_id'], $category_ids ) ) {
				$qty += (int) $item['quantity'];
			}
		}
		return (float) $qty;
	}

	private function sum_category_spend( array $category_ids, array $context ): float {
		$spend = 0.0;
		foreach ( $context['cart_items'] ?? [] as $item ) {
			if ( $this->item_in_categories( (int) $item['product_id'], $category_ids ) ) {
				$spend += (float) ( $item['line_total'] ?? 0.0 );
			}
		}
		return $spend;
	}

	private function sum_product_spend( array $product_ids, array $context ): float {
		$spend = 0.0;
		foreach ( $context['cart_items'] ?? [] as $item ) {
			if ( in_array( (int) $item['product_id'], $product_ids, true )
				|| in_array( (int) ( $item['variation_id'] ?? 0 ), $product_ids, true ) ) {
				$spend += (float) ( $item['line_total'] ?? 0.0 );
			}
		}
		return $spend;
	}

	private function get_lifetime_spend( int $customer_id ): float {
		if ( ! $customer_id ) {
			return 0.0;
		}
		$key    = "cm_lifetime_spend_{$customer_id}";
		$cached = wp_cache_get( $key, 'cart_milestones' );
		if ( false !== $cached ) {
			return (float) $cached;
		}
		$orders = wc_get_orders( [
			'customer_id' => $customer_id,
			'status'      => [ 'wc-completed', 'wc-processing' ],
			'limit'       => -1,
			'return'      => 'ids',
		] );
		$spend = 0.0;
		foreach ( $orders as $oid ) {
			$o = wc_get_order( $oid );
			if ( $o ) {
				$spend += (float) $o->get_total();
			}
		}
		wp_cache_set( $key, $spend, 'cart_milestones', 5 * MINUTE_IN_SECONDS );
		return $spend;
	}

	private function get_lifetime_orders( int $customer_id ): int {
		if ( ! $customer_id ) {
			return 0;
		}
		$key    = "cm_lifetime_orders_{$customer_id}";
		$cached = wp_cache_get( $key, 'cart_milestones' );
		if ( false !== $cached ) {
			return (int) $cached;
		}
		$count = (int) wc_get_customer_order_count( $customer_id );
		wp_cache_set( $key, $count, 'cart_milestones', 5 * MINUTE_IN_SECONDS );
		return $count;
	}

	private function item_in_categories( int $product_id, array $category_ids ): bool {
		// has_term() requires term cache to be populated, which doesn't happen
		// in REST context. Use wc_get_product() instead — it loads term data directly.
		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return false;
		}
		$product_cats = $product->get_category_ids();
		foreach ( $category_ids as $cat_id ) {
			if ( in_array( (int) $cat_id, $product_cats, true ) ) {
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
			'='     => abs( $actual - $threshold ) < 0.001,
			'!='    => abs( $actual - $threshold ) >= 0.001,
			default => false,
		};
	}

	private function build_context(): array {
		$cart       = WC()->cart;
		$cart_items = [];
		$cart_total = 0.0;

		foreach ( $cart->get_cart() as $key => $item ) {
			$line_total  = (float) ( $item['line_total'] ?? 0.0 );
			$cart_total += $line_total;
			$cart_items[] = [
				'key'          => $key,
				'product_id'   => (int) $item['product_id'],
				'variation_id' => (int) ( $item['variation_id'] ?? 0 ),
				'quantity'     => (int) $item['quantity'],
				'line_total'   => $line_total,
			];
		}

		// Fall back to WC cart total if available and non-zero.
		$wc_total = (float) $cart->get_cart_contents_total();
		if ( $wc_total > 0 ) {
			$cart_total = $wc_total;
		}

		$customer_roles = [];
		$user           = wp_get_current_user();
		if ( $user->exists() ) {
			$customer_roles = (array) $user->roles;
		}

		return [
			'cart_total'     => (float) $cart->get_cart_contents_total(),
			'cart_items'     => $cart_items,
			'customer_id'    => (int) ( WC()->customer ? WC()->customer->get_id() : 0 ),
			'customer_roles' => $customer_roles,
		];
	}

	private function campaign_targets_context( array $campaign, array $context ): bool {
		$scope      = $campaign['target_scope'] ?? 'store';
		$target_ids = (array) ( $campaign['target_ids'] ?? [] );

		if ( 'store' === $scope || empty( $target_ids ) ) {
			return true;
		}

		if ( 'roles' === $scope ) {
			foreach ( $target_ids as $role ) {
				if ( in_array( $role, $context['customer_roles'], true ) ) {
					return true;
				}
			}
			return false;
		}

		if ( 'products' === $scope ) {
			foreach ( $context['cart_items'] as $item ) {
				if ( in_array( (int) $item['product_id'], $target_ids, true ) ) {
					return true;
				}
			}
			return false;
		}

		if ( 'categories' === $scope ) {
			foreach ( $context['cart_items'] as $item ) {
				if ( $this->item_in_categories( (int) $item['product_id'], $target_ids ) ) {
					return true;
				}
			}
			return false;
		}

		return true;
	}
}
