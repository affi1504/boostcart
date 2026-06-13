import React from 'react';

export function Card( { children, className = '', padding = 'lg', ...props } ) {
	return (
		<div className={ [ 'cm-card', `cm-card--pad-${ padding }`, className ].filter( Boolean ).join( ' ' ) } { ...props }>
			{ children }
		</div>
	);
}
