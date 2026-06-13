<?php

declare(strict_types=1);

namespace CartMilestones\API\Controllers;

use CartMilestones\API\Middleware\AuthMiddleware;
use CartMilestones\Campaigns\CampaignRepository;
use CartMilestones\Campaigns\CampaignService;
use CartMilestones\Campaigns\MilestoneRepository;
use CartMilestones\Conditions\ConditionRepository;

class ImportExportController {

	public function __construct(
		private readonly CampaignRepository $campaigns,
		private readonly CampaignService $service,
		private readonly MilestoneRepository $milestones,
		private readonly ConditionRepository $conditions
	) {}

	public function register_routes( string $namespace ): void {
		register_rest_route( $namespace, '/export', [
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => [ $this, 'export' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
		] );

		register_rest_route( $namespace, '/import', [
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => [ $this, 'import' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			'args'                => [
				'campaigns' => [ 'type' => 'array', 'required' => true ],
			],
		] );

		register_rest_route( $namespace, '/import/validate', [
			'methods'             => \WP_REST_Server::CREATABLE,
			'callback'            => [ $this, 'validate' ],
			'permission_callback' => [ AuthMiddleware::class, 'manage_woocommerce' ],
			'args'                => [
				'campaigns' => [ 'type' => 'array', 'required' => true ],
			],
		] );
	}

	public function export( \WP_REST_Request $request ): \WP_REST_Response {
		$campaigns = $this->campaigns->find_all();
		$payload   = [];

		foreach ( $campaigns as $campaign ) {
			$payload[] = [
				'campaign'   => $campaign,
				'milestones' => $this->milestones->find_by_campaign( (int) $campaign['id'] ),
				'conditions' => $this->conditions->get_tree( (int) $campaign['id'] ),
			];
		}

		return new \WP_REST_Response(
			[
				'version'   => CM_VERSION,
				'exported'  => current_time( 'c' ),
				'campaigns' => $payload,
			],
			200
		);
	}

	public function import( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$errors = $this->validate_payload( $request->get_param( 'campaigns' ) );
		if ( ! empty( $errors ) ) {
			return new \WP_Error( 'cm_import_invalid', implode( ' ', $errors ), [ 'status' => 422 ] );
		}

		$imported = $this->do_import( $request->get_param( 'campaigns' ) );
		return new \WP_REST_Response( [ 'imported' => $imported ], 201 );
	}

	public function validate( \WP_REST_Request $request ): \WP_REST_Response {
		$errors = $this->validate_payload( $request->get_param( 'campaigns' ) );
		return new \WP_REST_Response(
			[
				'valid'  => empty( $errors ),
				'errors' => $errors,
			],
			200
		);
	}

	private function validate_payload( array $campaigns ): array {
		$errors = [];
		foreach ( $campaigns as $i => $entry ) {
			if ( empty( $entry['campaign']['name'] ) ) {
				$errors[] = sprintf( 'Campaign at index %d is missing a name.', $i );
			}
		}
		return $errors;
	}

	private function do_import( array $campaigns ): int {
		$count = 0;
		foreach ( $campaigns as $entry ) {
			$campaign_data             = $entry['campaign'];
			$campaign_data['status']   = 'inactive'; // Import as inactive for safety.
			unset( $campaign_data['id'], $campaign_data['created_at'], $campaign_data['updated_at'] );

			try {
				$new_campaign = $this->service->create( $campaign_data );
				$new_id       = (int) $new_campaign['id'];
			} catch ( \Exception $e ) {
				continue;
			}

			foreach ( $entry['milestones'] ?? [] as $ms ) {
				unset( $ms['id'], $ms['created_at'] );
				$this->milestones->create( $new_id, $ms );
			}

			if ( ! empty( $entry['conditions'] ) ) {
				$this->conditions->save_tree( $new_id, $entry['conditions'] );
			}

			$count++;
		}
		return $count;
	}
}
