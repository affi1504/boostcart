import React from 'react';
import { createRoot } from 'react-dom';
import { HashRouter } from 'react-router-dom';
import apiFetch from '@wordpress/api-fetch';
import { App } from './App';
import './store';

// Configure apiFetch with the WP REST nonce.
if ( window.cmAdminData?.nonce ) {
	apiFetch.use( apiFetch.createNonceMiddleware( window.cmAdminData.nonce ) );
}
if ( window.cmAdminData?.restUrl ) {
	apiFetch.use( apiFetch.createRootURLMiddleware( window.cmAdminData.restUrl.replace( /\/boostcart\/v1\/?$/, '' ) ) );
}

const root = document.getElementById( 'cm-admin-root' );
if ( root ) {
	createRoot( root ).render(
		<HashRouter>
			<App />
		</HashRouter>
	);
}
