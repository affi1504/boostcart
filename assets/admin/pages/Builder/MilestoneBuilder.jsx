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

function emptyMilestone() {
	return {
		_id:             Date.now(),
		threshold_value: '',
		reward_type:     'percentage_discount',
		reward_value:    '',
		reward_meta:     {},
		is_best_value:   false,
		label:           '',
		message_template:'',
	};
}

export function MilestoneBuilder( { milestones = [], onChange } ) {
	const [ items, setItems ] = useState(
		milestones.length ? milestones.map( m => ( { _id: m.id || Date.now() + Math.random(), ...m } ) ) : []
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

	return (
		<div className="cm-milestone-builder">
			{ items.map( ( ms, i ) => (
				<div key={ ms._id } className={ `cm-milestone-row${ ms.is_best_value ? ' cm-milestone-row--best-value' : '' }` }>
					<div className="cm-milestone-row__header">
						<span className="cm-milestone-row__num">{ i + 1 }</span>
						{ ms.is_best_value && <span className="cm-milestone-row__star" title="Best Value">⭐</span> }
						<button
							type="button"
							className="cm-milestone-row__best-value-toggle"
							onClick={ () => toggleBestValue( ms._id ) }
							title={ ms.is_best_value ? __( 'Remove Best Value', 'boostcart' ) : __( 'Mark as Best Value', 'boostcart' ) }
							aria-pressed={ ms.is_best_value }
						>
							{ ms.is_best_value ? '★' : '☆' }
						</button>
						<button
							type="button"
							className="cm-milestone-row__remove"
							onClick={ () => remove( ms._id ) }
							aria-label={ __( 'Remove milestone', 'boostcart' ) }
						>
							✕
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
							hint={ __( 'Cart value or qty needed', 'boostcart' ) }
						/>
						<Select
							label={ __( 'Reward Type', 'boostcart' ) }
							options={ REWARD_TYPES }
							value={ ms.reward_type }
							onChange={ e => update( ms._id, 'reward_type', e.target.value ) }
						/>
						{ ms.reward_type !== 'free_shipping' && ms.reward_type !== 'custom' && (
							<Input
								label={ __( 'Reward Value', 'boostcart' ) }
								type="number"
								min="0"
								step="0.01"
								value={ ms.reward_value }
								onChange={ e => update( ms._id, 'reward_value', e.target.value ) }
							/>
						) }
						{ ms.reward_type === 'coupon_unlock' && (
							<Input
								label={ __( 'Coupon Code', 'boostcart' ) }
								value={ ms.reward_meta?.coupon_code || '' }
								onChange={ e => update( ms._id, 'reward_meta', { ...ms.reward_meta, coupon_code: e.target.value } ) }
							/>
						) }
					</div>
					<div className="cm-field-row">
						<Input
							label={ __( 'Label', 'boostcart' ) }
							placeholder={ __( 'e.g. Free Shipping', 'boostcart' ) }
							value={ ms.label }
							onChange={ e => update( ms._id, 'label', e.target.value ) }
						/>
						<Input
							label={ __( 'Message Template', 'boostcart' ) }
							placeholder={ __( 'Only {remaining} more for {label}', 'boostcart' ) }
							value={ ms.message_template }
							onChange={ e => update( ms._id, 'message_template', e.target.value ) }
						/>
					</div>
				</div>
			) ) }

			<Button variant="secondary" size="sm" onClick={ add }>
				{ __( '+ Add Milestone', 'boostcart' ) }
			</Button>
		</div>
	);
}
