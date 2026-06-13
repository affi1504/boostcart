<?php

declare(strict_types=1);

namespace CartMilestones\API\Controllers;

use CartMilestones\API\Middleware\AuthMiddleware;
use CartMilestones\Campaigns\CampaignRepository;
use CartMilestones\Campaigns\CampaignService;
use CartMilestones\Campaigns\MilestoneRepository;
use CartMilestones\Conditions\ConditionRepository;

class CampaignsController {

	public function __construct(
		private readonly CampaignRepository $campaigns,
		private readonly CampaignService $service,
		private readonly MilestoneRepository $milestones,
		private readonly ConditionRepository $conditions
	) {}

	public function register_routes( string $namespace ): void {
		register_rest_route( $namespace, '/campaigns', [
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'index' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
				'args'                => [
					'status'   => [ 'type' => 'string', 'enum' => [ 'active', 'inactive', 'scheduled', 'expired' ] ],
					'per_page' => [ 'type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 100 ],
					'page'     => [ 'type' => 'integer', 'default' => 1, 'minimum' => 1 ],
				],
			],
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'create' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
				'args'                => $this->campaign_schema(),
			],
		] );

		register_rest_route( $namespace, '/campaigns/(?P<id>[\d]+)', [
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'show' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			],
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'update' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
				'args'                => $this->campaign_schema(),
			],
			[
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => [ $this, 'delete' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			],
		] );

		register_rest_route( $namespace, '/campaigns/(?P<id>[\d]+)/duplicate', [
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => [ $this, 'duplicate' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
		] );

		register_rest_route( $namespace, '/campaigns/(?P<id>[\d]+)/status', [
			'methods'             => 'PATCH',
			'callback'            => [ $this, 'patch_status' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			'args'                => [
				'status' => [
					'required' => true,
					'type'     => 'string',
					'enum'     => [ 'active', 'inactive', 'scheduled', 'expired' ],
				],
			],
		] );
	}

	public function index( \WP_REST_Request $request ): \WP_REST_Response {
		$args = array_filter( [
			'status'   => $request->get_param( 'status' ),
			'per_page' => $request->get_param( 'per_page' ),
			'page'     => $request->get_param( 'page' ),
		] );

		$items = $this->campaigns->find_all( $args );
		$total = $this->campaigns->count( $args );

		$response = new \WP_REST_Response( $items, 200 );
		$response->header( 'X-WP-Total', $total );
		$response->header( 'X-WP-TotalPages', (int) ceil( $total / ( $args['per_page'] ?? 20 ) ) );

		return $response;
	}

	public function show( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id       = (int) $request->get_param( 'id' );
		$campaign = $this->campaigns->find( $id );

		if ( null === $campaign ) {
			return new \WP_Error( 'cm_not_found', __( 'Campaign not found.', 'boostcart' ), [ 'status' => 404 ] );
		}

		$campaign['milestones'] = $this->milestones->find_by_campaign( $id );
		$campaign['conditions'] = $this->conditions->get_tree( $id );

		return new \WP_REST_Response( $campaign, 200 );
	}

	public function create( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		try {
			$data     = $this->extract_campaign_data( $request );
			$campaign = $this->service->create( $data );
			\CartMilestones\Core\Logger::info( 'Campaign created', [ 'id' => $campaign['id'], 'name' => $campaign['name'] ] );
			return new \WP_REST_Response( $campaign, 201 );
		} catch ( \Throwable $e ) {
			\CartMilestones\Core\Logger::error( 'Campaign create failed', [ 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString() ] );
			return new \WP_Error( 'cm_invalid', $e->getMessage(), [ 'status' => 422 ] );
		}
	}

	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id = (int) $request->get_param( 'id' );
		try {
			$data     = $this->extract_campaign_data( $request );
			$campaign = $this->service->update( $id, $data );
			\CartMilestones\Core\Logger::info( 'Campaign updated', [ 'id' => $id ] );
			return new \WP_REST_Response( $campaign, 200 );
		} catch ( \Throwable $e ) {
			\CartMilestones\Core\Logger::error( 'Campaign update failed', [ 'id' => $id, 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString() ] );
			return new \WP_Error( 'cm_invalid', $e->getMessage(), [ 'status' => 422 ] );
		}
	}

	/**
	 * Extract only whitelisted campaign fields from the request.
	 * Prevents WordPress internal route params from leaking into the DB.
	 */
	private function extract_campaign_data( \WP_REST_Request $request ): array {
		$allowed = [
			'name', 'status', 'trigger_type', 'stacking_mode',
			'target_scope', 'target_ids', 'start_date', 'end_date', 'priority',
		];
		$data = [];
		foreach ( $allowed as $key ) {
			if ( null !== $request->get_param( $key ) ) {
				$data[ $key ] = $request->get_param( $key );
			}
		}
		return $data;
	}

	public function delete( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id      = (int) $request->get_param( 'id' );
		$deleted = $this->service->delete( $id );
		if ( ! $deleted ) {
			return new \WP_Error( 'cm_not_found', __( 'Campaign not found.', 'boostcart' ), [ 'status' => 404 ] );
		}
		return new \WP_REST_Response( null, 204 );
	}

	public function duplicate( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id       = (int) $request->get_param( 'id' );
		$original = $this->campaigns->find( $id );
		if ( null === $original ) {
			return new \WP_Error( 'cm_not_found', __( 'Campaign not found.', 'boostcart' ), [ 'status' => 404 ] );
		}

		$copy         = $original;
		$copy['name'] = sprintf( '%s (Copy)', $original['name'] );
		$copy['status'] = 'inactive';
		unset( $copy['id'], $copy['created_at'], $copy['updated_at'] );

		try {
			$new_campaign = $this->service->create( $copy );
		} catch ( \InvalidArgumentException $e ) {
			return new \WP_Error( 'cm_invalid', $e->getMessage(), [ 'status' => 422 ] );
		}

		// Duplicate milestones.
		$orig_milestones = $this->milestones->find_by_campaign( $id );
		foreach ( $orig_milestones as $ms ) {
			unset( $ms['id'], $ms['created_at'] );
			$this->milestones->create( (int) $new_campaign['id'], $ms );
		}

		// Duplicate conditions.
		$orig_tree = $this->conditions->get_tree( $id );
		if ( ! empty( $orig_tree ) ) {
			$this->conditions->save_tree( (int) $new_campaign['id'], $orig_tree );
		}

		return new \WP_REST_Response( $new_campaign, 201 );
	}

	public function patch_status( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id     = (int) $request->get_param( 'id' );
		$status = $request->get_param( 'status' );

		if ( null === $this->campaigns->find( $id ) ) {
			return new \WP_Error( 'cm_not_found', __( 'Campaign not found.', 'boostcart' ), [ 'status' => 404 ] );
		}

		$this->campaigns->update( $id, [ 'status' => $status ] );
		return new \WP_REST_Response( $this->campaigns->find( $id ), 200 );
	}

	private function campaign_schema(): array {
		return [
			'name'          => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
			'status'        => [ 'type' => 'string', 'enum' => [ 'active', 'inactive', 'scheduled', 'expired' ] ],
			'trigger_type'  => [ 'type' => 'string' ],
			'stacking_mode' => [ 'type' => 'string', 'enum' => [ 'stackable', 'exclusive' ] ],
			'target_scope'  => [ 'type' => 'string', 'enum' => [ 'store', 'categories', 'products', 'roles' ] ],
			'target_ids'    => [ 'type' => 'array' ],
			'start_date'    => [
				'type'              => 'string',
				'sanitize_callback' => static function ( $val ) {
					// Accept empty string (clear the date) or any non-empty string.
					$val = sanitize_text_field( $val );
					if ( empty( $val ) ) {
						return null;
					}
					// Normalise datetime-local format (YYYY-MM-DDTHH:MM) to MySQL datetime.
					$ts = strtotime( $val );
					return $ts ? date( 'Y-m-d H:i:s', $ts ) : null;
				},
			],
			'end_date'      => [
				'type'              => 'string',
				'sanitize_callback' => static function ( $val ) {
					$val = sanitize_text_field( $val );
					if ( empty( $val ) ) {
						return null;
					}
					$ts = strtotime( $val );
					return $ts ? date( 'Y-m-d H:i:s', $ts ) : null;
				},
			],
			'priority'      => [ 'type' => 'integer' ],
		];
	}
}
