<?php

declare(strict_types=1);

namespace CartMilestones\Core;

/**
 * Minimal PSR-11-style dependency injection container.
 */
class Container {

	/** @var array<string, callable> */
	private array $bindings = [];

	/** @var array<string, object> */
	private array $singletons = [];

	public function bind( string $abstract, callable $factory ): void {
		$this->bindings[ $abstract ] = $factory;
	}

	public function singleton( string $abstract, callable $factory ): void {
		$this->bindings[ $abstract ] = function () use ( $abstract, $factory ) {
			if ( ! isset( $this->singletons[ $abstract ] ) ) {
				$this->singletons[ $abstract ] = $factory( $this );
			}
			return $this->singletons[ $abstract ];
		};
	}

	public function make( string $abstract ): mixed {
		if ( isset( $this->bindings[ $abstract ] ) ) {
			return ( $this->bindings[ $abstract ] )( $this );
		}
		if ( class_exists( $abstract ) ) {
			return new $abstract();
		}
		throw new \RuntimeException( "No binding found for [{$abstract}]." );
	}

	public function has( string $abstract ): bool {
		return isset( $this->bindings[ $abstract ] ) || class_exists( $abstract );
	}
}
