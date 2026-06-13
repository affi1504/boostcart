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
		// WooCommerce does not initialize the cart session for REST requests.
		// Force-load it so the evaluator can read cart contents and totals.
		if ( ! WC()->cart || ! did_action( 'woocommerce_cart_loaded_from_session' ) ) {
			if ( function_exists( 'wc_load_cart' ) ) {
				wc_load_cart();
			} elseif ( WC()->session ) {
				WC()->session->init();
				WC()->cart->init();
				WC()->customer = new \WC_Customer( get_current_user_id(), true );
			}
		}

		if ( ! WC()->cart ) {
			return new \WP_REST_Response( [], 200 );
		}

		$active = $this->evaluator->get_active_for_cart();
		$result = [];

		foreach ( $active as $entry ) {
			$campaign   = $entry['campaign'];
			$milestones = $entry['milestones']; // already have `earned` + `current_value`
			$state      = $this->calculator->calculate( $milestones );

			// Build the primary progress message — target the next milestone.
			$next    = $state['next_milestone'];
			$message = '';

			if ( $next ) {
				$template = $next['message_template'] ?? '';
				$remaining = max( 0.0, (float) $next['threshold_value'] - (float) $next['current_value'] );
				$progress_state = [
					'remaining'     => $remaining,
					'current_value' => $next['current_value'],
					'percent'       => $state['groups'][0]['percent'] ?? 0,
					'all_earned'    => false,
				];
				$message = $template
					? $this->renderer->render( $template, $progress_state, $next )
					: $this->renderer->default_message( $progress_state, $next );
			} elseif ( $state['all_earned'] ) {
				$message = $this->renderer->default_message( [ 'all_earned' => true, 'remaining' => 0 ], null );
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
