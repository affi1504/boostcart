import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { getSettings, updateSettings } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';

const LOCATION_OPTIONS = [
	{ key: 'cart',            label: __( 'Cart Page', 'boostcart' ) },
	{ key: 'checkout',        label: __( 'Checkout Page', 'boostcart' ) },
	{ key: 'product',         label: __( 'Product Page', 'boostcart' ) },
	{ key: 'category',        label: __( 'Category Page', 'boostcart' ) },
	{ key: 'mini_cart',       label: __( 'Mini Cart', 'boostcart' ) },
	{ key: 'floating_widget', label: __( 'Floating Widget', 'boostcart' ) },
];

const CELEBRATION_OPTIONS = [
	{ key: 'confetti',  label: __( 'Confetti', 'boostcart' ) },
	{ key: 'toast',     label: __( 'Toast Notifications', 'boostcart' ) },
	{ key: 'fireworks', label: __( 'Fireworks (optional)', 'boostcart' ) },
];

export function SettingsPage() {
	const [ settings, setSettings ] = useState( null );
	const [ saving, setSaving ]     = useState( false );
	const [ saved, setSaved ]       = useState( false );

	useEffect( () => {
		getSettings().then( setSettings );
	}, [] );

	function toggleArray( key, value ) {
		const arr = (settings[ key ] || []).slice();
		const idx = arr.indexOf( value );
		if ( idx >= 0 ) arr.splice( idx, 1 );
		else arr.push( value );
		setSettings( s => ( { ...s, [ key ]: arr } ) );
	}

	async function handleSave() {
		setSaving( true );
		try {
			await updateSettings( settings );
			setSaved( true );
			setTimeout( () => setSaved( false ), 2000 );
		} finally {
			setSaving( false );
		}
	}

	if ( ! settings ) return <div style={ { padding: 32, textAlign: 'center' } }><Spinner /></div>;

	return (
		<div>
			<div className="cm-page-header">
				<h1 className="cm-page-title">{ __( 'Settings', 'boostcart' ) }</h1>
				<Button loading={ saving } onClick={ handleSave }>
					{ saved ? __( 'Saved!', 'boostcart' ) : __( 'Save Settings', 'boostcart' ) }
				</Button>
			</div>

			<Card style={ { marginBottom: 24 } }>
				<h2 className="cm-section-title">{ __( 'Display Locations', 'boostcart' ) }</h2>
				{ LOCATION_OPTIONS.map( opt => (
					<label key={ opt.key } className="cm-checkbox-row">
						<input
							type="checkbox"
							checked={ ( settings.display_locations || [] ).includes( opt.key ) }
							onChange={ () => toggleArray( 'display_locations', opt.key ) }
						/>
						{ opt.label }
					</label>
				) ) }
			</Card>

			<Card>
				<h2 className="cm-section-title">{ __( 'Celebration Effects', 'boostcart' ) }</h2>
				{ CELEBRATION_OPTIONS.map( opt => (
					<label key={ opt.key } className="cm-checkbox-row">
						<input
							type="checkbox"
							checked={ ( settings.celebration_types || [] ).includes( opt.key ) }
							onChange={ () => toggleArray( 'celebration_types', opt.key ) }
						/>
						{ opt.label }
					</label>
				) ) }
			</Card>
		</div>
	);
}
