import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../store';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import * as api from '../../api/client';

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
	const [ analytics, setAnalytics ] = useState( null );
	const [ loading, setLoading ]     = useState( true );
	const [ error, setError ]         = useState( null );

	const currency = window.cmAdminData?.currency?.symbol || '$';

	useEffect( () => {
		api.getAnalyticsSummary( {} )
			.then( data => setAnalytics( data ) )
			.catch( err => setError( err.message ) )
			.finally( () => setLoading( false ) );
	}, [] );

	if ( loading ) {
		return <div style={ { padding: 32, textAlign: 'center' } }><Spinner /></div>;
	}

	if ( error ) {
		return (
			<div>
				<div className="cm-page-header">
					<h1 className="cm-page-title">{ __( 'Analytics', 'boostcart' ) }</h1>
				</div>
				<div className="cm-notice cm-notice--error">{ error }</div>
			</div>
		);
	}

	const isEmpty = ! analytics || (
		! analytics.milestones_reached &&
		! analytics.rewards_applied &&
		! analytics.influenced_orders
	);

	return (
		<div>
			<div className="cm-page-header">
				<h1 className="cm-page-title">{ __( 'Analytics', 'boostcart' ) }</h1>
			</div>

			{ isEmpty ? (
				<Card>
					<div className="cm-empty-state">
						<div className="cm-empty-state__icon">📊</div>
						<h2 className="cm-empty-state__title">{ __( 'No data yet.', 'boostcart' ) }</h2>
						<p className="cm-empty-state__body">
							{ __( 'Analytics will appear here once customers start reaching milestones. Create an active campaign and share your store to get started.', 'boostcart' ) }
						</p>
					</div>
				</Card>
			) : (
				<div className="cm-metrics-grid">
					<MetricCard
						title={ __( 'Milestones Reached', 'boostcart' ) }
						value={ Number( analytics.milestones_reached ?? 0 ).toLocaleString() }
					/>
					<MetricCard
						title={ __( 'Rewards Applied', 'boostcart' ) }
						value={ Number( analytics.rewards_applied ?? 0 ).toLocaleString() }
					/>
					<MetricCard
						title={ __( 'Rewards Redeemed', 'boostcart' ) }
						value={ Number( analytics.rewards_redeemed ?? 0 ).toLocaleString() }
						subtitle={ analytics.redemption_rate_pct != null ? `${ analytics.redemption_rate_pct }% redemption rate` : null }
					/>
					<MetricCard
						title={ __( 'Avg. Cart Value on Reward', 'boostcart' ) }
						value={ `${ currency }${ Number( analytics.avg_cart_value ?? 0 ).toFixed( 2 ) }` }
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
						value={ Number( analytics.influenced_orders ?? 0 ).toLocaleString() }
					/>
				</div>
			) }
		</div>
	);
}
