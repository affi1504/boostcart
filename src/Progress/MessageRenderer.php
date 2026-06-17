<?php

declare(strict_types=1);

namespace CartMilestones\Progress;

class MessageRenderer {

	/**
	 * Resolve template tokens to human-readable text.
	 *
	 * Supported tokens:
	 *   {remaining}     — formatted currency remaining to next milestone
	 *   {label}         — milestone label (e.g. "Free Shipping")
	 *   {threshold}     — formatted threshold value
	 *   {current}       — formatted current cart value
	 *   {percent}       — progress percentage (0–100)
	 *   {qty_remaining} — remaining quantity (for qty-based triggers)
	 */
	public function render( string $template, array $progress_state, ?array $milestone = null ): string {
		$remaining  = $progress_state['remaining'] ?? 0.0;
		$current    = $progress_state['current_value'] ?? 0.0;
		$percent    = $progress_state['percent'] ?? 0.0;
		$label      = $milestone['label'] ?? '';
		$threshold  = $milestone ? (float) $milestone['threshold_value'] : 0.0;

		$replacements = [
			'{remaining}'     => html_entity_decode( wp_strip_all_tags( wc_price( $remaining ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'{label}'         => esc_html( $label ),
			'{threshold}'     => html_entity_decode( wp_strip_all_tags( wc_price( $threshold ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'{current}'       => html_entity_decode( wp_strip_all_tags( wc_price( $current ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'{percent}'       => number_format( $percent, 0 ),
			'{qty_remaining}' => (string) max( 0, (int) ceil( $remaining ) ),
		];

		/**
		 * Filter the token replacements for milestone message rendering.
		 *
		 * @param array      $replacements    Token → replacement string map.
		 * @param array      $progress_state  Progress state array.
		 * @param array|null $milestone       Milestone row or null.
		 */
		$replacements = apply_filters( 'boostcart_message_tokens', $replacements, $progress_state, $milestone );

		return str_replace( array_keys( $replacements ), array_values( $replacements ), $template );
	}

	/**
	 * Build a default message when no template is set on the milestone.
	 */
	public function default_message( array $progress_state, ?array $milestone = null ): string {
		if ( $progress_state['all_earned'] ?? false ) {
			return __( 'You\'ve unlocked all rewards!', 'boostcart' );
		}

		if ( ! $milestone ) {
			return '';
		}

		$label = $milestone['label'] ?? __( 'the next reward', 'boostcart' );

		return sprintf(
			/* translators: 1: formatted currency amount, 2: reward label */
			__( 'Add %1$s more to unlock %2$s', 'boostcart' ),
			wp_strip_all_tags( wc_price( $progress_state['remaining'] ?? 0.0 ) ),
			esc_html( $label )
		);
	}
}
