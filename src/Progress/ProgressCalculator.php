<?php

declare(strict_types=1);

namespace CartMilestones\Progress;

class ProgressCalculator {

	/**
	 * Calculate progress for a campaign whose milestones have already been
	 * evaluated by CampaignEvaluator (each row has `earned` + `current_value`).
	 */
	public function calculate( array $milestones ): array {
		if ( empty( $milestones ) ) {
			return $this->empty_state();
		}

		$earned     = array_values( array_filter( $milestones, fn( $m ) => $m['earned'] ) );
		$not_earned = array_values( array_filter( $milestones, fn( $m ) => ! $m['earned'] ) );
		$all_earned = empty( $not_earned );

		// Next milestone = unearned one with smallest remaining gap.
		$next = null;
		if ( ! $all_earned ) {
			usort( $not_earned, function ( $a, $b ) {
				$ra = (float) $a['threshold_value'] - (float) $a['current_value'];
				$rb = (float) $b['threshold_value'] - (float) $b['current_value'];
				return $ra <=> $rb;
			} );
			$next = $not_earned[0];
		}

		return [
			'earned_milestones' => $earned,
			'all_milestones'    => $milestones,
			'all_earned'        => $all_earned,
			'next_milestone'    => $next,
			'groups'            => $this->build_groups( $milestones ),
		];
	}

	/**
	 * Group milestones by trigger type for per-axis progress percentages.
	 * A "cart_value" bar and a "category_qty" bar are separate visual segments.
	 */
	private function build_groups( array $milestones ): array {
		$by_key = [];
		foreach ( $milestones as $ms ) {
			$ids = array_map( 'intval', (array) ( $ms['trigger_target_ids'] ?? [] ) );
			sort( $ids );
			$key = $ms['trigger_type'] . ( $ids ? '_' . implode( '_', $ids ) : '' );
			$by_key[ $key ][] = $ms;
		}

		$groups = [];
		foreach ( $by_key as $group_milestones ) {
			usort( $group_milestones, fn( $a, $b ) => $a['threshold_value'] <=> $b['threshold_value'] );

			$current = (float) ( $group_milestones[0]['current_value'] ?? 0.0 );
			$max     = (float) end( $group_milestones )['threshold_value'];
			$percent = $max > 0 ? min( 100.0, round( ( $current / $max ) * 100, 2 ) ) : 0.0;

			$next_in_group = null;
			foreach ( $group_milestones as $ms ) {
				if ( ! $ms['earned'] ) {
					$next_in_group = $ms;
					break;
				}
			}

			$groups[] = [
				'trigger_type'       => $group_milestones[0]['trigger_type'],
				'trigger_target_ids' => $group_milestones[0]['trigger_target_ids'] ?? [],
				'current_value'      => $current,
				'percent'            => $percent,
				'milestones'         => $group_milestones,
				'next_milestone'     => $next_in_group,
				'remaining'          => $next_in_group
					? max( 0.0, (float) $next_in_group['threshold_value'] - $current )
					: 0.0,
			];
		}

		return $groups;
	}

	private function empty_state(): array {
		return [
			'earned_milestones' => [],
			'all_milestones'    => [],
			'all_earned'        => false,
			'next_milestone'    => null,
			'groups'            => [],
		];
	}
}
