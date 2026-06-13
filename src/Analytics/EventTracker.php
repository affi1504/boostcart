<?php

declare(strict_types=1);

namespace CartMilestones\Analytics;

class EventTracker {

	public function __construct( private readonly AnalyticsRepository $repository ) {}

	public function track_milestone_reached(
		int $campaign_id,
		int $milestone_id,
		float $cart_value
	): void {
		$this->repository->record( [
			'event_type'   => 'milestone_reached',
			'campaign_id'  => $campaign_id,
			'milestone_id' => $milestone_id,
			'session_id'   => $this->session_id(),
			'user_id'      => get_current_user_id(),
			'cart_value'   => $cart_value,
		] );
	}

	public function track_reward_applied(
		int $campaign_id,
		int $milestone_id,
		float $cart_value,
		float $discount_amount
	): void {
		$this->repository->record( [
			'event_type'      => 'reward_applied',
			'campaign_id'     => $campaign_id,
			'milestone_id'    => $milestone_id,
			'session_id'      => $this->session_id(),
			'user_id'         => get_current_user_id(),
			'cart_value'      => $cart_value,
			'discount_amount' => $discount_amount,
		] );
	}

	public function track_reward_redeemed(
		int $campaign_id,
		int $milestone_id,
		int $order_id,
		float $discount_amount
	): void {
		$this->repository->record( [
			'event_type'      => 'reward_redeemed',
			'campaign_id'     => $campaign_id,
			'milestone_id'    => $milestone_id,
			'order_id'        => $order_id,
			'session_id'      => $this->session_id(),
			'user_id'         => get_current_user_id(),
			'discount_amount' => $discount_amount,
		] );
	}

	private function session_id(): string {
		if ( WC()->session ) {
			return (string) WC()->session->get_customer_id();
		}
		return '';
	}
}
