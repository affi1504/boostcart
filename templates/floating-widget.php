<?php
/**
 * Template: Floating widget — bottom-right on desktop, sticky bar on mobile.
 */
if ( ! defined( 'ABSPATH' ) ) exit;
?>
<div
	id="cm-floating-widget"
	class="cm-floating-widget"
	data-cm-widget="floating"
	aria-live="polite"
	hidden
>
	<button
		class="cm-floating-widget__toggle"
		aria-expanded="false"
		aria-controls="cm-floating-widget__panel"
		aria-label="<?php esc_attr_e( 'View cart rewards', 'boostcart' ); ?>"
	>
		<span class="cm-floating-widget__icon" aria-hidden="true">🎁</span>
		<span class="cm-floating-widget__label"></span>
	</button>
	<div id="cm-floating-widget__panel" class="cm-floating-widget__panel" hidden>
		<div class="cm-floating-widget__content"></div>
	</div>
</div>
