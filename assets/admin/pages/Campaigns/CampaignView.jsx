import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { getCampaign } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';

const STATUS_VARIANTS = {
	active:    'success',
	inactive:  'secondary',
	scheduled: 'warning',
	expired:   'error',
};

const TRIGGER_LABELS = {
	cart_value:      __( 'Cart Value', 'boostcart' ),
	product_qty:     __( 'Product Quantity', 'boostcart' ),
	category_qty:    __( 'Category Quantity', 'boostcart' ),
	category_spend:  __( 'Category Spend', 'boostcart' ),
	product_spend:   __( 'Product Spend', 'boostcart' ),
	lifetime_spend:  __( 'Lifetime Spend', 'boostcart' ),
	lifetime_orders: __( 'Lifetime Orders', 'boostcart' ),
};

const REWARD_LABELS = {
	percentage_discount: __( '% Discount', 'boostcart' ),
	fixed_discount:      __( 'Fixed Discount', 'boostcart' ),
	free_shipping:       __( 'Free Shipping', 'boostcart' ),
	free_product:        __( 'Free Product', 'boostcart' ),
	store_credit:        __( 'Store Credit', 'boostcart' ),
	coupon_unlock:       __( 'Unlock Coupon', 'boostcart' ),
	custom:              __( 'Custom Reward', 'boostcart' ),
};

function rewardSummary( ms ) {
	switch ( ms.reward_type ) {
		case 'percentage_discount': return `${ ms.reward_value }% OFF`;
		case 'fixed_discount':      return `${ ms.reward_value } OFF`;
		case 'free_shipping':       return __( 'Free Shipping', 'boostcart' );
		case 'free_product':        return `${ __( 'Free Product', 'boostcart' ) } #${ ms.reward_meta?.product_id || '?' }`;
		case 'store_credit':        return `${ ms.reward_value } ${ __( 'Store Credit', 'boostcart' ) }`;
		case 'coupon_unlock':       return `${ __( 'Coupon:', 'boostcart' ) } ${ ms.reward_meta?.coupon_code || '?' }`;
		case 'custom':              return __( 'Custom Reward', 'boostcart' );
		default:                    return ms.reward_type;
	}
}

export function CampaignView() {
	const { id }   = useParams();
	const navigate = useNavigate();
	const [ campaign, setCampaign ] = useState( null );
	const [ loading, setLoading ]   = useState( true );
	const [ error, setError ]       = useState( null );

	useEffect( () => {
		getCampaign( id )
			.then( setCampaign )
			.catch( err => setError( err.message ) )
			.finally( () => setLoading( false ) );
	}, [ id ] );

	if ( loading ) return <div style={ { padding: 32, textAlign: 'center' } }><Spinner /></div>;

	if ( error || ! campaign ) {
		return (
			<div>
				<div className="cm-notice cm-notice--error">{ error || __( 'Campaign not found.', 'boostcart' ) }</div>
				<Button variant="secondary" onClick={ () => navigate( '/campaigns' ) }>
					{ __( '← Back', 'boostcart' ) }
				</Button>
			</div>
		);
	}

	const milestones = campaign.milestones || [];

	return (
		<div>
			<div className="cm-page-header">
				<div>
					<h1 className="cm-page-title" style={ { marginBottom: 4 } }>{ campaign.name }</h1>
					<Badge variant={ STATUS_VARIANTS[ campaign.status ] || 'secondary' }>
						{ campaign.status }
					</Badge>
				</div>
				<div style={ { display: 'flex', gap: 8 } }>
					<Button variant="secondary" onClick={ () => navigate( '/campaigns' ) }>
						{ __( '← Back', 'boostcart' ) }
					</Button>
					<Button onClick={ () => navigate( `/campaigns/${ id }` ) }>
						{ __( 'Edit Campaign', 'boostcart' ) }
					</Button>
				</div>
			</div>

			{/* Details */ }
			<Card style={ { marginBottom: 16 } }>
				<h2 className="cm-section-title">{ __( 'Details', 'boostcart' ) }</h2>
				<table className="cm-debug-table">
					<tbody>
						<tr>
							<td>{ __( 'Stacking Mode', 'boostcart' ) }</td>
							<td>{ campaign.stacking_mode === 'exclusive'
								? __( 'Exclusive — best reward per trigger group', 'boostcart' )
								: __( 'Stackable — all earned rewards apply', 'boostcart' )
							}</td>
						</tr>
						<tr>
							<td>{ __( 'Target Scope', 'boostcart' ) }</td>
							<td>{ campaign.target_scope }</td>
						</tr>
						{ campaign.start_date && (
							<tr>
								<td>{ __( 'Start Date', 'boostcart' ) }</td>
								<td>{ campaign.start_date.replace( 'T', ' ' ).slice( 0, 16 ) }</td>
							</tr>
						) }
						{ campaign.end_date && (
							<tr>
								<td>{ __( 'End Date', 'boostcart' ) }</td>
								<td>{ campaign.end_date.replace( 'T', ' ' ).slice( 0, 16 ) }</td>
							</tr>
						) }
						<tr>
							<td>{ __( 'Priority', 'boostcart' ) }</td>
							<td>{ campaign.priority }</td>
						</tr>
					</tbody>
				</table>
			</Card>

			{/* Milestones timeline */ }
			<Card style={ { marginBottom: 16 } }>
				<h2 className="cm-section-title">
					{ __( 'Milestones', 'boostcart' ) }
					<span style={ { fontWeight: 400, fontSize: 13, color: 'var(--cm-mute)', marginLeft: 8 } }>
						{ milestones.length } { milestones.length === 1 ? __( 'milestone', 'boostcart' ) : __( 'milestones', 'boostcart' ) }
					</span>
				</h2>

				{ milestones.length === 0 ? (
					<p style={ { color: 'var(--cm-mute)', fontSize: 13 } }>{ __( 'No milestones configured.', 'boostcart' ) }</p>
				) : (
					<div className="cm-view-milestones">
						{ milestones.map( ( ms, i ) => (
							<div key={ ms.id } className={ `cm-view-milestone${ ms.is_best_value ? ' cm-view-milestone--best-value' : '' }` }>
								<div className="cm-view-milestone__step">{ i + 1 }</div>
								<div className="cm-view-milestone__body">
									<div className="cm-view-milestone__header">
										<span className="cm-view-milestone__label">
											{ ms.label || rewardSummary( ms ) }
											{ ms.is_best_value && <span style={ { marginLeft: 6 } }>⭐</span> }
										</span>
										<span className="cm-view-milestone__reward">{ rewardSummary( ms ) }</span>
									</div>
									<div className="cm-view-milestone__meta">
										<span>{ TRIGGER_LABELS[ ms.trigger_type ] || ms.trigger_type }</span>
										<span>{ ms.comparator } { ms.threshold_value }</span>
										{ ms.trigger_target_ids?.length > 0 && (
											<span>{ __( 'IDs:', 'boostcart' ) } { ms.trigger_target_ids.join( ', ' ) }</span>
										) }
									</div>
									{ ms.message_template && (
										<div className="cm-view-milestone__message">
											<em>{ ms.message_template }</em>
										</div>
									) }
								</div>
							</div>
						) ) }
					</div>
				) }
			</Card>

			{/* Conditions */ }
			{ ( campaign.conditions || [] ).length > 0 && (
				<Card>
					<h2 className="cm-section-title">{ __( 'Extra Conditions', 'boostcart' ) }</h2>
					<pre style={ { fontSize: 12, fontFamily: 'var(--cm-font-mono)', background: 'var(--cm-canvas-soft-2)', padding: 12, borderRadius: 6, overflowX: 'auto' } }>
						{ JSON.stringify( campaign.conditions, null, 2 ) }
					</pre>
				</Card>
			) }
		</div>
	);
}
