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
	{ value: 'cart_value',     label: __( 'Cart Value', 'boostcart' ) },
	{ value: 'product_qty',    label: __( 'Product Quantity', 'boostcart' ) },
	{ value: 'category_qty',   label: __( 'Category Quantity', 'boostcart' ) },
	{ value: 'category_spend', label: __( 'Category Spend', 'boostcart' ) },
	{ value: 'product_spend',  label: __( 'Product Spend', 'boostcart' ) },
	{ value: 'lifetime_spend', label: __( 'Lifetime Spend', 'boostcart' ) },
	{ value: 'lifetime_orders',label: __( 'Lifetime Orders', 'boostcart' ) },
];

const SCOPE_OPTIONS = [
	{ value: 'store',      label: __( 'Entire Store', 'boostcart' ) },
	{ value: 'categories', label: __( 'Specific Categories', 'boostcart' ) },
	{ value: 'products',   label: __( 'Specific Products', 'boostcart' ) },
	{ value: 'roles',      label: __( 'Customer Roles', 'boostcart' ) },
];

const STACKING_OPTIONS = [
	{ value: 'exclusive', label: __( 'Exclusive (highest milestone only)', 'boostcart' ) },
	{ value: 'stackable', label: __( 'Stackable (all earned milestones)', 'boostcart' ) },
];

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
			.then( data => setCampaign( { ...campaign, ...data } ) )
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
			navigate( '/campaigns' );
		} catch ( e ) {
			setErrors( { _global: e.message } );
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

			{ errors._global && <p style={ { color: 'var(--cm-error)', marginBottom: 16 } }>{ errors._global }</p> }

			<div className="cm-editor-grid">
				<Card>
					<h2 className="cm-section-title">{ __( 'Campaign Details', 'boostcart' ) }</h2>
					<Input
						label={ __( 'Campaign Name', 'boostcart' ) }
						required
						value={ campaign.name }
						onChange={ e => set( 'name', e.target.value ) }
						error={ errors.name }
					/>
					<div className="cm-field-row">
						<Select
							label={ __( 'Trigger Type', 'boostcart' ) }
							options={ TRIGGER_OPTIONS }
							value={ campaign.trigger_type }
							onChange={ e => set( 'trigger_type', e.target.value ) }
						/>
						<Select
							label={ __( 'Stacking Mode', 'boostcart' ) }
							options={ STACKING_OPTIONS }
							value={ campaign.stacking_mode }
							onChange={ e => set( 'stacking_mode', e.target.value ) }
						/>
					</div>
					<Select
						label={ __( 'Target Scope', 'boostcart' ) }
						options={ SCOPE_OPTIONS }
						value={ campaign.target_scope }
						onChange={ e => set( 'target_scope', e.target.value ) }
					/>
					<div className="cm-field-row">
						<Input
							label={ __( 'Start Date (optional)', 'boostcart' ) }
							type="datetime-local"
							value={ campaign.start_date || '' }
							onChange={ e => set( 'start_date', e.target.value ) }
						/>
						<Input
							label={ __( 'End Date (optional)', 'boostcart' ) }
							type="datetime-local"
							value={ campaign.end_date || '' }
							onChange={ e => set( 'end_date', e.target.value ) }
						/>
					</div>
				</Card>

				<Card>
					<h2 className="cm-section-title">{ __( 'Milestones & Rewards', 'boostcart' ) }</h2>
					<MilestoneBuilder
						campaignId={ isNew ? null : id }
						milestones={ campaign.milestones }
						onChange={ milestones => set( 'milestones', milestones ) }
					/>
				</Card>

				<Card>
					<h2 className="cm-section-title">{ __( 'Conditions', 'boostcart' ) }</h2>
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
