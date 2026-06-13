<?php

declare(strict_types=1);

namespace CartMilestones\Celebrations;

use CartMilestones\Progress\CartHashTracker;

class CelebrationManager {

	public function __construct( private readonly CartHashTracker $hash_tracker ) {}

	/**
	 * Determine which celebrations need to fire for newly-earned milestones.
	 * Returns an array of celebration payloads to be passed to the frontend.
	 *
	 * @param  array $earned_milestones  Milestone rows just earned.
	 * @return array<array{milestone_id: int, type: string, label: string}>
	 */
	public function get_pending_celebrations( array $earned_milestones ): array {
		$settings    = (array) get_option( 'cm_settings', [] );
		$types       = (array) ( $settings['celebration_types'] ?? [ 'confetti', 'toast' ] );
		$cart_hash   = $this->hash_tracker->current_hash();
		$pending     = [];

		foreach ( $earned_milestones as $milestone ) {
			$mid = (int) $milestone['id'];
			if ( $this->hash_tracker->has_celebrated( $mid, $cart_hash ) ) {
				continue;
			}

			$this->hash_tracker->mark_celebrated( $mid, $cart_hash );

			$pending[] = [
				'milestone_id' => $mid,
				'label'        => $milestone['label'] ?? __( 'Reward Unlocked!', 'boostcart' ),
				'types'        => $types,
			];
		}

		return $pending;
	}
}
