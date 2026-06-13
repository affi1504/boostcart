import { createReduxStore, register } from '@wordpress/data';
import * as api from '../api/client';

const STORE_NAME = 'boostcart';

const DEFAULT_STATE = {
	campaigns: [],
	campaignsLoading: false,
	currentCampaign: null,
	analytics: null,
	analyticsLoading: false,
	settings: null,
	error: null,
};

const actions = {
	setCampaigns: ( campaigns ) => ( { type: 'SET_CAMPAIGNS', campaigns } ),
	setCampaignsLoading: ( loading ) => ( { type: 'SET_CAMPAIGNS_LOADING', loading } ),
	setCurrentCampaign: ( campaign ) => ( { type: 'SET_CURRENT_CAMPAIGN', campaign } ),
	setAnalytics: ( analytics ) => ( { type: 'SET_ANALYTICS', analytics } ),
	setAnalyticsLoading: ( loading ) => ( { type: 'SET_ANALYTICS_LOADING', loading } ),
	setSettings: ( settings ) => ( { type: 'SET_SETTINGS', settings } ),
	setError: ( error ) => ( { type: 'SET_ERROR', error } ),

	fetchCampaigns: () => async ( { dispatch } ) => {
		dispatch( actions.setCampaignsLoading( true ) );
		try {
			const campaigns = await api.getCampaigns();
			dispatch( actions.setCampaigns( campaigns ) );
		} catch ( err ) {
			dispatch( actions.setError( err.message ) );
		} finally {
			dispatch( actions.setCampaignsLoading( false ) );
		}
	},

	fetchCampaign: ( id ) => async ( { dispatch } ) => {
		try {
			const campaign = await api.getCampaign( id );
			dispatch( actions.setCurrentCampaign( campaign ) );
		} catch ( err ) {
			dispatch( actions.setError( err.message ) );
		}
	},

	fetchAnalytics: ( params ) => async ( { dispatch } ) => {
		dispatch( actions.setAnalyticsLoading( true ) );
		try {
			const analytics = await api.getAnalyticsSummary( params );
			dispatch( actions.setAnalytics( analytics ) );
		} catch ( err ) {
			dispatch( actions.setError( err.message ) );
		} finally {
			dispatch( actions.setAnalyticsLoading( false ) );
		}
	},

	fetchSettings: () => async ( { dispatch } ) => {
		try {
			const settings = await api.getSettings();
			dispatch( actions.setSettings( settings ) );
		} catch ( err ) {
			dispatch( actions.setError( err.message ) );
		}
	},
};

const reducer = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'SET_CAMPAIGNS':           return { ...state, campaigns: action.campaigns };
		case 'SET_CAMPAIGNS_LOADING':   return { ...state, campaignsLoading: action.loading };
		case 'SET_CURRENT_CAMPAIGN':    return { ...state, currentCampaign: action.campaign };
		case 'SET_ANALYTICS':           return { ...state, analytics: action.analytics };
		case 'SET_ANALYTICS_LOADING':   return { ...state, analyticsLoading: action.loading };
		case 'SET_SETTINGS':            return { ...state, settings: action.settings };
		case 'SET_ERROR':               return { ...state, error: action.error };
		default:                        return state;
	}
};

const selectors = {
	getCampaigns:        ( state ) => state.campaigns,
	getCampaignsLoading: ( state ) => state.campaignsLoading,
	getCurrentCampaign:  ( state ) => state.currentCampaign,
	getAnalytics:        ( state ) => state.analytics,
	getAnalyticsLoading: ( state ) => state.analyticsLoading,
	getSettings:         ( state ) => state.settings,
	getError:            ( state ) => state.error,
};

const store = createReduxStore( STORE_NAME, { reducer, actions, selectors } );
register( store );

export { STORE_NAME };
export default store;
