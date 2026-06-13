import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EntityPicker } from '../../components/ui/EntityPicker';

const TRIGGER_OPTIONS = [
	{ value: 'cart_value',      label: __( 'Cart Value', 'boostcart' ) },
	{ value: 'product_qty',     label: __( 'Product Quantity', 'boostcart' ) },
	{ value: 'category_qty',    label: __( 'Category Quantity', 'boostcart' ) },
	{ value: 'category_spend',  label: __( 'Category Spend', 'boostcart' ) },
	{ value: 'product_spend',   label: __( 'Product Spend', 'boostcart' ) },
	{ value: 'lifetime_spend',  label: __( 'Lifetime Spend', 'boostcart' ) },
	{ value: 'lifetime_orders', label: __( 'Lifetime Orders', 'boostcart' ) },
];

const REWARD_OPTIONS = [
	{ value: 'percentage_discount', label: __( '% Discount', 'boostcart' ) },
	{ value: 'fixed_discount',      label: __( 'Fixed Discount', 'boostcart' ) },
	{ value: 'free_shipping',       label: __( 'Free Shipping', 'boostcart' ) },
	{ value: 'free_product',        label: __( 'Free Product', 'boostcart' ) },
	{ value: 'store_credit',        label: __( 'Store Credit', 'boostcart' ) },
	{ value: 'coupon_unlock',       label: __( 'Unlock Coupon', 'boostcart' ) },
	{ value: 'custom',              label: __( 'Custom Reward', 'boostcart' ) },
];

// Which trigger types need a product picker vs category picker
const NEEDS_PRODUCT_PICKER   = [ 'product_qty', 'product_spend' ];
const NEEDS_CATEGORY_PICKER  = [ 'category_qty', 'category_spend' ];
const CURRENCY_TRIGGERS      = [ 'cart_value', 'category_spend', 'product_spend', 'lifetime_spend' ];
const COUNT_TRIGGERS         = [ 'product_qty', 'category_qty', 'lifetime_orders' ];

function thresholdConfig( triggerType ) {
	if ( CURRENCY_TRIGGERS.includes( triggerType ) ) {
		return {
			label: __( 'Minimum Amount', 'boostcart' ),
			hint:  __( 'Enter amount in your store currency (e.g. 500).', 'boostcart' ),
			step:  '0.01',
		};
	}
	if ( triggerType === 'lifetime_orders' ) {
		return {
			label: __( 'Minimum Orders', 'boostcart' ),
			hint:  __( 'Number of completed orders the customer must have placed.', 'boostcart' ),
			step:  '1',
		};
	}
	// product_qty, category_qty
	return {
		label: __( 'Minimum Items', 'boostcart' ),
		hint:  __( 'Number of qualifying items that must be in the cart.', 'boostcart' ),
		step:  '1',
	};
}

function triggerHint( triggerType ) {
	const hints = {
		cart_value:      __( 'Milestone unlocks when the cart subtotal reaches this amount.', 'boostcart' ),
		product_qty:     __( 'Counts items from the selected products in the cart.', 'boostcart' ),
		category_qty:    __( 'Counts items from the selected categories in the cart.', 'boostcart' ),
		category_spend:  __( 'Total cart spend on items from the selected categories.', 'boostcart' ),
		product_spend:   __( 'Total cart spend on the selected products.', 'boostcart' ),
		lifetime_spend:  __( 'Total amount the customer has spent across all past orders. Logged-in only.', 'boostcart' ),
		lifetime_orders: __( 'Total number of orders the customer has placed. Logged-in only.', 'boostcart' ),
	};
	return hints[ triggerType ] || '';
}

function rewardHint( rewardType ) {
	const hints = {
		percentage_discount: __( 'Enter a number 1–100. e.g. 10 = 10% off the cart total.', 'boostcart' ),
		fixed_discount:      __( 'Enter the discount amount in your store currency.', 'boostcart' ),
		free_shipping:       __( 'No value needed. Overrides shipping to show free options only.', 'boostcart' ),
		free_product:        __( 'Enter the WC Product ID below. The product is added at ₹0.', 'boostcart' ),
		store_credit:        __( 'Adds a session-based credit as a negative cart fee.', 'boostcart' ),
		coupon_unlock:       __( 'Enter the coupon code below. It must exist in WooCommerce → Coupons.', 'boostcart' ),
		custom:              __( 'Fires the boostcart_custom_reward_apply action hook for developer use.', 'boostcart' ),
	};
	return hints[ rewardType ] || '';
}

function emptyMilestone( sortOrder = 0 ) {
	return {
		_id:               Date.now() + Math.random(),
		trigger_type:      'cart_value',
		trigger_target_ids: [],
		comparator:        '>=',
		threshold_value:   '',
		reward_type:       'percentage_discount',
		reward_value:      '',
		reward_meta:       {},
		is_best_value:     false,
		label:             '',
		message_template:  '',
		sort_order:        sortOrder,
	};
}

export function MilestoneBuilder( { milestones = [], onChange } ) {
	const [ items, setItems ] = useState( [] );

	// Sync from prop — handles both initial load and edit-screen data arriving after API call.
	useEffect( () => {
		if ( milestones && milestones.length ) {
			setItems(
				milestones.map( ( m, i ) => ( {
					_id: m.id ? m.id + '_loaded' : Date.now() + i,
					...m,
					trigger_target_ids: Array.isArray( m.trigger_target_ids ) ? m.trigger_target_ids : [],
					reward_meta:        m.reward_meta && typeof m.reward_meta === 'object' ? m.reward_meta : {},
				} ) )
			);
		}
	}, [ milestones.length ] ); // re-run when milestones array goes from empty → populated

	function push( updated ) {
		setItems( updated );
		onChange( updated );
	}

	function update( _id, key, value ) {
		push( items.map( m => m._id === _id ? { ...m, [ key ]: value } : m ) );
	}

	function add() {
		push( [ ...items, emptyMilestone( items.length ) ] );
	}

	function remove( _id ) {
		push( items.filter( m => m._id !== _id ) );
	}

	function toggleBestValue( _id ) {
		push( items.map( m => ( { ...m, is_best_value: m._id === _id ? ! m.is_best_value : false } ) ) );
	}

	return (
		<div className="cm-milestone-builder">
			{ items.length === 0 && (
				<div className="cm-hint-box">
					{ __( 'No milestones yet. Each milestone has its own trigger — you can mix cart value, category quantity, and lifetime triggers in a single campaign.', 'boostcart' ) }
				</div>
			) }

			{ items.map( ( ms, i ) => {
				const tConfig   = thresholdConfig( ms.trigger_type );
				const needsProd = NEEDS_PRODUCT_PICKER.includes( ms.trigger_type );
				const needsCat  = NEEDS_CATEGORY_PICKER.includes( ms.trigger_type );

				return (
					<div
						key={ ms._id }
						className={ `cm-milestone-row${ ms.is_best_value ? ' cm-milestone-row--best-value' : '' }` }
					>
						{/* Header row */}
						<div className="cm-milestone-row__header">
							<span className="cm-milestone-row__num">
								{ __( 'Milestone', 'boostcart' ) } { i + 1 }
							</span>
							<button
								type="button"
								className="cm-milestone-row__best-value-toggle"
								onClick={ () => toggleBestValue( ms._id ) }
								aria-pressed={ ms.is_best_value }
								title={ ms.is_best_value
									? __( 'Remove Best Value badge', 'boostcart' )
									: __( 'Mark as Best Value — adds a ⭐ to highlight this tier', 'boostcart' )
								}
							>
								{ ms.is_best_value ? '★ Best Value' : '☆ Best Value' }
							</button>
							<button
								type="button"
								className="cm-milestone-row__remove"
								onClick={ () => remove( ms._id ) }
							>
								✕ { __( 'Remove', 'boostcart' ) }
							</button>
						</div>

						{/* Trigger row */}
						<div className="cm-field-row">
							<Select
								label={ __( 'Trigger', 'boostcart' ) }
								options={ TRIGGER_OPTIONS }
								value={ ms.trigger_type }
								hint={ triggerHint( ms.trigger_type ) }
								onChange={ e => update( ms._id, 'trigger_type', e.target.value ) }
							/>
							<Input
								label={ tConfig.label }
								type="number"
								min="0"
								step={ tConfig.step }
								value={ ms.threshold_value }
								hint={ tConfig.hint }
								onChange={ e => update( ms._id, 'threshold_value', e.target.value ) }
							/>
						</div>

						{/* Product picker — only for product_qty and product_spend */}
						{ needsProd && (
							<div className="cm-field" style={ { marginTop: 8 } }>
								<label className="cm-field__label">
									{ __( 'Target Products', 'boostcart' ) }
									<span className="cm-field__required" aria-hidden="true"> *</span>
								</label>
								<p className="cm-field__hint">{ __( 'Only items from these products count toward the threshold.', 'boostcart' ) }</p>
								<EntityPicker
									endpoint="products"
									value={ ms.trigger_target_ids }
									onChange={ ids => update( ms._id, 'trigger_target_ids', ids ) }
								/>
							</div>
						) }

						{/* Category picker — only for category_qty and category_spend */}
						{ needsCat && (
							<div className="cm-field" style={ { marginTop: 8 } }>
								<label className="cm-field__label">
									{ __( 'Target Categories', 'boostcart' ) }
									<span className="cm-field__required" aria-hidden="true"> *</span>
								</label>
								<p className="cm-field__hint">{ __( 'Only items from these categories count toward the threshold.', 'boostcart' ) }</p>
								<EntityPicker
									endpoint="categories"
									value={ ms.trigger_target_ids }
									onChange={ ids => update( ms._id, 'trigger_target_ids', ids ) }
								/>
							</div>
						) }

						{/* Reward row */}
						<div className="cm-field-row" style={ { marginTop: 8 } }>
							<Select
								label={ __( 'Reward', 'boostcart' ) }
								options={ REWARD_OPTIONS }
								value={ ms.reward_type }
								hint={ rewardHint( ms.reward_type ) }
								onChange={ e => update( ms._id, 'reward_type', e.target.value ) }
							/>
							{ ms.reward_type !== 'free_shipping' && ms.reward_type !== 'custom' && ms.reward_type !== 'free_product' && ms.reward_type !== 'coupon_unlock' && (
								<Input
									label={ ms.reward_type === 'percentage_discount' ? __( 'Discount %', 'boostcart' ) : __( 'Amount', 'boostcart' ) }
									type="number"
									min="0"
									step="0.01"
									value={ ms.reward_value }
									onChange={ e => update( ms._id, 'reward_value', e.target.value ) }
								/>
							) }
							{ ms.reward_type === 'free_product' && (
								<Input
									label={ __( 'Product ID', 'boostcart' ) }
									type="number"
									min="1"
									value={ ms.reward_meta?.product_id || '' }
									hint={ __( 'Hover the product in WooCommerce → Products to find its ID in the URL.', 'boostcart' ) }
									onChange={ e => update( ms._id, 'reward_meta', { ...ms.reward_meta, product_id: parseInt( e.target.value ) || '' } ) }
								/>
							) }
							{ ms.reward_type === 'coupon_unlock' && (
								<Input
									label={ __( 'Coupon Code', 'boostcart' ) }
									value={ ms.reward_meta?.coupon_code || '' }
									hint={ __( 'Must be an existing, active coupon in WooCommerce → Coupons.', 'boostcart' ) }
									onChange={ e => update( ms._id, 'reward_meta', { ...ms.reward_meta, coupon_code: e.target.value } ) }
								/>
							) }
						</div>

						{/* Label + Message */}
						<div className="cm-field-row" style={ { marginTop: 8 } }>
							<Input
								label={ __( 'Label', 'boostcart' ) }
								placeholder={ __( 'e.g. Free Shipping', 'boostcart' ) }
								hint={ __( 'Short name shown in the progress widget.', 'boostcart' ) }
								value={ ms.label }
								onChange={ e => update( ms._id, 'label', e.target.value ) }
							/>
							<Input
								label={ __( 'Progress Message', 'boostcart' ) }
								placeholder={ __( 'Add {remaining} more for {label}', 'boostcart' ) }
								hint={ __( '{remaining} = amount left · {label} = reward name · {percent} = % complete', 'boostcart' ) }
								value={ ms.message_template }
								onChange={ e => update( ms._id, 'message_template', e.target.value ) }
							/>
						</div>
					</div>
				);
			} ) }

			<Button variant="secondary" size="sm" onClick={ add } style={ { marginTop: items.length ? 12 : 0 } }>
				{ __( '+ Add Milestone', 'boostcart' ) }
			</Button>
		</div>
	);
}
