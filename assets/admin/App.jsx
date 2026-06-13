import React from 'react';
import { NavLink } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { Router } from './router';
import './styles/globals.css';
import './styles/components.css';
import './styles/progress-preview.css';

const NAV_LINKS = [
	{ to: '/campaigns',    label: __( 'Campaigns', 'boostcart' ) },
	{ to: '/analytics',    label: __( 'Analytics', 'boostcart' ) },
	{ to: '/settings',     label: __( 'Settings', 'boostcart' ) },
	{ to: '/import-export',label: __( 'Import / Export', 'boostcart' ) },
];

export function App() {
	return (
		<div className="cm-app">
			<nav className="cm-sidebar" aria-label={ __( 'Boostcart navigation', 'boostcart' ) }>
				<div className="cm-sidebar__logo">
					<span aria-hidden="true">🏆</span>
					<span>{ __( 'Boostcart', 'boostcart' ) }</span>
				</div>
				<ul className="cm-sidebar__nav" role="list">
					{ NAV_LINKS.map( link => (
						<li key={ link.to }>
							<NavLink
								to={ link.to }
								className={ ( { isActive } ) =>
									[ 'cm-sidebar__link', isActive ? 'cm-sidebar__link--active' : '' ].join( ' ' )
								}
							>
								{ link.label }
							</NavLink>
						</li>
					) ) }
				</ul>
				<div className="cm-sidebar__version">
					v{ window.cmAdminData?.version || '1.0.0' }
				</div>
			</nav>
			<main className="cm-main" id="cm-main-content">
				<Router />
			</main>
		</div>
	);
}
