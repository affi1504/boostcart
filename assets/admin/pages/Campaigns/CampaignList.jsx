import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../../store';
import { deleteCampaign, duplicateCampaign, patchCampaignStatus } from '../../api/client';
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

export function CampaignList() {
	const navigate   = useNavigate();
	const { fetchCampaigns } = useDispatch( STORE_NAME );
	const campaigns  = useSelect( s => s[ STORE_NAME ].getCampaigns() );
	const loading    = useSelect( s => s[ STORE_NAME ].getCampaignsLoading() );
	const [ busy, setBusy ] = useState( {} );

	useEffect( () => { fetchCampaigns(); }, [] );

	async function handleDelete( id ) {
		if ( ! confirm( __( 'Delete this campaign? This cannot be undone.', 'boostcart' ) ) ) return;
		setBusy( b => ( { ...b, [ id ]: true } ) );
		try {
			await deleteCampaign( id );
			fetchCampaigns();
		} finally {
			setBusy( b => ( { ...b, [ id ]: false } ) );
		}
	}

	async function handleDuplicate( id ) {
		setBusy( b => ( { ...b, [ `dup_${ id }` ]: true } ) );
		try {
			await duplicateCampaign( id );
			fetchCampaigns();
		} finally {
			setBusy( b => ( { ...b, [ `dup_${ id }` ]: false } ) );
		}
	}

	async function handleToggleStatus( campaign ) {
		const next = campaign.status === 'active' ? 'inactive' : 'active';
		await patchCampaignStatus( campaign.id, next );
		fetchCampaigns();
	}

	if ( loading ) return <div style={ { padding: 32, textAlign: 'center' } }><Spinner /></div>;

	return (
		<div>
			<div className="cm-page-header">
				<h1 className="cm-page-title">{ __( 'Campaigns', 'boostcart' ) }</h1>
				<Button onClick={ () => navigate( '/campaigns/new' ) }>
					{ __( '+ New Campaign', 'boostcart' ) }
				</Button>
			</div>

			{ campaigns.length === 0 ? (
				<Card>
					<div className="cm-empty-state">
						<div className="cm-empty-state__icon">🏆</div>
						<h2 className="cm-empty-state__title">{ __( 'No campaigns yet.', 'boostcart' ) }</h2>
						<p className="cm-empty-state__body">{ __( 'Create your first campaign to start rewarding customers for reaching cart milestones.', 'boostcart' ) }</p>
						<Button onClick={ () => navigate( '/campaigns/new' ) }>
							{ __( 'Create Campaign', 'boostcart' ) }
						</Button>
					</div>
				</Card>
			) : (
				<div className="cm-campaign-list">
					{ campaigns.map( campaign => (
						<Card key={ campaign.id } className="cm-campaign-card">
							<div className="cm-campaign-card__header">
								<div>
									<span className="cm-campaign-card__name">{ campaign.name }</span>
									<Badge variant={ STATUS_VARIANTS[ campaign.status ] || 'secondary' }>
										{ campaign.status }
									</Badge>
								</div>
								<div className="cm-campaign-card__actions">
									<Button
										variant="ghost"
										size="sm"
										onClick={ () => handleToggleStatus( campaign ) }
									>
										{ campaign.status === 'active' ? __( 'Deactivate', 'boostcart' ) : __( 'Activate', 'boostcart' ) }
									</Button>
									<Button
										variant="secondary"
										size="sm"
										onClick={ () => navigate( `/campaigns/${ campaign.id }` ) }
									>
										{ __( 'Edit', 'boostcart' ) }
									</Button>
									<Button
										variant="ghost"
										size="sm"
										loading={ busy[ `dup_${ campaign.id }` ] }
										onClick={ () => handleDuplicate( campaign.id ) }
									>
										{ __( 'Duplicate', 'boostcart' ) }
									</Button>
									<Button
										variant="danger"
										size="sm"
										loading={ busy[ campaign.id ] }
										onClick={ () => handleDelete( campaign.id ) }
									>
										{ __( 'Delete', 'boostcart' ) }
									</Button>
								</div>
							</div>
							<div className="cm-campaign-card__meta">
								<span>{ __( 'Trigger:', 'boostcart' ) } { campaign.trigger_type }</span>
								<span>{ __( 'Scope:', 'boostcart' ) } { campaign.target_scope }</span>
								{ campaign.start_date && <span>{ __( 'From:', 'boostcart' ) } { campaign.start_date.slice( 0, 10 ) }</span> }
								{ campaign.end_date   && <span>{ __( 'Until:', 'boostcart' ) } { campaign.end_date.slice( 0, 10 ) }</span> }
							</div>
						</Card>
					) ) }
				</div>
			) }
		</div>
	);
}
