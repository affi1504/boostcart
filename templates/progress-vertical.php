<?php
/**
 * Template: Vertical milestone list.
 */
if ( ! defined( 'ABSPATH' ) ) exit;
?>
<div class="cm-progress cm-progress--vertical" data-cm-widget="vertical" <?php echo isset( $campaign_id ) && $campaign_id ? 'data-campaign-id="' . esc_attr( $campaign_id ) . '"' : ''; ?>>
	<div class="cm-progress__loading" aria-live="polite">
		<span class="cm-progress__spinner"></span>
	</div>
	<div class="cm-progress__content" hidden>
		<div class="cm-progress__message"></div>
		<ul class="cm-progress__list" role="list"></ul>
	</div>
</div>
