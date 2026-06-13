<?php

declare(strict_types=1);

namespace CartMilestones\Rewards;

use CartMilestones\Analytics\EventTracker;
use CartMilestones\Campaigns\CampaignEvaluator;
use CartMilestones\Progress\CartHashTracker;

class RewardApplicator {

	public function __construct(
		private readonly CampaignEvaluator $evaluator,
		private readonly RewardFactory $factory,
		private readonly EventTracker $tracker,
		private readonly CartHashTracker $hash_tracker
	) {}

	/**
	 * Called on woocommerce_cart_calculate_fees. Applies all earned rewards.
	 */
	public function apply_rewards(): void {
		$active = $this->evaluator->get_active_for_cart();
		if ( empty( $active ) ) {
			return;
		}

		$cart_total = (float) WC()->cart->get_cart_contents_total();

		foreach ( $active as $entry ) {
			$campaign  = $entry['campaign'];
			$milestones = $entry['milestones'];

			// Sort milestones ascending by threshold.
			usort( $milestones, static fn( $a, $b ) => $a['threshold_value'] <=> $b['threshold_value'] );

			$earned   = [];
			$stacking = $campaign['stacking_mode'] ?? 'exclusive';

			foreach ( $milestones as $milestone ) {
				if ( $cart_total >= (float) $milestone['threshold_value'] ) {
					$earned[] = $milestone;
				}
			}

			if ( empty( $earned ) ) {
				continue;
			}

			// For exclusive mode, only apply the highest earned milestone.
			$to_apply = ( 'exclusive' === $stacking ) ? [ end( $earned ) ] : $earned;

			foreach ( $to_apply as $milestone ) {
				$reward_type = $milestone['reward_type'];
				$reward      = $this->factory->make( $reward_type );
				$context     = [ 'cart_total' => $cart_total ];

				$reward->apply( $milestone, $context );

				$this->tracker->track_reward_applied(
					(int) $campaign['id'],
					(int) $milestone['id'],
					$cart_total,
					(float) ( $milestone['reward_value'] ?? 0.0 )
				);
			}
		}
	}
}
