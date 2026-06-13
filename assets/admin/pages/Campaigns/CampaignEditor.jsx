import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { getCampaign, createCampaign, updateCampaign } from '../../api/client';
import apiFetch from '@wordpress/api-fetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { EntityPicker } from '../../components/ui/EntityPicker';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { MilestoneBuilder } from '../Builder/MilestoneBuilder';
import { ConditionBuilder } from '../Builder/ConditionBuilder';

const SCOPE_OPTIONS = [
	{ value: 'store',      label: __( 'All Customers', 'boostcart' ) },
	{ value: 'categories', label: __( 'Customers with items from specific categories', 'boostcart' ) },
	{ value: 'products',   label: __( 'Customers with specific products in cart', 'boostcart' ) },
	{ value: 'roles',      label: __( 'Customers with specific user roles', 'boostcart' ) },
];

const STACKING_OPTIONS = [
	{ value: 'exclusive', label: __( 'Exclusive — best reward per trigger group', 'boostcart' ) },
	{ value: 'stackable', label: __( 'Stackable — all earned rewards apply', 'boostcart' ) },
];

const STATUS_OPTIONS = [
	{ value: 'inactive',  label: __( 'Inactive (draft)', 'boostcart' ) },
	{ value: 'active',    label: __( 'Active', 'boostcart' ) },
	{ value: 'scheduled', label: __( 'Scheduled (use dates below)', 'boostcart' ) },
];

const WP_ROLES = [
	{ value: 'customer',      label: __( 'Customer', 'boostcart' ) },
	{ value: 'subscriber',    label: __( 'Subscriber', 'boostcart' ) },
	{ value: 'wholesale_customer', label: __( 'Wholesale Customer', 'boostcart' ) },
];

export function CampaignEditor() {
	const { id }   = useParams();
	const navigate = useNavigate();
	const isNew    = id === 'new';

	const [ loading, setLoading ] = useState( ! isNew );
	const [ saving, setSaving ]   = useState( false );
	const [ errors, setErrors ]   = useState( {} );

	const [ campaign, setCampaign ] = useState( {
		name:          '',
		status:        'inactive',
		stacking_mode: 'exclusive',
		target_scope:  'store',
		target_ids:    [],
		start_date:    '',
		end_date:      '',
		priority:      10,
		milestones:    [],
		conditions:    [],
	} );

	useEffect( () => {
		if ( isNew ) return;
		getCampaign( id )
			.then( data => {
				setCampaign( prev => ( {
					...prev,
					...data,
					milestones: data.milestones || [],
					conditions: data.conditions || [],
					target_ids: data.target_ids || [],
				} ) );
			} )
			.catch( err => setErrors( { _global: err.message } ) )
			.finally( () => setLoading( false ) );
	}, [ id ] );

	function set( key, value ) {
		setCampaign( c => ( { ...c, [ key ]: value } ) );
	}

	async function handleSave() {
		const errs = {};
		if ( ! campaign.name.trim() ) {
			errs.name = __( 'Campaign name is required.', 'boostcart' );
		}
		if ( ! campaign.milestones || campaign.milestones.length === 0 ) {
			errs.milestones = __( 'At least one milestone is required.', 'boostcart' );
		} else {
			// Validate each milestone.
			const milestoneErrors = campaign.milestones.map( ( ms, i ) => {
				const e = {};
				if ( ! ms.threshold_value || parseFloat( ms.threshold_value ) <= 0 ) {
					e.threshold = __( 'Threshold must be greater than 0.', 'boostcart' );
				}
				if ( ( ms.trigger_type === 'product_qty' || ms.trigger_type === 'product_spend' )
					&& ( ! ms.trigger_target_ids || ms.trigger_target_ids.length === 0 ) ) {
					e.trigger_targets = __( 'Select at least one product.', 'boostcart' );
				}
				if ( ( ms.trigger_type === 'category_qty' || ms.trigger_type === 'category_spend' )
					&& ( ! ms.trigger_target_ids || ms.trigger_target_ids.length === 0 ) ) {
					e.trigger_targets = __( 'Select at least one category.', 'boostcart' );
				}
				if ( ( ms.reward_type === 'percentage_discount' || ms.reward_type === 'fixed_discount' )
					&& ( ! ms.reward_value || parseFloat( ms.reward_value ) <= 0 ) ) {
					e.reward_value = __( 'Reward value must be greater than 0.', 'boostcart' );
				}
				if ( ms.reward_type === 'percentage_discount' && parseFloat( ms.reward_value ) > 100 ) {
					e.reward_value = __( 'Percentage cannot exceed 100.', 'boostcart' );
				}
				if ( ms.reward_type === 'free_product' && ! ms.reward_meta?.product_id ) {
					e.product_id = __( 'Select a product to give for free.', 'boostcart' );
				}
				if ( ms.reward_type === 'coupon_unlock' && ! ms.reward_meta?.coupon_code?.trim() ) {
					e.coupon_code = __( 'Enter a coupon code.', 'boostcart' );
				}
				return Object.keys( e ).length ? { index: i, ...e } : null;
			} ).filter( Boolean );

			if ( milestoneErrors.length ) {
				const labels = milestoneErrors.map( e => `Milestone ${ e.index + 1 }: ${ Object.values( e ).filter( ( v, k ) => k !== 'index' && typeof v === 'string' ).join( ', ' ) }` );
				errs.milestones = labels.join( ' · ' );
			}
		}

		if ( Object.keys( errs ).length ) {
			setErrors( errs );
			// Scroll to top to show error.
			window.scrollTo( { top: 0, behavior: 'smooth' } );
			return;
		}

		setSaving( true );
		setErrors( {} );

		try {
			let savedCampaign;
			if ( isNew ) {
				savedCampaign = await createCampaign( {
					name:          campaign.name,
					status:        campaign.status,
					stacking_mode: campaign.stacking_mode,
					target_scope:  campaign.target_scope,
					target_ids:    campaign.target_ids,
					start_date:    campaign.start_date || null,
					end_date:      campaign.end_date || null,
					priority:      campaign.priority,
				} );
			} else {
				savedCampaign = await updateCampaign( id, {
					name:          campaign.name,
					status:        campaign.status,
					stacking_mode: campaign.stacking_mode,
					target_scope:  campaign.target_scope,
					target_ids:    campaign.target_ids,
					start_date:    campaign.start_date || null,
					end_date:      campaign.end_date || null,
					priority:      campaign.priority,
				} );
			}

			const campaignId = savedCampaign.id;

			// Save milestones via batch endpoint.
			await apiFetch( {
				path:   `/boostcart/v1/campaigns/${ campaignId }/milestones/batch`,
				method: 'POST',
				data:   { milestones: campaign.milestones },
			} );

			// Save conditions.
			await apiFetch( {
				path:   `/boostcart/v1/campaigns/${ campaignId }/conditions`,
				method: 'PUT',
				data:   { tree: campaign.conditions },
			} );

			navigate( '/campaigns', {
				state: {
					successMessage: isNew
						? __( 'Campaign created successfully.', 'boostcart' )
						: __( 'Campaign updated successfully.', 'boostcart' ),
				},
			} );
		} catch ( e ) {
			setErrors( { _global: e.message || __( 'Save failed. Check the Debug tab in Settings for details.', 'boostcart' ) } );
			window.scrollTo( { top: 0, behavior: 'smooth' } );
		} finally {
			setSaving( false );
		}
	}

	if ( loading ) {
		return <div style={ { padding: 32, textAlign: 'center' } }><Spinner /></div>;
	}

	const showDateFields = campaign.status === 'scheduled';

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
				<div className="cm-notice cm-notice--error" style={ { marginBottom: 16 } }>
					{ errors._global }
				</div>
			) }

			<div className="cm-editor-grid">

				{/* ── 1. Basics ── */}
				<Card>
					<h2 className="cm-section-title">{ __( '1. Basics', 'boostcart' ) }</h2>

					<Input
						label={ __( 'Campaign Name', 'boostcart' ) }
						hint={ __( 'Internal label — not shown to customers.', 'boostcart' ) }
						required
						value={ campaign.name }
						onChange={ e => set( 'name', e.target.value ) }
						error={ errors.name }
					/>

					<div className="cm-field-row" style={ { marginTop: 16 } }>
						<Select
							label={ __( 'Status', 'boostcart' ) }
							options={ STATUS_OPTIONS }
							value={ campaign.status }
							hint={
								campaign.status === 'active'
									? __( 'Campaign is live and visible to customers.', 'boostcart' )
									: campaign.status === 'scheduled'
									? __( 'Campaign will activate automatically on the start date.', 'boostcart' )
									: __( 'Campaign is saved but not shown to customers.', 'boostcart' )
							}
							onChange={ e => {
								const newStatus = e.target.value;
								// Clear dates when switching away from scheduled.
								if ( newStatus !== 'scheduled' ) {
									setCampaign( c => ( { ...c, status: newStatus, start_date: '', end_date: '' } ) );
								} else {
									set( 'status', newStatus );
								}
							} }
						/>
						<Select
							label={ __( 'Stacking Mode', 'boostcart' ) }
							options={ STACKING_OPTIONS }
							value={ campaign.stacking_mode }
							hint={
								campaign.stacking_mode === 'exclusive'
									? __( 'Within each trigger group (e.g. all category_qty milestones), only the highest earned milestone applies. Across different trigger types, one reward per group.', 'boostcart' )
									: __( 'All earned milestones apply simultaneously.', 'boostcart' )
							}
							onChange={ e => set( 'stacking_mode', e.target.value ) }
						/>
					</div>

					{ campaign.status === 'scheduled' && (
						<div className="cm-field-row" style={ { marginTop: 16 } }>
							<DateTimePicker
								label={ __( 'Start Date', 'boostcart' ) }
								hint={ __( 'Campaign becomes active at this time. Leave blank to activate immediately on the scheduled date.', 'boostcart' ) }
								value={ campaign.start_date || '' }
								onChange={ v => set( 'start_date', v ) }
							/>
							<DateTimePicker
								label={ __( 'End Date', 'boostcart' ) }
								hint={ __( 'Campaign expires at this time. Leave blank to run indefinitely.', 'boostcart' ) }
								value={ campaign.end_date || '' }
								onChange={ v => set( 'end_date', v ) }
							/>
						</div>
					) }

				</Card>

				{/* ── 2. Who sees this ── */}
				<Card>
					<h2 className="cm-section-title">{ __( '2. Who Sees This', 'boostcart' ) }</h2>
					<p className="cm-section-hint">
						{ __( 'Controls which customers see the progress widget. Does not affect what gets measured — that is set per milestone.', 'boostcart' ) }
					</p>

					<Select
						label={ __( 'Show campaign to', 'boostcart' ) }
						options={ SCOPE_OPTIONS }
						value={ campaign.target_scope }
						onChange={ e => { set( 'target_scope', e.target.value ); set( 'target_ids', [] ); } }
					/>

					{ campaign.target_scope === 'categories' && (
						<div className="cm-field" style={ { marginTop: 12 } }>
							<label className="cm-field__label">{ __( 'Categories', 'boostcart' ) }</label>
							<p className="cm-field__hint">{ __( 'Only shown when cart contains items from these categories.', 'boostcart' ) }</p>
							<EntityPicker
								endpoint="categories"
								value={ campaign.target_ids }
								onChange={ ids => set( 'target_ids', ids ) }
							/>
						</div>
					) }

					{ campaign.target_scope === 'products' && (
						<div className="cm-field" style={ { marginTop: 12 } }>
							<label className="cm-field__label">{ __( 'Products', 'boostcart' ) }</label>
							<p className="cm-field__hint">{ __( 'Only shown when cart contains these specific products.', 'boostcart' ) }</p>
							<EntityPicker
								endpoint="products"
								value={ campaign.target_ids }
								onChange={ ids => set( 'target_ids', ids ) }
							/>
						</div>
					) }

					{ campaign.target_scope === 'roles' && (
						<div className="cm-field" style={ { marginTop: 12 } }>
							<label className="cm-field__label">{ __( 'User Roles', 'boostcart' ) }</label>
							<p className="cm-field__hint">{ __( 'Only shown to customers with one of these roles.', 'boostcart' ) }</p>
							<div style={ { display: 'flex', flexDirection: 'column', gap: 6 } }>
								{ WP_ROLES.map( role => (
									<label key={ role.value } className="cm-checkbox-row">
										<input
											type="checkbox"
											checked={ ( campaign.target_ids || [] ).includes( role.value ) }
											onChange={ e => {
												const ids = ( campaign.target_ids || [] ).slice();
												if ( e.target.checked ) {
													ids.push( role.value );
												} else {
													const i = ids.indexOf( role.value );
													if ( i >= 0 ) ids.splice( i, 1 );
												}
												set( 'target_ids', ids );
											} }
										/>
										{ role.label }
									</label>
								) ) }
							</div>
						</div>
					) }
				</Card>

				{/* ── 3. Milestones ── */}
				<Card>
					<h2 className="cm-section-title">{ __( '3. Milestones & Rewards', 'boostcart' ) }</h2>
					<p className="cm-section-hint">
						{ __( 'Each milestone has its own trigger. Mix cart value, category quantity, lifetime spend — all in one campaign, one progress bar.', 'boostcart' ) }
					</p>
					{ errors.milestones && (
						<div className="cm-notice cm-notice--error" style={ { marginBottom: 12 } }>
							{ errors.milestones }
						</div>
					) }
					<MilestoneBuilder
						milestones={ campaign.milestones }
						onChange={ milestones => set( 'milestones', milestones ) }
					/>
				</Card>

				{/* ── 4. Advanced Conditions ── */}
				<Card>
					<h2 className="cm-section-title">{ __( '4. Extra Conditions', 'boostcart' ) }</h2>
					<p className="cm-section-hint">
						{ __( 'Optional additional rules that must pass before this campaign is shown. Leave empty to show to all eligible customers.', 'boostcart' ) }
					</p>
					<ConditionBuilder
						tree={ campaign.conditions }
						onChange={ conditions => set( 'conditions', conditions ) }
					/>
				</Card>

			</div>
		</div>
	);
}
