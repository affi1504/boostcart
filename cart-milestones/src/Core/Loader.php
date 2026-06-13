<?php

declare(strict_types=1);

namespace CartMilestones\Core;

/**
 * Queues WordPress hook registrations to be added in bulk.
 */
class Loader {

	/** @var array<array{hook: string, callback: callable, priority: int, args: int}> */
	private array $actions = [];

	/** @var array<array{hook: string, callback: callable, priority: int, args: int}> */
	private array $filters = [];

	public function add_action(
		string $hook,
		callable $callback,
		int $priority = 10,
		int $accepted_args = 1
	): void {
		$this->actions[] = compact( 'hook', 'callback', 'priority' ) + [ 'args' => $accepted_args ];
	}

	public function add_filter(
		string $hook,
		callable $callback,
		int $priority = 10,
		int $accepted_args = 1
	): void {
		$this->filters[] = compact( 'hook', 'callback', 'priority' ) + [ 'args' => $accepted_args ];
	}

	public function run(): void {
		foreach ( $this->filters as $f ) {
			add_filter( $f['hook'], $f['callback'], $f['priority'], $f['args'] );
		}
		foreach ( $this->actions as $a ) {
			add_action( $a['hook'], $a['callback'], $a['priority'], $a['args'] );
		}
	}
}
