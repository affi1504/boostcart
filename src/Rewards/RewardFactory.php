<?php

declare(strict_types=1);

namespace CartMilestones\Rewards;

use CartMilestones\Rewards\Contracts\RewardInterface;
use CartMilestones\Rewards\Types\CouponUnlockReward;
use CartMilestones\Rewards\Types\CustomReward;
use CartMilestones\Rewards\Types\FixedDiscountReward;
use CartMilestones\Rewards\Types\FreeProductReward;
use CartMilestones\Rewards\Types\FreeShippingReward;
use CartMilestones\Rewards\Types\PercentageDiscountReward;
use CartMilestones\Rewards\Types\StoreCreditReward;

class RewardFactory {

	/** @var array<string, RewardInterface> */
	private array $instances = [];

	public function make( string $reward_type ): RewardInterface {
		if ( isset( $this->instances[ $reward_type ] ) ) {
			return $this->instances[ $reward_type ];
		}

		$this->instances[ $reward_type ] = match ( $reward_type ) {
			'percentage_discount' => new PercentageDiscountReward(),
			'fixed_discount'      => new FixedDiscountReward(),
			'free_shipping'       => new FreeShippingReward(),
			'free_product'        => new FreeProductReward(),
			'store_credit'        => new StoreCreditReward(),
			'coupon_unlock'       => new CouponUnlockReward(),
			'custom'              => new CustomReward(),
			default               => throw new \InvalidArgumentException( "Unknown reward type: {$reward_type}" ),
		};

		return $this->instances[ $reward_type ];
	}
}
