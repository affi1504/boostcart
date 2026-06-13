<?php

declare(strict_types=1);

namespace CartMilestones\Core;

use CartMilestones\Core\Traits\Singleton;
use CartMilestones\Update\UpdateManager;
use CartMilestones\Admin\AdminMenu;
use CartMilestones\Frontend\FrontendLoader;
use CartMilestones\API\RestRegistrar;
use CartMilestones\Blocks\BlockRegistrar;

class Plugin {

	use Singleton;

	private Loader $loader;
	private Container $container;

	private function __construct() {
		$this->loader    = new Loader();
		$this->container = new Container();
		$this->register_services();
	}

	private function register_services(): void {
		$this->container->singleton( I18n::class, fn() => new I18n() );
		$this->container->singleton( Assets::class, fn() => new Assets() );
		$this->container->singleton( UpdateManager::class, fn() => new UpdateManager() );
		$this->container->singleton( AdminMenu::class, fn( $c ) => new AdminMenu( $c->make( Assets::class ) ) );
		$this->container->singleton( FrontendLoader::class, fn( $c ) => new FrontendLoader( $c->make( Assets::class ) ) );
		$this->container->singleton( RestRegistrar::class, fn() => new RestRegistrar() );
		$this->container->singleton( BlockRegistrar::class, fn() => new BlockRegistrar() );
	}

	public function run(): void {
		// Boot logger early so all subsequent code can use it.
		Logger::boot();
		$this->define_i18n_hooks();
		$this->define_update_hooks();
		$this->define_admin_hooks();
		$this->define_frontend_hooks();
		$this->define_api_hooks();
		$this->define_block_hooks();
		$this->loader->run();
	}

	private function define_i18n_hooks(): void {
		$i18n = $this->container->make( I18n::class );
		$this->loader->add_action( 'plugins_loaded', [ $i18n, 'load_plugin_textdomain' ] );
	}

	private function define_update_hooks(): void {
		$update = $this->container->make( UpdateManager::class );
		$update->register( $this->loader );
	}

	private function define_admin_hooks(): void {
		if ( ! is_admin() ) {
			return;
		}
		$admin  = $this->container->make( AdminMenu::class );
		$assets = $this->container->make( Assets::class );
		$this->loader->add_action( 'admin_menu', [ $admin, 'register_menu' ] );
		$this->loader->add_action( 'admin_enqueue_scripts', [ $assets, 'enqueue_admin_scripts' ] );

		// "Check for Updates" link on the Plugins page.
		$this->loader->add_filter(
			'plugin_action_links_' . CM_PLUGIN_BASENAME,
			[ $admin, 'add_action_links' ]
		);
		$this->loader->add_action( 'admin_post_boostcart_check_for_updates', [ $admin, 'handle_check_for_updates' ] );
		$this->loader->add_action( 'admin_notices', [ $admin, 'show_update_check_notice' ] );
	}

	private function define_frontend_hooks(): void {
		$frontend = $this->container->make( FrontendLoader::class );
		$frontend->register( $this->loader );
	}

	private function define_api_hooks(): void {
		$rest = $this->container->make( RestRegistrar::class );
		$this->loader->add_action( 'rest_api_init', [ $rest, 'register_routes' ] );
	}

	private function define_block_hooks(): void {
		$blocks = $this->container->make( BlockRegistrar::class );
		$this->loader->add_action( 'init', [ $blocks, 'register' ] );
	}

	public function get_container(): Container {
		return $this->container;
	}
}
