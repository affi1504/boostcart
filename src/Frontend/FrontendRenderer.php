<?php

declare(strict_types=1);

namespace CartMilestones\Frontend;

use CartMilestones\Campaigns\CampaignEvaluator;
use CartMilestones\Campaigns\CampaignRepository;
use CartMilestones\Campaigns\MilestoneRepository;
use CartMilestones\Conditions\ConditionEvaluator;
use CartMilestones\Conditions\ConditionRepository;
use CartMilestones\Core\Logger;
use CartMilestones\Progress\CalculatorProgress;
use CartMilestones\Progress\MessageRenderer;
use CartMilestones\Progress\ProgressCalculator;

/**
 * Computes and pre-renders progress data at PHP render time so the frontend
 * bar appears instantly — no REST round-trip required on page load.
 */
class FrontendRenderer {

	private ?CampaignEvaluator $evaluator = null;
	private ?ProgressCalculator $calculator = null;
	private ?MessageRenderer $renderer = null;

	public function get_progress_data(): array {
		if ( ! WC()->cart ) {
			return [];
		}

		try {
			$evaluator  = $this->get_evaluator();
			$calculator = new ProgressCalculator();
			$renderer   = new MessageRenderer();

			$active = $evaluator->get_active_for_cart();
			$result = [];

			foreach ( $active as $entry ) {
				$campaign   = $entry['campaign'];
				$milestones = $entry['milestones'];
				$state      = $calculator->calculate( $milestones );

				$next    = $state['next_milestone'];
				$message = '';

				if ( $next ) {
					$trigger_type   = $next['trigger_type'] ?? 'cart_value';
					$remaining      = max( 0.0, (float) $next['threshold_value'] - (float) $next['current_value'] );
					$progress_state = [
						'remaining'     => $remaining,
						'current_value' => $next['current_value'],
						'percent'       => $state['groups'][0]['percent'] ?? 0,
						'all_earned'    => false,
					];
					$template = $next['message_template'] ?? '';
					$message  = $template
						? $renderer->render( $template, $progress_state, $next )
						: $renderer->default_message( $progress_state, $next );
				} elseif ( $state['all_earned'] ) {
					$message = $renderer->default_message( [ 'all_earned' => true, 'remaining' => 0 ], null );
				}

				$result[] = [
					'campaign_id'    => (int) $campaign['id'],
					'campaign_name'  => $campaign['name'],
					'stacking_mode'  => $campaign['stacking_mode'],
					'progress'       => $state,
					'message'        => $message,
					'all_milestones' => $milestones,
				];
			}

			return $result;
		} catch ( \Throwable $e ) {
			Logger::error( '[FrontendRenderer] failed to compute progress', [ 'error' => $e->getMessage() ] );
			return [];
		}
	}

	/**
	 * Render a self-contained widget with pre-baked progress data.
	 * JS hydrates from this data immediately — no initial API call needed.
	 */
	public function render_widget( string $type = 'horizontal', ?int $campaign_id = null ): void {
		$data    = $this->get_progress_data();
		$json    = wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP );
		$data_id = $campaign_id ? ' data-campaign-id="' . esc_attr( $campaign_id ) . '"' : '';
		$style   = esc_attr( get_option( 'cm_settings', [] )['progress_style'] ?? 'classic' );
		?>
		<div class="cm-progress cm-progress--<?php echo esc_attr( $type ); ?>"
			 data-cm-widget="<?php echo esc_attr( $type ); ?>"
			 data-style="<?php echo $style; ?>"
			 data-preload="1"
			 <?php echo $data_id; ?>>
			<div class="cm-progress__content" <?php echo empty( $data ) ? 'hidden' : ''; ?>>
				<!-- pre-rendered placeholder, JS fills this in immediately -->
			</div>
			<?php if ( ! empty( $data ) ) : ?>
			<script type="application/json" class="cm-progress-preload-data"><?php echo $json; ?></script>
			<?php endif; ?>
		</div>
		<?php
	}

	public function render_mini_cart_widget(): void {
		$data  = $this->get_progress_data();
		$json  = wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP );
		$style = esc_attr( get_option( 'cm_settings', [] )['progress_style'] ?? 'classic' );
		?>
		<div class="cm-mini-cart-widget"
			 data-cm-widget="mini-cart"
			 data-style="<?php echo $style; ?>"
			 data-preload="1"
			 aria-live="polite">
			<div class="cm-mini-cart-widget__content"></div>
			<?php if ( ! empty( $data ) ) : ?>
			<script type="application/json" class="cm-progress-preload-data"><?php echo $json; ?></script>
			<?php endif; ?>
		</div>
		<?php
	}

	private function get_evaluator(): CampaignEvaluator {
		if ( $this->evaluator ) {
			return $this->evaluator;
		}
		$this->evaluator = new CampaignEvaluator(
			new CampaignRepository(),
			new MilestoneRepository(),
			new ConditionRepository(),
			new ConditionEvaluator()
		);
		return $this->evaluator;
	}
}
