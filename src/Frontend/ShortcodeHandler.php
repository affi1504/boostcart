<?php

declare(strict_types=1);

namespace CartMilestones\Frontend;

class ShortcodeHandler {

	public function register(): void {
		add_shortcode( 'boostcart', [ $this, 'render' ] );
	}

	public function render( array $atts ): string {
		$atts = shortcode_atts(
			[
				'style'       => 'horizontal', // horizontal | vertical
				'campaign_id' => '',
			],
			$atts,
			'boostcart'
		);

		$style = in_array( $atts['style'], [ 'horizontal', 'vertical' ], true )
			? $atts['style']
			: 'horizontal';

		$template = CM_PLUGIN_DIR . "templates/progress-{$style}.php";
		if ( ! file_exists( $template ) ) {
			return '';
		}

		ob_start();
		$campaign_id = $atts['campaign_id'] ? (int) $atts['campaign_id'] : null; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
		include $template;
		return ob_get_clean();
	}
}
