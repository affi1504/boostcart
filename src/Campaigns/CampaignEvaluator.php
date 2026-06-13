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
	 * Return all campaigns that are active and whose conditions pass for the current cart.
	 *
	 * @return array<array{campaign: array, milestones: array}>
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

			$tree = $this->conditions->get_tree( (int) $campaign['id'] );
			if ( ! $this->evaluator->evaluate_tree( $tree, $context ) ) {
				continue;
			}

			$result[] = [
				'campaign'   => $campaign,
				'milestones' => $this->milestones->find_by_campaign( (int) $campaign['id'] ),
			];
		}

		return $result;
	}

	private function build_context(): array {
		$cart        = WC()->cart;
		$customer    = WC()->customer;
		$cart_items  = [];

		foreach ( $cart->get_cart() as $key => $item ) {
			$cart_items[] = [
				'key'          => $key,
				'product_id'   => $item['product_id'],
				'variation_id' => $item['variation_id'] ?? 0,
				'quantity'     => $item['quantity'],
				'line_total'   => $item['line_total'] ?? 0.0,
			];
		}

		$customer_roles = [];
		$user           = wp_get_current_user();
		if ( $user->exists() ) {
			$customer_roles = (array) $user->roles;
		}

		return [
			'cart_total'     => (float) $cart->get_cart_contents_total(),
			'cart_items'     => $cart_items,
			'customer_id'    => (int) ( $customer ? $customer->get_id() : 0 ),
			'customer_roles' => $customer_roles,
		];
	}

	private function campaign_targets_context( array $campaign, array $context ): bool {
		$scope = $campaign['target_scope'] ?? 'store';

		if ( 'store' === $scope ) {
			return true;
		}

		$target_ids = (array) ( $campaign['target_ids'] ?? [] );
		if ( empty( $target_ids ) ) {
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
				foreach ( $target_ids as $cat_id ) {
					if ( has_term( (int) $cat_id, 'product_cat', (int) $item['product_id'] ) ) {
						return true;
					}
				}
			}
			return false;
		}

		return true;
	}
}
