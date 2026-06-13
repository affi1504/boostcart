import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../store';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';

function MetricCard( { title, value, subtitle } ) {
	return (
		<Card className="cm-metric-card">
			<p className="cm-metric-card__title">{ title }</p>
			<p className="cm-metric-card__value">{ value }</p>
			{ subtitle && <p className="cm-metric-card__subtitle">{ subtitle }</p> }
		</Card>
	);
}

export function AnalyticsDashboard() {
	const { fetchAnalytics } = useDispatch( STORE_NAME );
	const analytics = useSelect( select => select( STORE_NAME ).getAnalytics() );
	const loading   = useSelect( select => select( STORE_NAME ).getAnalyticsLoading() );

	useEffect( () => { fetchAnalytics( {} ); }, [] );

	const currency = window.cmAdminData?.currency?.symbol || '$';

	if ( loading || ! analytics ) {
		return <div style={ { padding: 32, textAlign: 'center' } }><Spinner /></div>;
	}

	return (
		<div>
			<div className="cm-page-header">
				<h1 className="cm-page-title">{ __( 'Analytics', 'boostcart' ) }</h1>
			</div>

			<div className="cm-metrics-grid">
				<MetricCard
					title={ __( 'Milestones Reached', 'boostcart' ) }
					value={ analytics.milestones_reached?.toLocaleString() ?? '—' }
				/>
				<MetricCard
					title={ __( 'Rewards Applied', 'boostcart' ) }
					value={ analytics.rewards_applied?.toLocaleString() ?? '—' }
				/>
				<MetricCard
					title={ __( 'Rewards Redeemed', 'boostcart' ) }
					value={ analytics.rewards_redeemed?.toLocaleString() ?? '—' }
					subtitle={ analytics.redemption_rate_pct != null ? `${ analytics.redemption_rate_pct }% redemption rate` : null }
				/>
				<MetricCard
					title={ __( 'Revenue Influenced', 'boostcart' ) }
					value={ `${ currency }${ Number( analytics.avg_cart_value ?? 0 ).toFixed( 2 ) }` }
					subtitle={ __( 'Avg. cart value on reward', 'boostcart' ) }
				/>
				<MetricCard
					title={ __( 'Total Discount Issued', 'boostcart' ) }
					value={ `${ currency }${ Number( analytics.total_discount ?? 0 ).toFixed( 2 ) }` }
				/>
				<MetricCard
					title={ __( 'Avg. Discount per Order', 'boostcart' ) }
					value={ `${ currency }${ Number( analytics.avg_discount ?? 0 ).toFixed( 2 ) }` }
				/>
				<MetricCard
					title={ __( 'Influenced Orders', 'boostcart' ) }
					value={ analytics.influenced_orders?.toLocaleString() ?? '—' }
				/>
			</div>
		</div>
	);
}
