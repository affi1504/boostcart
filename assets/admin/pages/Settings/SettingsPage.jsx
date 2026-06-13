import React, { useState, useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { getSettings, updateSettings } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { ProgressPreview, PROGRESS_STYLES } from '../../components/ui/ProgressPreview';

const LOCATION_OPTIONS = [
	{ key: 'cart',      label: __( 'Cart Page', 'boostcart' ) },
	{ key: 'checkout',  label: __( 'Checkout Page', 'boostcart' ) },
	{ key: 'product',   label: __( 'Product Page', 'boostcart' ) },
	{ key: 'mini_cart', label: __( 'Mini Cart', 'boostcart' ) },
];

const CELEBRATION_OPTIONS = [
	{ key: 'confetti',  label: __( 'Confetti', 'boostcart' ) },
	{ key: 'toast',     label: __( 'Toast Notifications', 'boostcart' ) },
	{ key: 'fireworks', label: __( 'Fireworks (optional)', 'boostcart' ) },
];

function DebugTab() {
	const [ info, setInfo ]           = useState( null );
	const [ log, setLog ]             = useState( '' );
	const [ logEnabled, setEnabled ]  = useState( false );
	const [ loadingInfo, setLI ]      = useState( true );
	const [ loadingLog, setLL ]       = useState( true );
	const [ clearing, setClearing ]   = useState( false );
	const [ copied, setCopied ]       = useState( false );
	const logRef                      = useRef( null );

	useEffect( () => {
		apiFetch( { path: '/boostcart/v1/debug/info' } )
			.then( setInfo )
			.finally( () => setLI( false ) );

		apiFetch( { path: '/boostcart/v1/debug/log' } )
			.then( r => { setLog( r.contents || '' ); setEnabled( r.enabled ); } )
			.finally( () => setLL( false ) );
	}, [] );

	async function handleClear() {
		setClearing( true );
		await apiFetch( { path: '/boostcart/v1/debug/log', method: 'DELETE' } );
		setLog( '' );
		setClearing( false );
	}

	function handleCopy() {
		const text = buildCopyText();
		navigator.clipboard.writeText( text ).then( () => {
			setCopied( true );
			setTimeout( () => setCopied( false ), 2000 );
		} );
	}

	function buildCopyText() {
		let out = '=== Boostcart Debug Report ===\n\n';
		if ( info ) {
			out += '--- System Info ---\n';
			out += `Plugin Version: ${ info.plugin_version }\n`;
			out += `Plugin Basename: ${ info.plugin_basename }\n`;
			out += `PHP: ${ info.php_version } | WP: ${ info.wp_version } | WC: ${ info.wc_version }\n`;
			out += `REST URL: ${ info.rest_url }\n`;
			out += `Debug Mode: ${ info.debug_mode ? 'ON' : 'OFF' }\n`;
			if ( info.last_db_error ) {
				out += `Last DB Error: ${ info.last_db_error }\n`;
			}
			out += '\n--- Database Tables ---\n';
			Object.entries( info.tables || {} ).forEach( ( [ t, s ] ) => {
				out += `${ t }: ${ s.exists ? `✓ (${ s.rows } rows)` : '✗ MISSING' }\n`;
			} );
		}
		if ( log ) {
			out += '\n--- Debug Log (last 200 lines) ---\n';
			out += log;
		} else {
			out += '\n--- Debug Log ---\n(empty — enable Debug Mode and reproduce the issue)\n';
		}
		return out;
	}

	return (
		<div>
			{/* System Info */ }
			<Card style={ { marginBottom: 16 } }>
				<h2 className="cm-section-title">{ __( 'System Info', 'boostcart' ) }</h2>
				{ loadingInfo ? <Spinner /> : info && (
					<table className="cm-debug-table">
						<tbody>
							<tr><td>{ __( 'Plugin Version', 'boostcart' ) }</td><td><code>{ info.plugin_version }</code></td></tr>
							<tr><td>{ __( 'Plugin Basename', 'boostcart' ) }</td><td><code>{ info.plugin_basename }</code></td></tr>
							<tr><td>PHP</td><td><code>{ info.php_version }</code></td></tr>
							<tr><td>WordPress</td><td><code>{ info.wp_version }</code></td></tr>
							<tr><td>WooCommerce</td><td><code>{ info.wc_version }</code></td></tr>
							<tr><td>{ __( 'REST Endpoint', 'boostcart' ) }</td><td><code>{ info.rest_url }</code></td></tr>
							{ info.last_db_error && (
								<tr>
									<td style={ { color: 'var(--cm-error)' } }>{ __( 'Last DB Error', 'boostcart' ) }</td>
									<td><code style={ { color: 'var(--cm-error)' } }>{ info.last_db_error }</code></td>
								</tr>
							) }
						</tbody>
					</table>
				) }
			</Card>

			{/* DB Tables */ }
			<Card style={ { marginBottom: 16 } }>
				<h2 className="cm-section-title">{ __( 'Database Tables', 'boostcart' ) }</h2>
				<p className="cm-section-hint">
					{ __( 'If any table shows MISSING, deactivate and reactivate the plugin to recreate them.', 'boostcart' ) }
				</p>
				{ loadingInfo ? <Spinner /> : info && (
					<table className="cm-debug-table">
						<tbody>
							{ Object.entries( info.tables || {} ).map( ( [ table, status ] ) => (
								<tr key={ table }>
									<td><code>{ table }</code></td>
									<td>
										{ status.exists
											? <span style={ { color: 'var(--cm-success)' } }>✓ { status.rows } rows</span>
											: <span style={ { color: 'var(--cm-error)', fontWeight: 600 } }>✗ MISSING</span>
										}
									</td>
								</tr>
							) ) }
						</tbody>
					</table>
				) }
			</Card>

			{/* Debug Log */ }
			<Card>
				<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 } }>
					<div>
						<h2 className="cm-section-title" style={ { marginBottom: 4 } }>{ __( 'Debug Log', 'boostcart' ) }</h2>
						{ ! logEnabled && (
							<p className="cm-section-hint" style={ { margin: 0 } }>
								{ __( 'Enable Debug Mode above, save, then reproduce the issue.', 'boostcart' ) }
							</p>
						) }
					</div>
					<div style={ { display: 'flex', gap: 8 } }>
						<Button variant="primary" onClick={ handleCopy }>
							{ copied ? __( 'Copied!', 'boostcart' ) : __( 'Copy Full Report', 'boostcart' ) }
						</Button>
						<Button variant="secondary" loading={ clearing } onClick={ handleClear }>
							{ __( 'Clear Log', 'boostcart' ) }
						</Button>
					</div>
				</div>

				{ loadingLog ? <Spinner /> : (
					<textarea
						ref={ logRef }
						readOnly
						value={ log || __( '(no log entries yet)', 'boostcart' ) }
						style={ {
							width: '100%',
							height: 320,
							fontFamily: 'var(--cm-font-mono)',
							fontSize: 12,
							lineHeight: 1.6,
							background: '#0d0d0d',
							color: '#e5e5e5',
							border: '1px solid var(--cm-hairline)',
							borderRadius: 'var(--cm-radius-md)',
							padding: 12,
							resize: 'vertical',
						} }
						onClick={ e => e.target.select() }
					/>
				) }
			</Card>
		</div>
	);
}


const DEFAULT_COLORS = {
	bar:    '#171717',
	track:  '#f0f0f0',
	accent: '#0070f3',
	text:   '#4d4d4d',
};

function ProgressBarSettings( { settings, setSettings, onSave, saving, saved } ) {
	const style   = settings.progress_style  || 'classic';
	const colors  = { ...DEFAULT_COLORS, ...( settings.progress_colors || {} ) };
	const animated = settings.progress_animated !== false;

	function setStyle( id ) {
		setSettings( s => ( { ...s, progress_style: id } ) );
	}

	function setColor( key, value ) {
		setSettings( s => ( { ...s, progress_colors: { ...( s.progress_colors || {} ), [ key ]: value } } ) );
	}

	function setAnimated( v ) {
		setSettings( s => ( { ...s, progress_animated: v } ) );
	}

	return (
		<div>
			<div className="cm-page-header" style={ { marginBottom: 16 } }>
				<div>
					<h2 className="cm-section-title" style={ { marginBottom: 4 } }>Progress Bar Style</h2>
					<p className="cm-section-hint" style={ { margin: 0 } }>
						Choose how the progress bar looks on your store and customise its colours.
					</p>
				</div>
				<Button loading={ saving } onClick={ onSave }>
					{ saved ? 'Saved!' : 'Save Settings' }
				</Button>
			</div>

			{/* Live preview */}
			<Card style={ { marginBottom: 20 } }>
				<h3 className="cm-section-title" style={ { marginBottom: 12 } }>Live Preview</h3>
				<ProgressPreview style={ style } colors={ colors } animated={ animated } />
			</Card>

			{/* Style selector */}
			<Card style={ { marginBottom: 16 } }>
				<h3 className="cm-section-title" style={ { marginBottom: 4 } }>Style</h3>
				<p className="cm-section-hint">Select the visual layout for the progress bar.</p>
				<div className="cm-style-grid">
					{ PROGRESS_STYLES.map( s => (
						<div
							key={ s.id }
							className={ `cm-style-card${ style === s.id ? ' --active' : '' }` }
							onClick={ () => setStyle( s.id ) }
							role="button"
							tabIndex={ 0 }
							onKeyDown={ e => e.key === 'Enter' && setStyle( s.id ) }
						>
							<div className="cm-style-card__name">{ s.label }</div>
							<div className="cm-style-card__desc">{ s.description }</div>
						</div>
					) ) }
				</div>
			</Card>

			{/* Colour controls */}
			<Card style={ { marginBottom: 16 } }>
				<h3 className="cm-section-title" style={ { marginBottom: 4 } }>Colours</h3>
				<p className="cm-section-hint">All changes reflect instantly in the preview above.</p>
				<div className="cm-color-row">
					{ [
						[ 'bar',    'Bar / Fill'   ],
						[ 'track',  'Track / Background' ],
						[ 'accent', 'Accent / Next Milestone' ],
						[ 'text',   'Message Text' ],
					].map( ( [ key, label ] ) => (
						<div key={ key } className="cm-color-field">
							<label>{ label }</label>
							<input
								type="color"
								value={ colors[ key ] }
								onChange={ e => setColor( key, e.target.value ) }
							/>
							<code style={ { fontSize: 10, color: 'var(--cm-mute)' } }>{ colors[ key ] }</code>
						</div>
					) ) }
				</div>
				<button
					type="button"
					className="cm-link-btn"
					onClick={ () => setSettings( s => ( { ...s, progress_colors: DEFAULT_COLORS } ) ) }
				>
					Reset to defaults
				</button>
			</Card>

			{/* Animations toggle */}
			<Card>
				<h3 className="cm-section-title" style={ { marginBottom: 4 } }>Animations</h3>
				<label className="cm-checkbox-row">
					<input
						type="checkbox"
						checked={ animated }
						onChange={ e => setAnimated( e.target.checked ) }
					/>
					Enable bar fill animations and milestone effects
				</label>
				<p className="cm-section-hint" style={ { marginTop: 4 } }>
					Disable for accessibility or performance on low-end devices.
				</p>
			</Card>
		</div>
	);
}

export function SettingsPage() {
	const [ settings, setSettings ] = useState( null );
	const [ saving, setSaving ]     = useState( false );
	const [ saved, setSaved ]       = useState( false );
	const [ tab, setTab ]           = useState( 'general' );

	useEffect( () => {
		getSettings().then( setSettings );
	}, [] );

	function toggleArray( key, value ) {
		const arr = ( settings[ key ] || [] ).slice();
		const idx = arr.indexOf( value );
		if ( idx >= 0 ) arr.splice( idx, 1 );
		else arr.push( value );
		setSettings( s => ( { ...s, [ key ]: arr } ) );
	}

	function toggle( key ) {
		setSettings( s => ( { ...s, [ key ]: ! s[ key ] } ) );
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
				{ tab === 'general' && (
					<Button loading={ saving } onClick={ handleSave }>
						{ saved ? __( 'Saved!', 'boostcart' ) : __( 'Save Settings', 'boostcart' ) }
					</Button>
				) }
			</div>

			{/* Tab bar */ }
			<div className="cm-tab-bar" style={ { marginBottom: 24 } }>
				{ [
					[ 'general',  __( 'General', 'boostcart' ) ],
					[ 'progress', __( 'Progress Bar', 'boostcart' ) ],
					[ 'debug',    __( 'Debug', 'boostcart' ) ],
				].map( ( [ key, label ] ) => (
					<button
						key={ key }
						className={ `cm-tab-btn${ tab === key ? ' cm-tab-btn--active' : '' }` }
						onClick={ () => setTab( key ) }
					>
						{ label }
					</button>
				) ) }
			</div>

			{ tab === 'general' && (
				<>
					<Card style={ { marginBottom: 16 } }>
						<h2 className="cm-section-title">{ __( 'Display Locations', 'boostcart' ) }</h2>
						<p className="cm-section-hint">{ __( 'Choose where the progress widget appears on your store.', 'boostcart' ) }</p>
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

					<Card style={ { marginBottom: 16 } }>
						<h2 className="cm-section-title">{ __( 'Celebration Effects', 'boostcart' ) }</h2>
						<p className="cm-section-hint">{ __( 'Animations that fire when a customer unlocks a milestone.', 'boostcart' ) }</p>
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

					<Card>
						<h2 className="cm-section-title">{ __( 'Developer', 'boostcart' ) }</h2>
						<label className="cm-checkbox-row">
							<input
								type="checkbox"
								checked={ !! settings.debug_mode }
								onChange={ () => toggle( 'debug_mode' ) }
							/>
							{ __( 'Enable Debug Mode', 'boostcart' ) }
						</label>
						<p className="cm-section-hint" style={ { marginTop: 4 } }>
							{ __( 'Writes detailed logs to wp-content/uploads/boostcart-debug.log. Disable on production when not needed.', 'boostcart' ) }
						</p>
					</Card>
				</>
			) }


			{ tab === 'progress' && (
				<ProgressBarSettings
					settings={ settings }
					setSettings={ setSettings }
					onSave={ handleSave }
					saving={ saving }
					saved={ saved }
				/>
			) }
			{ tab === 'debug' && <DebugTab /> }
		</div>
	);
}
