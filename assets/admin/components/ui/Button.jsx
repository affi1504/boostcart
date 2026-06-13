import React from 'react';

export function Button( {
	children,
	variant = 'primary',
	size = 'md',
	disabled = false,
	loading = false,
	onClick,
	type = 'button',
	className = '',
	...props
} ) {
	const base = 'cm-btn';
	const cls  = [ base, `${ base }--${ variant }`, `${ base }--${ size }`, className ]
		.filter( Boolean ).join( ' ' );

	return (
		<button
			type={ type }
			className={ cls }
			disabled={ disabled || loading }
			onClick={ onClick }
			aria-disabled={ disabled || loading }
			{ ...props }
		>
			{ loading && <span className="cm-btn__spinner" aria-hidden="true" /> }
			{ children }
		</button>
	);
}
