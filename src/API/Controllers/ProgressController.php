<?php

declare(strict_types=1);

namespace CartMilestones\API\Controllers;

use CartMilestones\API\Middleware\AuthMiddleware;
use CartMilestones\Campaigns\CampaignEvaluator;
use CartMilestones\Core\Logger;
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
		// Force-load the WC cart session — it's not initialised for REST requests.
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
			Logger::info( '[progress] WC cart not available after load attempt' );
			return new \WP_REST_Response( [], 200 );
		}

		$cart_total = (float) WC()->cart->get_cart_contents_total();
		$cart_items = [];
		foreach ( WC()->cart->get_cart() as $item ) {
			$cart_items[] = [
				'product_id' => $item['product_id'],
				'qty'        => $item['quantity'],
				'line_total' => $item['line_total'] ?? 0,
			];
		}

		Logger::info( '[progress] cart state', [
			'cart_total'       => $cart_total,
			'cart_item_count'  => count( $cart_items ),
			'cart_items'       => $cart_items,
			'session_id'       => WC()->session ? WC()->session->get_customer_id() : 'none',
			'cart_loaded_hook' => did_action( 'woocommerce_cart_loaded_from_session' ),
		] );

		$active = $this->evaluator->get_active_for_cart();

		Logger::info( '[progress] evaluator returned', [
			'active_campaigns' => count( $active ),
			'campaign_ids'     => array_map( fn( $e ) => $e['campaign']['id'], $active ),
		] );

		$result = [];

		foreach ( $active as $entry ) {
			$campaign   = $entry['campaign'];
			$milestones = $entry['milestones'];
			$state      = $this->calculator->calculate( $milestones );

			// Log per-milestone evaluation.
			Logger::info( '[progress] milestones for campaign ' . $campaign['id'], array_map( function ( $ms ) {
				return [
					'id'            => $ms['id'],
					'label'         => $ms['label'],
					'trigger_type'  => $ms['trigger_type'],
					'threshold'     => $ms['threshold_value'],
					'current_value' => $ms['current_value'],
					'earned'        => $ms['earned'],
				];
			}, $milestones ) );

			$next    = $state['next_milestone'];
			$message = '';

			if ( $next ) {
				$template  = $next['message_template'] ?? '';
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

				Logger::info( '[progress] message built', [
					'campaign_id'    => $campaign['id'],
					'next_milestone' => $next['label'],
					'remaining'      => $remaining,
					'template'       => $template ?: '(default)',
					'message'        => $message,
				] );
			} elseif ( $state['all_earned'] ) {
				$message = $this->renderer->default_message( [ 'all_earned' => true, 'remaining' => 0 ], null );
				Logger::info( '[progress] all milestones earned for campaign ' . $campaign['id'] );
			}

			$result[] = [
				'campaign_id'    => (int) $campaign['id'],
				'campaign_name'  => $campaign['name'],
				'stacking_mode'  => $campaign['stacking_mode'],
				'progress'       => $state,
				'message'        => $message,
				'all_milestones' => $milestones,
			];
		}

		Logger::info( '[progress] response', [ 'count' => count( $result ) ] );

		return new \WP_REST_Response( $result, 200 );
	}

	public function get_active( \WP_REST_Request $request ): \WP_REST_Response {
		$active = $this->evaluator->get_active_for_cart();
		return new \WP_REST_Response( $active, 200 );
	}
}
