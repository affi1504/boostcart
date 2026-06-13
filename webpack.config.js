const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		admin: path.resolve( __dirname, 'assets/admin/index.js' ),
		'blocks/boostcart/index': path.resolve(
			__dirname,
			'assets/blocks/boostcart/index.js'
		),
		'frontend/cart-watcher': path.resolve(
			__dirname,
			'assets/frontend/cart-watcher.js'
		),
		'frontend/injector': path.resolve(
			__dirname,
			'assets/frontend/injector.js'
		),
		'frontend/progress': path.resolve(
			__dirname,
			'assets/frontend/progress.js'
		),
		'frontend/floating-widget': path.resolve(
			__dirname,
			'assets/frontend/floating-widget.js'
		),
		'frontend/celebrations': path.resolve(
			__dirname,
			'assets/frontend/celebrations.js'
		),
		'frontend/mini-cart': path.resolve(
			__dirname,
			'assets/frontend/mini-cart.js'
		),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'assets/build' ),
		filename: '[name].js',
	},
	resolve: {
		...defaultConfig.resolve,
		alias: {
			...( defaultConfig.resolve?.alias ?? {} ),
			'@cm/api': path.resolve( __dirname, 'assets/admin/api' ),
			'@cm/components': path.resolve( __dirname, 'assets/admin/components' ),
			'@cm/store': path.resolve( __dirname, 'assets/admin/store' ),
		},
	},
};
