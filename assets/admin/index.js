import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import apiFetch from '@wordpress/api-fetch';
import { App } from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './store';

// Configure apiFetch nonce and WP REST root URL.
if ( window.cmAdminData?.nonce ) {
	apiFetch.use( apiFetch.createNonceMiddleware( window.cmAdminData.nonce ) );
}
if ( window.cmAdminData?.restRootUrl ) {
	apiFetch.use( apiFetch.createRootURLMiddleware( window.cmAdminData.restRootUrl ) );
}

const container = document.getElementById( 'cm-admin-root' );
if ( container ) {
	createRoot( container ).render(
		<ErrorBoundary>
			<HashRouter>
				<App />
			</HashRouter>
		</ErrorBoundary>
	);
}
