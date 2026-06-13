/**
 * Boostcart Admin API client — wraps @wordpress/api-fetch.
 */
import apiFetch from '@wordpress/api-fetch';

const BASE = '/boostcart/v1';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a path with query string for GET requests. */
function withQuery( path, params = {} ) {
	const clean = Object.fromEntries(
		Object.entries( params ).filter( ( [ , v ] ) => v !== undefined && v !== null && v !== '' )
	);
	if ( ! Object.keys( clean ).length ) return path;
	return path + '?' + new URLSearchParams( clean ).toString();
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export const getCampaigns = ( params = {} ) =>
	apiFetch( { path: withQuery( `${ BASE }/campaigns`, params ) } );

export const getCampaign = ( id ) =>
	apiFetch( { path: `${ BASE }/campaigns/${ id }` } );

export const createCampaign = ( data ) =>
	apiFetch( { path: `${ BASE }/campaigns`, method: 'POST', data } );

export const updateCampaign = ( id, data ) =>
	apiFetch( { path: `${ BASE }/campaigns/${ id }`, method: 'PUT', data } );

export const deleteCampaign = ( id ) =>
	apiFetch( { path: `${ BASE }/campaigns/${ id }`, method: 'DELETE' } );

export const duplicateCampaign = ( id ) =>
	apiFetch( { path: `${ BASE }/campaigns/${ id }/duplicate`, method: 'POST' } );

export const patchCampaignStatus = ( id, status ) =>
	apiFetch( { path: `${ BASE }/campaigns/${ id }/status`, method: 'PATCH', data: { status } } );

// ── Milestones ────────────────────────────────────────────────────────────────

export const getMilestones = ( campaignId ) =>
	apiFetch( { path: `${ BASE }/campaigns/${ campaignId }/milestones` } );

export const createMilestone = ( campaignId, data ) =>
	apiFetch( { path: `${ BASE }/campaigns/${ campaignId }/milestones`, method: 'POST', data } );

export const updateMilestone = ( campaignId, id, data ) =>
	apiFetch( { path: `${ BASE }/campaigns/${ campaignId }/milestones/${ id }`, method: 'PUT', data } );

export const deleteMilestone = ( campaignId, id ) =>
	apiFetch( { path: `${ BASE }/campaigns/${ campaignId }/milestones/${ id }`, method: 'DELETE' } );

export const setBestValue = ( campaignId, id ) =>
	apiFetch( { path: `${ BASE }/campaigns/${ campaignId }/milestones/${ id }/best-value`, method: 'PATCH' } );

// ── Conditions ────────────────────────────────────────────────────────────────

export const getConditions = ( campaignId ) =>
	apiFetch( { path: `${ BASE }/campaigns/${ campaignId }/conditions` } );

export const saveConditions = ( campaignId, tree ) =>
	apiFetch( { path: `${ BASE }/campaigns/${ campaignId }/conditions`, method: 'PUT', data: { tree } } );

// ── Analytics ─────────────────────────────────────────────────────────────────

export const getAnalyticsSummary = ( params = {} ) =>
	apiFetch( { path: withQuery( `${ BASE }/analytics/summary`, params ) } );

export const getMilestoneRates = () =>
	apiFetch( { path: `${ BASE }/analytics/milestones` } );

// ── Settings ──────────────────────────────────────────────────────────────────

export const getSettings = () =>
	apiFetch( { path: `${ BASE }/settings` } );

export const updateSettings = ( data ) =>
	apiFetch( { path: `${ BASE }/settings`, method: 'PUT', data } );

// ── Import / Export ───────────────────────────────────────────────────────────

export const exportData = () =>
	apiFetch( { path: `${ BASE }/export` } );

export const importData = ( campaigns ) =>
	apiFetch( { path: `${ BASE }/import`, method: 'POST', data: { campaigns } } );

export const validateImport = ( campaigns ) =>
	apiFetch( { path: `${ BASE }/import/validate`, method: 'POST', data: { campaigns } } );

// ── Updates ───────────────────────────────────────────────────────────────────

export const getUpdateStatus = () =>
	apiFetch( { path: `${ BASE }/update/status` } );

export const applyUpdate = () =>
	apiFetch( { path: `${ BASE }/update/apply`, method: 'POST' } );

export const getUpdateHistory = () =>
	apiFetch( { path: `${ BASE }/update/history` } );

export const rollbackTo = ( version ) =>
	apiFetch( { path: `${ BASE }/update/rollback`, method: 'POST', data: { version } } );
