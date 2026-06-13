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
	 * Called on woocommerce_cart_calculate_fees.
	 * Applies earned rewards using per-milestone stacking logic.
	 */
	public function apply_rewards(): void {
		$active = $this->evaluator->get_active_for_cart();
		if ( empty( $active ) ) {
			return;
		}

		foreach ( $active as $entry ) {
			$campaign   = $entry['campaign'];
			$milestones = $entry['milestones']; // each has `earned` boolean
			$stacking   = $campaign['stacking_mode'] ?? 'exclusive';

			$earned = array_filter( $milestones, fn( $m ) => $m['earned'] );
			if ( empty( $earned ) ) {
				continue;
			}

			$to_apply = $this->resolve_rewards( array_values( $earned ), $stacking );

			foreach ( $to_apply as $milestone ) {
				$reward = $this->factory->make( $milestone['reward_type'] );
				$reward->apply( $milestone, [ 'cart_total' => (float) WC()->cart->get_cart_contents_total() ] );

				$this->tracker->track_reward_applied(
					(int) $campaign['id'],
					(int) $milestone['id'],
					(float) WC()->cart->get_cart_contents_total(),
					(float) ( $milestone['reward_value'] ?? 0.0 )
				);
			}
		}
	}

	/**
	 * Resolve which milestones actually apply their rewards.
	 *
	 * Exclusive: within each trigger-type group, only the highest-threshold
	 *            earned milestone applies. Across groups, each contributes one.
	 * Stackable: every earned milestone applies.
	 *
	 * @param  array  $earned    All earned milestones (already filtered).
	 * @param  string $stacking  'exclusive' | 'stackable'
	 * @return array             Milestones whose rewards should be applied.
	 */
	private function resolve_rewards( array $earned, string $stacking ): array {
		if ( 'stackable' === $stacking ) {
			return $earned;
		}

		// Exclusive: group by trigger_type + trigger_target_ids, keep highest.
		$groups = [];
		foreach ( $earned as $ms ) {
			$ids = array_map( 'intval', (array) ( $ms['trigger_target_ids'] ?? [] ) );
			sort( $ids );
			$key = $ms['trigger_type'] . ( $ids ? '_' . implode( '_', $ids ) : '' );
			if ( ! isset( $groups[ $key ] )
				|| (float) $ms['threshold_value'] > (float) $groups[ $key ]['threshold_value'] ) {
				$groups[ $key ] = $ms;
			}
		}

		return array_values( $groups );
	}
}
