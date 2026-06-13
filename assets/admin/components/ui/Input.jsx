import React from 'react';

export function Input( {
	label,
	id,
	error,
	hint,
	type = 'text',
	className = '',
	required = false,
	...props
} ) {
	const inputId = id || label?.toLowerCase().replace( /\s+/g, '-' );

	return (
		<div className={ [ 'cm-field', error ? 'cm-field--error' : '', className ].filter( Boolean ).join( ' ' ) }>
			{ label && (
				<label className="cm-field__label" htmlFor={ inputId }>
					{ label }
					{ required && <span className="cm-field__required" aria-hidden="true"> *</span> }
				</label>
			) }
			<input
				id={ inputId }
				type={ type }
				className="cm-field__input"
				aria-invalid={ !! error }
				aria-describedby={ error ? `${ inputId }-error` : hint ? `${ inputId }-hint` : undefined }
				{ ...props }
			/>
			{ hint && ! error && <p id={ `${ inputId }-hint` } className="cm-field__hint">{ hint }</p> }
			{ error && <p id={ `${ inputId }-error` } className="cm-field__error" role="alert">{ error }</p> }
		</div>
	);
}
