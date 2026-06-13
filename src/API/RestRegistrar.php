<?php

declare(strict_types=1);

namespace CartMilestones\API;

use CartMilestones\Analytics\AnalyticsRepository;
use CartMilestones\Analytics\AnalyticsService;
use CartMilestones\API\Controllers\AnalyticsController;
use CartMilestones\API\Controllers\CampaignsController;
use CartMilestones\API\Controllers\ConditionsController;
use CartMilestones\API\Controllers\ImportExportController;
use CartMilestones\API\Controllers\MilestonesController;
use CartMilestones\API\Controllers\ProgressController;
use CartMilestones\API\Controllers\SettingsController;
use CartMilestones\API\Controllers\UpdateController;
use CartMilestones\Campaigns\CampaignEvaluator;
use CartMilestones\Campaigns\CampaignRepository;
use CartMilestones\Campaigns\CampaignService;
use CartMilestones\Campaigns\MilestoneRepository;
use CartMilestones\Campaigns\MilestoneService;
use CartMilestones\Conditions\ConditionEvaluator;
use CartMilestones\Conditions\ConditionRepository;
use CartMilestones\Progress\MessageRenderer;
use CartMilestones\Progress\ProgressCalculator;
use CartMilestones\Update\UpdateManager;

class RestRegistrar {

	private const NAMESPACE = 'boostcart/v1';

	public function register_routes(): void {
		// Repositories.
		$campaign_repo   = new CampaignRepository();
		$milestone_repo  = new MilestoneRepository();
		$condition_repo  = new ConditionRepository();
		$analytics_repo  = new AnalyticsRepository();

		// Services.
		$campaign_service   = new CampaignService( $campaign_repo );
		$milestone_service  = new MilestoneService( $milestone_repo );
		$analytics_service  = new AnalyticsService( $analytics_repo );

		// Evaluators.
		$condition_evaluator = new ConditionEvaluator();
		$campaign_evaluator  = new CampaignEvaluator(
			$campaign_repo,
			$milestone_repo,
			$condition_repo,
			$condition_evaluator
		);

		// Progress.
		$calculator = new ProgressCalculator();
		$renderer   = new MessageRenderer();

		// Controllers.
		( new CampaignsController( $campaign_repo, $campaign_service, $milestone_repo, $condition_repo ) )
			->register_routes( self::NAMESPACE );

		( new MilestonesController( $milestone_repo, $milestone_service ) )
			->register_routes( self::NAMESPACE );

		( new ConditionsController( $condition_repo ) )
			->register_routes( self::NAMESPACE );

		( new ProgressController( $campaign_evaluator, $calculator, $renderer ) )
			->register_routes( self::NAMESPACE );

		( new AnalyticsController( $analytics_service ) )
			->register_routes( self::NAMESPACE );

		( new SettingsController() )
			->register_routes( self::NAMESPACE );

		( new ImportExportController( $campaign_repo, $campaign_service, $milestone_repo, $condition_repo ) )
			->register_routes( self::NAMESPACE );

		( new UpdateController( new UpdateManager() ) )
			->register_routes( self::NAMESPACE );
	}
}
