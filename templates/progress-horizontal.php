<?php
/**
 * Template: Horizontal progress bar / milestone timeline.
 *
 * Available vars:
 *   $campaign_id  int|null  Filter to a specific campaign (null = all active).
 */
if ( ! defined( 'ABSPATH' ) ) exit;
?>
<div class="cm-progress cm-progress--horizontal" data-cm-widget="horizontal" <?php echo $campaign_id ? 'data-campaign-id="' . esc_attr( $campaign_id ) . '"' : ''; ?>>
	<div class="cm-progress__loading" aria-live="polite">
		<span class="cm-progress__spinner"></span>
	</div>
	<div class="cm-progress__content" hidden>
		<div class="cm-progress__message"></div>
		<div class="cm-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
			<div class="cm-progress__fill"></div>
			<div class="cm-progress__milestones"></div>
		</div>
	</div>
</div>
