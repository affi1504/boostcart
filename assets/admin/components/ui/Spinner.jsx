import React from 'react';

export function Spinner( { size = 'md' } ) {
	return (
		<span className={ `cm-spinner cm-spinner--${ size }` } aria-label="Loading" role="status">
			<span className="screen-reader-text">Loading…</span>
		</span>
	);
}
