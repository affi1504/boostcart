<?php

declare(strict_types=1);

/** @var array $attributes Block attributes. */
$style = in_array( $attributes['style'] ?? 'horizontal', [ 'horizontal', 'vertical' ], true )
	? $attributes['style']
	: 'horizontal';

$template = CM_PLUGIN_DIR . "templates/progress-{$style}.php";
if ( file_exists( $template ) ) {
	include $template;
}
