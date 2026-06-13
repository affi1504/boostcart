<?php

declare(strict_types=1);

namespace CartMilestones\Tests\Unit\Progress;

use CartMilestones\Progress\ProgressCalculator;
use PHPUnit\Framework\TestCase;

class ProgressCalculatorTest extends TestCase {

	private ProgressCalculator $calculator;

	protected function setUp(): void {
		$this->calculator = new ProgressCalculator();
	}

	public function test_empty_milestones_returns_zero_state(): void {
		$state = $this->calculator->calculate( [], 50.0 );
		$this->assertNull( $state['next_milestone'] );
		$this->assertNull( $state['prev_milestone'] );
		$this->assertEmpty( $state['earned_milestones'] );
		$this->assertSame( 0.0, $state['remaining'] );
	}

	public function test_no_milestones_earned_below_threshold(): void {
		$milestones = [
			[ 'id' => 1, 'threshold_value' => 100.0, 'label' => 'Tier 1', 'is_best_value' => false ],
		];
		$state = $this->calculator->calculate( $milestones, 40.0 );
		$this->assertEmpty( $state['earned_milestones'] );
		$this->assertSame( 1, (int) $state['next_milestone']['id'] );
		$this->assertEqualsWithDelta( 60.0, $state['remaining'], 0.01 );
	}

	public function test_milestone_earned_at_exact_threshold(): void {
		$milestones = [
			[ 'id' => 1, 'threshold_value' => 100.0, 'label' => 'Free Ship', 'is_best_value' => false ],
		];
		$state = $this->calculator->calculate( $milestones, 100.0 );
		$this->assertCount( 1, $state['earned_milestones'] );
		$this->assertTrue( $state['all_earned'] );
		$this->assertSame( 0.0, $state['remaining'] );
		$this->assertSame( 100.0, $state['percent'] );
	}

	public function test_progress_percent_between_milestones(): void {
		$milestones = [
			[ 'id' => 1, 'threshold_value' => 100.0, 'label' => 'T1', 'is_best_value' => false ],
			[ 'id' => 2, 'threshold_value' => 200.0, 'label' => 'T2', 'is_best_value' => false ],
		];
		$state = $this->calculator->calculate( $milestones, 150.0 );
		// Between 100 and 200: 50/100 = 50%.
		$this->assertEqualsWithDelta( 50.0, $state['percent'], 0.01 );
		$this->assertCount( 1, $state['earned_milestones'] );
		$this->assertSame( 2, (int) $state['next_milestone']['id'] );
	}

	public function test_all_earned_flag_when_above_all_thresholds(): void {
		$milestones = [
			[ 'id' => 1, 'threshold_value' => 50.0,  'label' => 'T1', 'is_best_value' => false ],
			[ 'id' => 2, 'threshold_value' => 100.0, 'label' => 'T2', 'is_best_value' => false ],
		];
		$state = $this->calculator->calculate( $milestones, 200.0 );
		$this->assertTrue( $state['all_earned'] );
		$this->assertCount( 2, $state['earned_milestones'] );
	}
}
