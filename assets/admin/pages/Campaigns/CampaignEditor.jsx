import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { getCampaign, createCampaign, updateCampaign } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { MilestoneBuilder } from '../Builder/MilestoneBuilder';
import { ConditionBuilder } from '../Builder/ConditionBuilder';

const TRIGGER_OPTIONS = [
	{ value: 'cart_value',      label: __( 'Cart Value', 'boostcart' ) },
	{ value: 'product_qty',     label: __( 'Product Quantity', 'boostcart' ) },
	{ value: 'category_qty',    label: __( 'Category Quantity', 'boostcart' ) },
	{ value: 'category_spend',  label: __( 'Category Spend', 'boostcart' ) },
	{ value: 'product_spend',   label: __( 'Product Spend', 'boostcart' ) },
	{ value: 'lifetime_spend',  label: __( 'Lifetime Spend', 'boostcart' ) },
	{ value: 'lifetime_orders', label: __( 'Lifetime Orders', 'boostcart' ) },
];

const TRIGGER_HINTS = {
	cart_value:      __( 'Milestones unlock based on the total value of items in the cart right now.', 'boostcart' ),
	product_qty:     __( 'Milestones unlock when the customer adds a certain number of specific products.', 'boostcart' ),
	category_qty:    __( 'Milestones unlock based on the total quantity of items from a specific category.', 'boostcart' ),
	category_spend:  __( 'Milestones unlock based on the total amount spent on items from a specific category.', 'boostcart' ),
	product_spend:   __( 'Milestones unlock based on the total amount spent on specific products.', 'boostcart' ),
	lifetime_spend:  __( 'Milestones unlock based on how much the customer has spent across all previous orders.', 'boostcart' ),
	lifetime_orders: __( 'Milestones unlock based on how many orders the customer has placed in total.', 'boostcart' ),
};

const SCOPE_OPTIONS = [
	{ value: 'store',      label: __( 'Entire Store', 'boostcart' ) },
	{ value: 'categories', label: __( 'Specific Categories', 'boostcart' ) },
	{ value: 'products',   label: __( 'Specific Products', 'boostcart' ) },
	{ value: 'roles',      label: __( 'Customer Roles', 'boostcart' ) },
];

const SCOPE_HINTS = {
	store:      __( 'This campaign applies to every customer on your store.', 'boostcart' ),
	categories: __( 'Only customers who have items from the selected categories in their cart will see this campaign.', 'boostcart' ),
	products:   __( 'Only customers who have the selected products in their cart will see this campaign.', 'boostcart' ),
	roles:      __( 'Only customers with the selected user role (e.g. Wholesale, VIP) will see this campaign.', 'boostcart' ),
};

const STACKING_OPTIONS = [
	{ value: 'exclusive', label: __( 'Exclusive — highest milestone only', 'boostcart' ) },
	{ value: 'stackable', label: __( 'Stackable — all earned milestones', 'boostcart' ) },
];

const STACKING_HINTS = {
	exclusive: __( 'Only the highest milestone the customer has reached will apply its reward. Best for tiered discounts.', 'boostcart' ),
	stackable: __( 'Every milestone the customer reaches applies its own reward. Best for free gifts or free shipping combined with discounts.', 'boostcart' ),
};

export function CampaignEditor() {
	const { id }    = useParams();
	const navigate  = useNavigate();
	const isNew     = id === 'new';

	const [ loading, setLoading ]   = useState( ! isNew );
	const [ saving, setSaving ]     = useState( false );
	const [ errors, setErrors ]     = useState( {} );
	const [ campaign, setCampaign ] = useState( {
		name:          '',
		status:        'inactive',
		trigger_type:  'cart_value',
		stacking_mode: 'exclusive',
		target_scope:  'store',
		target_ids:    [],
		start_date:    '',
		end_date:      '',
		milestones:    [],
		conditions:    [],
	} );

	useEffect( () => {
		if ( isNew ) return;
		getCampaign( id )
			.then( data => setCampaign( prev => ( { ...prev, ...data } ) ) )
			.finally( () => setLoading( false ) );
	}, [ id ] );

	function set( key, value ) {
		setCampaign( c => ( { ...c, [ key ]: value } ) );
	}

	async function handleSave() {
		const errs = {};
		if ( ! campaign.name.trim() ) errs.name = __( 'Name is required.', 'boostcart' );
		if ( Object.keys( errs ).length ) { setErrors( errs ); return; }

		setSaving( true );
		try {
			if ( isNew ) {
				await createCampaign( campaign );
			} else {
				await updateCampaign( id, campaign );
			}
			// Pass success message to campaign list via navigation state.
			navigate( '/campaigns', { state: { successMessage: isNew
				? __( 'Campaign created successfully.', 'boostcart' )
				: __( 'Campaign updated successfully.', 'boostcart' )
			} } );
		} catch ( e ) {
			setErrors( { _global: e.message || __( 'An error occurred. Check the Debug tab in Settings for details.', 'boostcart' ) } );
		} finally {
			setSaving( false );
		}
	}

	if ( loading ) return <div style={ { padding: 32, textAlign: 'center' } }><Spinner /></div>;

	return (
		<div>
			<div className="cm-page-header">
				<h1 className="cm-page-title">
					{ isNew ? __( 'New Campaign', 'boostcart' ) : __( 'Edit Campaign', 'boostcart' ) }
				</h1>
				<div style={ { display: 'flex', gap: 8 } }>
					<Button variant="secondary" onClick={ () => navigate( '/campaigns' ) }>
						{ __( 'Cancel', 'boostcart' ) }
					</Button>
					<Button loading={ saving } onClick={ handleSave }>
						{ __( 'Save Campaign', 'boostcart' ) }
					</Button>
				</div>
			</div>

			{ errors._global && (
				<div className="cm-notice cm-notice--error">{ errors._global }</div>
			) }

			<div className="cm-editor-grid">

				{/* ── Campaign Details ── */}
				<Card>
					<h2 className="cm-section-title">{ __( 'Campaign Details', 'boostcart' ) }</h2>
					<p className="cm-section-hint">
						{ __( 'A campaign groups a set of milestones together. Customers progress through its milestones as they shop.', 'boostcart' ) }
					</p>

					<Input
						label={ __( 'Campaign Name', 'boostcart' ) }
						hint={ __( 'Internal label — customers do not see this.', 'boostcart' ) }
						required
						value={ campaign.name }
						onChange={ e => set( 'name', e.target.value ) }
						error={ errors.name }
					/>

					<div className="cm-field-row" style={ { marginTop: 16 } }>
						<Select
							label={ __( 'Trigger Type', 'boostcart' ) }
							options={ TRIGGER_OPTIONS }
							value={ campaign.trigger_type }
							hint={ TRIGGER_HINTS[ campaign.trigger_type ] }
							onChange={ e => set( 'trigger_type', e.target.value ) }
						/>
						<Select
							label={ __( 'Stacking Mode', 'boostcart' ) }
							options={ STACKING_OPTIONS }
							value={ campaign.stacking_mode }
							hint={ STACKING_HINTS[ campaign.stacking_mode ] }
							onChange={ e => set( 'stacking_mode', e.target.value ) }
						/>
					</div>

					<div style={ { marginTop: 16 } }>
						<Select
							label={ __( 'Target Scope', 'boostcart' ) }
							options={ SCOPE_OPTIONS }
							value={ campaign.target_scope }
							hint={ SCOPE_HINTS[ campaign.target_scope ] }
							onChange={ e => set( 'target_scope', e.target.value ) }
						/>
					</div>

					<div className="cm-field-row" style={ { marginTop: 16 } }>
						<Input
							label={ __( 'Start Date', 'boostcart' ) }
							type="datetime-local"
							hint={ __( 'Leave blank to activate immediately when status is set to Active.', 'boostcart' ) }
							value={ campaign.start_date || '' }
							onChange={ e => set( 'start_date', e.target.value ) }
						/>
						<Input
							label={ __( 'End Date', 'boostcart' ) }
							type="datetime-local"
							hint={ __( 'Leave blank to run indefinitely.', 'boostcart' ) }
							value={ campaign.end_date || '' }
							onChange={ e => set( 'end_date', e.target.value ) }
						/>
					</div>
				</Card>

				{/* ── Milestones ── */}
				<Card>
					<h2 className="cm-section-title">{ __( 'Milestones & Rewards', 'boostcart' ) }</h2>
					<p className="cm-section-hint">
						{ __( 'Each milestone is a threshold the customer must reach to unlock a reward. Add as many as you like — they are sorted by threshold automatically.', 'boostcart' ) }
					</p>
					<MilestoneBuilder
						campaignId={ isNew ? null : id }
						milestones={ campaign.milestones }
						onChange={ milestones => set( 'milestones', milestones ) }
					/>
				</Card>

				{/* ── Conditions ── */}
				<Card>
					<h2 className="cm-section-title">{ __( 'Conditions', 'boostcart' ) }</h2>
					<p className="cm-section-hint">
						{ __( 'Optional extra rules that must pass for this campaign to show. Leave empty to always show. Use AND to require all rules, OR to require any one of them.', 'boostcart' ) }
					</p>
					<ConditionBuilder
						campaignId={ isNew ? null : id }
						tree={ campaign.conditions }
						onChange={ conditions => set( 'conditions', conditions ) }
					/>
				</Card>
			</div>
		</div>
	);
}
