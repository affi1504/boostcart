<?php

declare(strict_types=1);

namespace CartMilestones\Blocks;

class BlockRegistrar {

	public function register(): void {
		$block_dir = CM_PLUGIN_DIR . 'assets/blocks/boostcart';

		if ( ! file_exists( $block_dir . '/block.json' ) ) {
			return;
		}

		register_block_type(
			$block_dir . '/block.json',
			[
				'render_callback' => [ $this, 'render' ],
			]
		);
	}

	public function render( array $attributes, string $content ): string {
		$template = CM_PLUGIN_DIR . 'src/Blocks/CartMilestonesBlock/render.php';
		if ( ! file_exists( $template ) ) {
			return '';
		}
		ob_start();
		include $template;
		return ob_get_clean();
	}
}
