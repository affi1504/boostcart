<?php

declare(strict_types=1);

namespace CartMilestones\Campaigns;

class MilestoneService {

	public function __construct(
		private readonly MilestoneRepository $repository
	) {}

	public function create( int $campaign_id, array $data ): array {
		$data = $this->sanitize( $data );
		if ( ! isset( $data['sort_order'] ) ) {
			$existing         = $this->repository->find_by_campaign( $campaign_id );
			$data['sort_order'] = count( $existing );
		}
		$id = $this->repository->create( $campaign_id, $data );
		return $this->repository->find( $id );
	}

	public function update( int $id, array $data ): ?array {
		$data = $this->sanitize( $data );
		$this->repository->update( $id, $data );
		return $this->repository->find( $id );
	}

	public function delete( int $id ): bool {
		return $this->repository->delete( $id );
	}

	public function set_best_value( int $campaign_id, int $milestone_id ): void {
		$this->repository->set_best_value( $campaign_id, $milestone_id );
	}

	private function sanitize( array $data ): array {
		$allowed_triggers = [
			'cart_value', 'product_qty', 'category_qty', 'category_spend',
			'product_spend', 'lifetime_spend', 'lifetime_orders',
		];
		$allowed_rewards = [
			'percentage_discount', 'fixed_discount', 'free_shipping',
			'free_product', 'store_credit', 'coupon_unlock', 'custom',
		];
		$allowed_comparators = [ '>=', '<=', '>', '<', '=', '!=' ];

		if ( isset( $data['trigger_type'] ) && ! in_array( $data['trigger_type'], $allowed_triggers, true ) ) {
			$data['trigger_type'] = 'cart_value';
		}
		if ( isset( $data['reward_type'] ) && ! in_array( $data['reward_type'], $allowed_rewards, true ) ) {
			$data['reward_type'] = 'fixed_discount';
		}
		if ( isset( $data['comparator'] ) && ! in_array( $data['comparator'], $allowed_comparators, true ) ) {
			$data['comparator'] = '>=';
		}
		if ( isset( $data['threshold_value'] ) ) {
			$data['threshold_value'] = max( 0.0, (float) $data['threshold_value'] );
		}
		if ( isset( $data['reward_value'] ) ) {
			$data['reward_value'] = max( 0.0, (float) $data['reward_value'] );
		}
		if ( isset( $data['is_best_value'] ) ) {
			$data['is_best_value'] = (int) (bool) $data['is_best_value'];
		}
		if ( isset( $data['trigger_target_ids'] ) ) {
			$data['trigger_target_ids'] = array_map( 'intval', (array) $data['trigger_target_ids'] );
		}

		return $data;
	}
}
