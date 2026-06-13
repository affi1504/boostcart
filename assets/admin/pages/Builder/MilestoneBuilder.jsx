import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const REWARD_TYPES = [
	{ value: 'percentage_discount', label: __( '% Discount', 'boostcart' ) },
	{ value: 'fixed_discount',      label: __( 'Fixed Discount', 'boostcart' ) },
	{ value: 'free_shipping',       label: __( 'Free Shipping', 'boostcart' ) },
	{ value: 'free_product',        label: __( 'Free Product', 'boostcart' ) },
	{ value: 'store_credit',        label: __( 'Store Credit', 'boostcart' ) },
	{ value: 'coupon_unlock',       label: __( 'Unlock Coupon', 'boostcart' ) },
	{ value: 'custom',              label: __( 'Custom Reward', 'boostcart' ) },
];

const REWARD_HINTS = {
	percentage_discount: __( 'Applies a percentage off the cart total. Enter 10 for 10% off.', 'boostcart' ),
	fixed_discount:      __( 'Deducts a fixed amount from the cart total. Enter the amount in your store currency.', 'boostcart' ),
	free_shipping:       __( 'Removes all shipping costs. No value needed.', 'boostcart' ),
	free_product:        __( 'Automatically adds a free product to the cart. Enter the product ID in Reward Meta.', 'boostcart' ),
	store_credit:        __( 'Adds store credit as a cart discount. Enter the credit amount.', 'boostcart' ),
	coupon_unlock:       __( 'Applies an existing coupon code automatically when the milestone is reached.', 'boostcart' ),
	custom:              __( 'Fires a custom action hook (boostcart_custom_reward_apply) for developer use.', 'boostcart' ),
};

const THRESHOLD_HINTS = {
	cart_value:      __( 'Minimum cart subtotal in your store currency (e.g. 500 = ₹500).', 'boostcart' ),
	product_qty:     __( 'Minimum number of qualifying products in the cart.', 'boostcart' ),
	category_qty:    __( 'Minimum number of items from the target category.', 'boostcart' ),
	category_spend:  __( 'Minimum amount spent on items from the target category.', 'boostcart' ),
	product_spend:   __( 'Minimum amount spent on the specific products.', 'boostcart' ),
	lifetime_spend:  __( 'Minimum total the customer has spent across all past orders.', 'boostcart' ),
	lifetime_orders: __( 'Minimum number of completed orders the customer has placed.', 'boostcart' ),
};

function emptyMilestone() {
	return {
		_id:              Date.now(),
		threshold_value:  '',
		reward_type:      'percentage_discount',
		reward_value:     '',
		reward_meta:      {},
		is_best_value:    false,
		label:            '',
		message_template: '',
	};
}

export function MilestoneBuilder( { milestones = [], onChange, triggerType = 'cart_value' } ) {
	const [ items, setItems ] = useState(
		milestones.length
			? milestones.map( m => ( { _id: m.id || Date.now() + Math.random(), ...m } ) )
			: []
	);

	function update( _id, key, value ) {
		const next = items.map( m => m._id === _id ? { ...m, [ key ]: value } : m );
		setItems( next );
		onChange( next );
	}

	function add() {
		const next = [ ...items, emptyMilestone() ];
		setItems( next );
		onChange( next );
	}

	function remove( _id ) {
		const next = items.filter( m => m._id !== _id );
		setItems( next );
		onChange( next );
	}

	function toggleBestValue( _id ) {
		const next = items.map( m => ( { ...m, is_best_value: m._id === _id ? ! m.is_best_value : false } ) );
		setItems( next );
		onChange( next );
	}

	const thresholdHint = THRESHOLD_HINTS[ triggerType ] || __( 'The value the customer must reach to unlock this reward.', 'boostcart' );

	return (
		<div className="cm-milestone-builder">
			{ items.length === 0 && (
				<p className="cm-hint-box">
					{ __( 'No milestones yet. Click "+ Add Milestone" to create your first reward tier. You can add as many as you like — they are sorted by threshold automatically.', 'boostcart' ) }
				</p>
			) }

			{ items.map( ( ms, i ) => (
				<div key={ ms._id } className={ `cm-milestone-row${ ms.is_best_value ? ' cm-milestone-row--best-value' : '' }` }>
					<div className="cm-milestone-row__header">
						<span className="cm-milestone-row__num">{ __( 'Milestone', 'boostcart' ) } { i + 1 }</span>
						<button
							type="button"
							className="cm-milestone-row__best-value-toggle"
							onClick={ () => toggleBestValue( ms._id ) }
							title={ ms.is_best_value
								? __( 'Remove Best Value badge — click to unmark', 'boostcart' )
								: __( 'Mark as Best Value — highlights this tier with a ⭐ to guide customers', 'boostcart' )
							}
							aria-pressed={ ms.is_best_value }
						>
							{ ms.is_best_value ? '★ Best Value' : '☆ Mark as Best Value' }
						</button>
						<button
							type="button"
							className="cm-milestone-row__remove"
							onClick={ () => remove( ms._id ) }
							aria-label={ __( 'Remove this milestone', 'boostcart' ) }
						>
							✕ { __( 'Remove', 'boostcart' ) }
						</button>
					</div>

					<div className="cm-field-row">
						<Input
							label={ __( 'Threshold', 'boostcart' ) }
							type="number"
							min="0"
							step="0.01"
							value={ ms.threshold_value }
							onChange={ e => update( ms._id, 'threshold_value', e.target.value ) }
							hint={ thresholdHint }
						/>
						<Select
							label={ __( 'Reward Type', 'boostcart' ) }
							options={ REWARD_TYPES }
							value={ ms.reward_type }
							hint={ REWARD_HINTS[ ms.reward_type ] }
							onChange={ e => update( ms._id, 'reward_type', e.target.value ) }
						/>
						{ ms.reward_type !== 'free_shipping' && ms.reward_type !== 'custom' && ms.reward_type !== 'free_product' && (
							<Input
								label={ __( 'Reward Value', 'boostcart' ) }
								type="number"
								min="0"
								step="0.01"
								value={ ms.reward_value }
								hint={
									ms.reward_type === 'percentage_discount'
										? __( 'Enter a number between 1–100. Example: 10 gives 10% off.', 'boostcart' )
										: __( 'Enter the discount amount in your store currency.', 'boostcart' )
								}
								onChange={ e => update( ms._id, 'reward_value', e.target.value ) }
							/>
						) }
						{ ms.reward_type === 'free_product' && (
							<Input
								label={ __( 'Product ID', 'boostcart' ) }
								type="number"
								min="1"
								value={ ms.reward_meta?.product_id || '' }
								hint={ __( 'Find the product ID in WooCommerce → Products, hover over the product name and check the URL.', 'boostcart' ) }
								onChange={ e => update( ms._id, 'reward_meta', { ...ms.reward_meta, product_id: parseInt( e.target.value ) || '' } ) }
							/>
						) }
						{ ms.reward_type === 'coupon_unlock' && (
							<Input
								label={ __( 'Coupon Code', 'boostcart' ) }
								value={ ms.reward_meta?.coupon_code || '' }
								hint={ __( 'Must be an existing coupon in WooCommerce → Coupons. It will be applied automatically.', 'boostcart' ) }
								onChange={ e => update( ms._id, 'reward_meta', { ...ms.reward_meta, coupon_code: e.target.value } ) }
							/>
						) }
					</div>

					<div className="cm-field-row" style={ { marginTop: 8 } }>
						<Input
							label={ __( 'Label', 'boostcart' ) }
							placeholder={ __( 'e.g. Free Shipping', 'boostcart' ) }
							hint={ __( 'Short name for this reward shown in the progress widget.', 'boostcart' ) }
							value={ ms.label }
							onChange={ e => update( ms._id, 'label', e.target.value ) }
						/>
						<Input
							label={ __( 'Progress Message', 'boostcart' ) }
							placeholder={ __( 'Only {remaining} more for {label}', 'boostcart' ) }
							hint={ __( 'Use {remaining} for amount left, {label} for reward name, {percent} for % complete.', 'boostcart' ) }
							value={ ms.message_template }
							onChange={ e => update( ms._id, 'message_template', e.target.value ) }
						/>
					</div>
				</div>
			) ) }

			<Button variant="secondary" size="sm" onClick={ add } style={ { marginTop: items.length ? 12 : 0 } }>
				{ __( '+ Add Milestone', 'boostcart' ) }
			</Button>
		</div>
	);
}
