import React from 'react';

export class ErrorBoundary extends React.Component {
	constructor( props ) {
		super( props );
		this.state = { error: null };
	}

	static getDerivedStateFromError( error ) {
		return { error };
	}

	componentDidCatch( error, info ) {
		console.error( '[Boostcart]', error, info.componentStack );
	}

	render() {
		if ( this.state.error ) {
			return (
				<div style={ {
					margin: 32,
					padding: 24,
					background: '#fff0f0',
					border: '1px solid #ee0000',
					borderRadius: 8,
					fontFamily: 'monospace',
					fontSize: 13,
					color: '#c50000',
				} }>
					<strong>Boostcart failed to load.</strong>
					<pre style={ { marginTop: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }>
						{ this.state.error.message }
					</pre>
					<p style={ { marginTop: 12, fontFamily: 'sans-serif', color: '#555' } }>
						Open the browser console (F12) for the full stack trace. If the build is missing, run <code>npm run build</code> and re-upload the plugin.
					</p>
				</div>
			);
		}
		return this.props.children;
	}
}
