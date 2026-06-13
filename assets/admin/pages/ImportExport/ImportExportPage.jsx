import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { exportData, importData, validateImport } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export function ImportExportPage() {
	const [ exporting, setExporting ] = useState( false );
	const [ importing, setImporting ] = useState( false );
	const [ status, setStatus ]       = useState( null );
	const [ fileError, setFileError ] = useState( null );

	async function handleExport() {
		setExporting( true );
		try {
			const data = await exportData();
			const blob = new Blob( [ JSON.stringify( data, null, 2 ) ], { type: 'application/json' } );
			const url  = URL.createObjectURL( blob );
			const a    = document.createElement( 'a' );
			a.href     = url;
			a.download = `boostcart-export-${ new Date().toISOString().slice( 0, 10 ) }.json`;
			a.click();
			URL.revokeObjectURL( url );
		} finally {
			setExporting( false );
		}
	}

	async function handleImportFile( e ) {
		const file = e.target.files[ 0 ];
		if ( ! file ) return;

		setFileError( null );

		let parsed;
		try {
			parsed = JSON.parse( await file.text() );
		} catch {
			setFileError( __( 'Invalid JSON file.', 'boostcart' ) );
			return;
		}

		if ( ! parsed?.campaigns ) {
			setFileError( __( 'File is missing "campaigns" key.', 'boostcart' ) );
			return;
		}

		const validation = await validateImport( parsed.campaigns );
		if ( ! validation.valid ) {
			setFileError( validation.errors.join( ' ' ) );
			return;
		}

		setImporting( true );
		try {
			const result = await importData( parsed.campaigns );
			setStatus( __( `Imported ${ result.imported } campaign(s).`, 'boostcart' ) );
		} catch ( err ) {
			setFileError( err.message );
		} finally {
			setImporting( false );
			e.target.value = '';
		}
	}

	return (
		<div>
			<div className="cm-page-header">
				<h1 className="cm-page-title">{ __( 'Import / Export', 'boostcart' ) }</h1>
			</div>

			{ status && <p style={ { color: 'var(--cm-success)', marginBottom: 16 } }>{ status }</p> }

			<Card style={ { marginBottom: 24 } }>
				<h2 className="cm-section-title">{ __( 'Export Campaigns', 'boostcart' ) }</h2>
				<p style={ { color: 'var(--cm-body)', marginBottom: 16 } }>
					{ __( 'Download all campaigns, milestones and conditions as a JSON file.', 'boostcart' ) }
				</p>
				<Button loading={ exporting } onClick={ handleExport }>
					{ __( 'Export JSON', 'boostcart' ) }
				</Button>
			</Card>

			<Card>
				<h2 className="cm-section-title">{ __( 'Import Campaigns', 'boostcart' ) }</h2>
				<p style={ { color: 'var(--cm-body)', marginBottom: 16 } }>
					{ __( 'Imported campaigns are created as inactive. Existing campaigns are not overwritten.', 'boostcart' ) }
				</p>
				{ fileError && <p style={ { color: 'var(--cm-error)', marginBottom: 8 } }>{ fileError }</p> }
				<div style={ { display: 'flex', alignItems: 'center', gap: 12 } }>
					<input
						id="cm-import-file"
						type="file"
						accept="application/json,.json"
						onChange={ handleImportFile }
						disabled={ importing }
						style={ { display: 'none' } }
					/>
					<Button
						variant="secondary"
						loading={ importing }
						onClick={ () => document.getElementById( 'cm-import-file' ).click() }
					>
						{ importing ? __( 'Importing…', 'boostcart' ) : __( 'Choose JSON File', 'boostcart' ) }
					</Button>
					<span style={ { fontSize: 12, color: 'var(--cm-mute)' } }>
						{ __( 'Only .json files exported from Boostcart', 'boostcart' ) }
					</span>
				</div>
			</Card>
		</div>
	);
}
