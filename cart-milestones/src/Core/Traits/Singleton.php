<?php

declare(strict_types=1);

namespace CartMilestones\Core\Traits;

trait Singleton {

	private static ?self $instance = null;

	public static function get_instance(): static {
		if ( null === static::$instance ) {
			static::$instance = new static();
		}
		return static::$instance;
	}

	private function __construct() {}

	private function __clone() {}
}
