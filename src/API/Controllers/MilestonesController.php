<?php

declare(strict_types=1);

namespace CartMilestones\API\Controllers;

use CartMilestones\API\Middleware\AuthMiddleware;
use CartMilestones\Campaigns\MilestoneRepository;
use CartMilestones\Campaigns\MilestoneService;

class MilestonesController {

	public function __construct(
		private readonly MilestoneRepository $repository,
		private readonly MilestoneService $service
	) {}

	public function register_routes( string $namespace ): void {
		register_rest_route( $namespace, '/campaigns/(?P<campaign_id>[\d]+)/milestones', [
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'index' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			],
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'create' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
				'args'                => $this->milestone_schema(),
			],
		] );

		register_rest_route( $namespace, '/campaigns/(?P<campaign_id>[\d]+)/milestones/(?P<id>[\d]+)', [
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'update' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
				'args'                => $this->milestone_schema(),
			],
			[
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => [ $this, 'delete' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			],
		] );

		register_rest_route( $namespace, '/campaigns/(?P<campaign_id>[\d]+)/milestones/(?P<id>[\d]+)/best-value', [
			'methods'             => 'PATCH',
			'callback'            => [ $this, 'set_best_value' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
		] );

		// Batch save — replaces all milestones for a campaign atomically.
		register_rest_route( $namespace, '/campaigns/(?P<campaign_id>[\d]+)/milestones/batch', [
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => [ $this, 'batch_save' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			'args'                => [
				'milestones' => [ 'type' => 'array', 'required' => true ],
			],
		] );
	}

	public function index( \WP_REST_Request $request ): \WP_REST_Response {
		$milestones = $this->repository->find_by_campaign( (int) $request->get_param( 'campaign_id' ) );
		return new \WP_REST_Response( $milestones, 200 );
	}

	public function create( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$campaign_id = (int) $request->get_param( 'campaign_id' );
		try {
			$data      = $this->extract_milestone_data( $request );
			$milestone = $this->service->create( $campaign_id, $data );
			return new \WP_REST_Response( $milestone, 201 );
		} catch ( \Throwable $e ) {
			return new \WP_Error( 'cm_invalid', $e->getMessage(), [ 'status' => 422 ] );
		}
	}

	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id = (int) $request->get_param( 'id' );
		$data      = $this->extract_milestone_data( $request );
		$milestone = $this->service->update( $id, $data );
		if ( null === $milestone ) {
			return new \WP_Error( 'cm_not_found', __( 'Milestone not found.', 'boostcart' ), [ 'status' => 404 ] );
		}
		return new \WP_REST_Response( $milestone, 200 );
	}

	public function delete( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$deleted = $this->service->delete( (int) $request->get_param( 'id' ) );
		if ( ! $deleted ) {
			return new \WP_Error( 'cm_not_found', __( 'Milestone not found.', 'boostcart' ), [ 'status' => 404 ] );
		}
		return new \WP_REST_Response( null, 204 );
	}

	public function set_best_value( \WP_REST_Request $request ): \WP_REST_Response {
		$this->service->set_best_value(
			(int) $request->get_param( 'campaign_id' ),
			(int) $request->get_param( 'id' )
		);
		return new \WP_REST_Response( [ 'success' => true ], 200 );
	}

	/**
	 * Atomically replace all milestones for a campaign.
	 * Deletes existing ones and inserts the new set.
	 */
	public function batch_save( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$campaign_id = (int) $request->get_param( 'campaign_id' );
		$milestones  = (array) $request->get_param( 'milestones' );

		if ( empty( $milestones ) ) {
			return new \WP_Error( 'cm_invalid', __( 'At least one milestone is required.', 'boostcart' ), [ 'status' => 422 ] );
		}

		$this->repository->delete_by_campaign( $campaign_id );

		$saved = [];
		foreach ( $milestones as $i => $ms ) {
			$ms['sort_order'] = $i;
			try {
				$saved[] = $this->service->create( $campaign_id, $ms );
			} catch ( \Throwable $e ) {
				\CartMilestones\Core\Logger::error( 'Milestone batch save failed', [ 'index' => $i, 'error' => $e->getMessage() ] );
			}
		}

		return new \WP_REST_Response( $saved, 200 );
	}

	private function extract_milestone_data( \WP_REST_Request $request ): array {
		$allowed = [
			'trigger_type', 'trigger_target_ids', 'comparator',
			'threshold_value', 'reward_type', 'reward_value', 'reward_meta',
			'is_best_value', 'label', 'message_template', 'sort_order',
		];
		$data = [];
		foreach ( $allowed as $key ) {
			if ( null !== $request->get_param( $key ) ) {
				$data[ $key ] = $request->get_param( $key );
			}
		}
		return $data;
	}

	private function milestone_schema(): array {
		return [
			'trigger_type'       => [ 'type' => 'string' ],
			'trigger_target_ids' => [ 'type' => 'array' ],
			'comparator'         => [ 'type' => 'string', 'enum' => [ '>=', '<=', '>', '<', '=', '!=' ] ],
			'threshold_value'    => [ 'type' => 'number', 'minimum' => 0 ],
			'reward_type'        => [
				'type' => 'string',
				'enum' => [ 'percentage_discount', 'fixed_discount', 'free_shipping', 'free_product', 'store_credit', 'coupon_unlock', 'custom' ],
			],
			'reward_value'       => [ 'type' => 'number', 'minimum' => 0 ],
			'reward_meta'        => [ 'type' => 'object' ],
			'is_best_value'      => [ 'type' => 'boolean' ],
			'label'              => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
			'message_template'   => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
			'sort_order'         => [ 'type' => 'integer', 'minimum' => 0 ],
		];
	}
}
