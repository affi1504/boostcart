<?php

declare(strict_types=1);

namespace CartMilestones\Core;

class I18n {

	public function load_plugin_textdomain(): void {
		load_plugin_textdomain(
			'boostcart',
			false,
			dirname( CM_PLUGIN_BASENAME ) . '/languages'
		);
	}
}
