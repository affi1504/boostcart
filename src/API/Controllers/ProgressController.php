<?php

declare(strict_types=1);

namespace CartMilestones\API\Controllers;

use CartMilestones\API\Middleware\AuthMiddleware;
use CartMilestones\Campaigns\CampaignEvaluator;
use CartMilestones\Progress\MessageRenderer;
use CartMilestones\Progress\ProgressCalculator;

class ProgressController {

	public function __construct(
		private readonly CampaignEvaluator $evaluator,
		private readonly ProgressCalculator $calculator,
		private readonly MessageRenderer $renderer
	) {}

	public function register_routes( string $namespace ): void {
		register_rest_route( $namespace, '/progress', [
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => [ $this, 'get_progress' ],
			'permission_callback' => [ AuthMiddleware::class, 'public_read' ],
		] );

		register_rest_route( $namespace, '/active', [
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => [ $this, 'get_active' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
		] );
	}

	public function get_progress( \WP_REST_Request $request ): \WP_REST_Response {
		if ( ! WC()->cart ) {
			return new \WP_REST_Response( [], 200 );
		}

		$active     = $this->evaluator->get_active_for_cart();
		$cart_total = (float) WC()->cart->get_cart_contents_total();
		$result     = [];

		foreach ( $active as $entry ) {
			$campaign   = $entry['campaign'];
			$milestones = $entry['milestones'];
			$state      = $this->calculator->calculate( $milestones, $cart_total );

			// Build message.
			$next    = $state['next_milestone'];
			$message = '';
			if ( $next ) {
				$template = $next['message_template'] ?? '';
				$message  = $template
					? $this->renderer->render( $template, $state, $next )
					: $this->renderer->default_message( $state, $next );
			} elseif ( $state['all_earned'] ) {
				$message = $this->renderer->default_message( $state, null );
			}

			$result[] = [
				'campaign_id'       => (int) $campaign['id'],
				'campaign_name'     => $campaign['name'],
				'stacking_mode'     => $campaign['stacking_mode'],
				'progress'          => $state,
				'message'           => $message,
				'all_milestones'    => $milestones,
			];
		}

		return new \WP_REST_Response( $result, 200 );
	}

	public function get_active( \WP_REST_Request $request ): \WP_REST_Response {
		$active = $this->evaluator->get_active_for_cart();
		return new \WP_REST_Response( $active, 200 );
	}
}
