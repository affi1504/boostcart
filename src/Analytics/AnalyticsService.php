<?php

declare(strict_types=1);

namespace CartMilestones\Analytics;

class AnalyticsService {

	public function __construct( private readonly AnalyticsRepository $repository ) {}

	public function get_dashboard_summary( array $args = [] ): array {
		$raw = $this->repository->get_summary( $args );

		$milestones_reached = (int) ( $raw['milestones_reached'] ?? 0 );
		$rewards_applied    = (int) ( $raw['rewards_applied'] ?? 0 );
		$rewards_redeemed   = (int) ( $raw['rewards_redeemed'] ?? 0 );
		$influenced_orders  = (int) ( $raw['influenced_orders'] ?? 0 );
		$total_discount     = (float) ( $raw['total_discount'] ?? 0.0 );
		$avg_cart_value     = (float) ( $raw['avg_cart_value'] ?? 0.0 );

		$reach_rate      = $rewards_applied > 0
			? round( ( $rewards_redeemed / $rewards_applied ) * 100, 1 )
			: 0.0;

		$avg_discount = $rewards_applied > 0
			? round( $total_discount / $rewards_applied, 2 )
			: 0.0;

		return [
			'milestones_reached'  => $milestones_reached,
			'rewards_applied'     => $rewards_applied,
			'rewards_redeemed'    => $rewards_redeemed,
			'influenced_orders'   => $influenced_orders,
			'total_discount'      => $total_discount,
			'avg_cart_value'      => $avg_cart_value,
			'redemption_rate_pct' => $reach_rate,
			'avg_discount'        => $avg_discount,
		];
	}

	public function get_milestone_reach_rates( ?int $campaign_id = null ): array {
		return $this->repository->get_milestone_reach_rates( $campaign_id );
	}

	public function get_events( array $args = [] ): array {
		return $this->repository->get_events( $args );
	}
}
