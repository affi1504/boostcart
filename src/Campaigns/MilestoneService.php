<?php

declare(strict_types=1);

namespace CartMilestones\Campaigns;

class MilestoneService {

	public function __construct(
		private readonly MilestoneRepository $repository
	) {}

	public function create( int $campaign_id, array $data ): array {
		$data = $this->sanitize( $data );
		// Auto-assign sort_order if not set.
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
		$allowed_types = [
			'percentage_discount', 'fixed_discount', 'free_shipping',
			'free_product', 'store_credit', 'coupon_unlock', 'custom',
		];

		if ( isset( $data['reward_type'] ) && ! in_array( $data['reward_type'], $allowed_types, true ) ) {
			$data['reward_type'] = 'fixed_discount';
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

		return $data;
	}
}
