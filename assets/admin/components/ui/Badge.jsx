import React from 'react';

export function Badge( { children, variant = 'secondary', className = '' } ) {
	return (
		<span className={ [ 'cm-badge', `cm-badge--${ variant }`, className ].filter( Boolean ).join( ' ' ) }>
			{ children }
		</span>
	);
}
