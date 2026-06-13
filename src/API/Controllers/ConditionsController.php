<?php

declare(strict_types=1);

namespace CartMilestones\API\Controllers;

use CartMilestones\API\Middleware\AuthMiddleware;
use CartMilestones\Conditions\ConditionRepository;

class ConditionsController {

	public function __construct( private readonly ConditionRepository $repository ) {}

	public function register_routes( string $namespace ): void {
		register_rest_route( $namespace, '/campaigns/(?P<campaign_id>[\d]+)/conditions', [
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'show' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			],
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'save' ],
				'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
				'args'                => [
					'tree' => [
						'type'     => 'array',
						'required' => true,
					],
				],
			],
		] );
	}

	public function show( \WP_REST_Request $request ): \WP_REST_Response {
		$tree = $this->repository->get_tree( (int) $request->get_param( 'campaign_id' ) );
		return new \WP_REST_Response( $tree, 200 );
	}

	public function save( \WP_REST_Request $request ): \WP_REST_Response {
		$campaign_id = (int) $request->get_param( 'campaign_id' );
		$tree        = $request->get_param( 'tree' );
		$this->repository->save_tree( $campaign_id, (array) $tree );
		return new \WP_REST_Response( $this->repository->get_tree( $campaign_id ), 200 );
	}
}
