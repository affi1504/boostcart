<?php

declare(strict_types=1);

namespace CartMilestones\Campaigns;

class CampaignService {

	public function __construct(
		private readonly CampaignRepository $repository
	) {}

	public function create( array $data ): array {
		$data = $this->sanitize( $data );
		$this->validate( $data );
		$id = $this->repository->create( $data );
		return $this->repository->find( $id );
	}

	public function update( int $id, array $data ): array {
		$existing = $this->repository->find( $id );
		if ( null === $existing ) {
			throw new \InvalidArgumentException( "Campaign {$id} not found." );
		}
		$data = $this->sanitize( $data );
		$this->repository->update( $id, $data );
		return $this->repository->find( $id );
	}

	public function activate( int $id ): bool {
		return $this->repository->update( $id, [ 'status' => 'active' ] );
	}

	public function deactivate( int $id ): bool {
		return $this->repository->update( $id, [ 'status' => 'inactive' ] );
	}

	public function delete( int $id ): bool {
		return $this->repository->delete( $id );
	}

	private function sanitize( array $data ): array {
		$allowed_statuses      = [ 'active', 'inactive', 'scheduled', 'expired' ];
		$allowed_triggers      = [ 'cart_value', 'product_qty', 'category_qty', 'category_spend', 'product_spend', 'lifetime_spend', 'lifetime_orders' ];
		$allowed_scopes        = [ 'store', 'categories', 'products', 'roles' ];
		$allowed_stacking      = [ 'stackable', 'exclusive' ];

		if ( isset( $data['status'] ) && ! in_array( $data['status'], $allowed_statuses, true ) ) {
			$data['status'] = 'inactive';
		}
		if ( isset( $data['trigger_type'] ) && ! in_array( $data['trigger_type'], $allowed_triggers, true ) ) {
			$data['trigger_type'] = 'cart_value';
		}
		if ( isset( $data['target_scope'] ) && ! in_array( $data['target_scope'], $allowed_scopes, true ) ) {
			$data['target_scope'] = 'store';
		}
		if ( isset( $data['stacking_mode'] ) && ! in_array( $data['stacking_mode'], $allowed_stacking, true ) ) {
			$data['stacking_mode'] = 'exclusive';
		}

		return $data;
	}

	private function validate( array $data ): void {
		if ( empty( $data['name'] ) ) {
			throw new \InvalidArgumentException( __( 'Campaign name is required.', 'boostcart' ) );
		}
	}
}
