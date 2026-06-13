<?php

declare(strict_types=1);

namespace CartMilestones\API\Controllers;

use CartMilestones\API\Middleware\AuthMiddleware;
use CartMilestones\Analytics\AnalyticsService;

class AnalyticsController {

	public function __construct( private readonly AnalyticsService $service ) {}

	public function register_routes( string $namespace ): void {
		register_rest_route( $namespace, '/analytics/summary', [
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => [ $this, 'summary' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			'args'                => [
				'date_from'   => [ 'type' => 'string', 'format' => 'date-time' ],
				'date_to'     => [ 'type' => 'string', 'format' => 'date-time' ],
				'campaign_id' => [ 'type' => 'integer' ],
			],
		] );

		register_rest_route( $namespace, '/analytics/campaigns/(?P<id>[\d]+)', [
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => [ $this, 'campaign_breakdown' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			'args'                => [
				'date_from' => [ 'type' => 'string', 'format' => 'date-time' ],
				'date_to'   => [ 'type' => 'string', 'format' => 'date-time' ],
			],
		] );

		register_rest_route( $namespace, '/analytics/milestones', [
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => [ $this, 'milestone_rates' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
		] );

		register_rest_route( $namespace, '/analytics/events', [
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => [ $this, 'events' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			'args'                => [
				'per_page' => [ 'type' => 'integer', 'default' => 50, 'minimum' => 1, 'maximum' => 200 ],
				'page'     => [ 'type' => 'integer', 'default' => 1, 'minimum' => 1 ],
			],
		] );
	}

	public function summary( \WP_REST_Request $request ): \WP_REST_Response {
		$args = array_filter( [
			'date_from'   => $request->get_param( 'date_from' ),
			'date_to'     => $request->get_param( 'date_to' ),
			'campaign_id' => $request->get_param( 'campaign_id' ),
		] );
		return new \WP_REST_Response( $this->service->get_dashboard_summary( $args ), 200 );
	}

	public function campaign_breakdown( \WP_REST_Request $request ): \WP_REST_Response {
		$args = array_filter( [
			'date_from'   => $request->get_param( 'date_from' ),
			'date_to'     => $request->get_param( 'date_to' ),
			'campaign_id' => (int) $request->get_param( 'id' ),
		] );
		return new \WP_REST_Response( $this->service->get_dashboard_summary( $args ), 200 );
	}

	public function milestone_rates( \WP_REST_Request $request ): \WP_REST_Response {
		return new \WP_REST_Response( $this->service->get_milestone_reach_rates(), 200 );
	}

	public function events( \WP_REST_Request $request ): \WP_REST_Response {
		$args = [
			'per_page' => $request->get_param( 'per_page' ),
			'page'     => $request->get_param( 'page' ),
		];
		return new \WP_REST_Response( $this->service->get_events( $args ), 200 );
	}
}
