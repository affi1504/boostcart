import React from 'react';

export function Select( { label, id, options = [], error, hint, className = '', required = false, ...props } ) {
	const selectId = id || label?.toLowerCase().replace( /\s+/g, '-' );

	return (
		<div className={ [ 'cm-field', error ? 'cm-field--error' : '', className ].filter( Boolean ).join( ' ' ) }>
			{ label && (
				<label className="cm-field__label" htmlFor={ selectId }>
					{ label }
					{ required && <span className="cm-field__required" aria-hidden="true"> *</span> }
				</label>
			) }
			<select id={ selectId } className="cm-field__select" aria-invalid={ !! error } { ...props }>
				{ options.map( opt => (
					<option key={ opt.value } value={ opt.value }>{ opt.label }</option>
				) ) }
			</select>
			{ hint && ! error && <p className="cm-field__hint">{ hint }</p> }
			{ error && <p className="cm-field__error" role="alert">{ error }</p> }
		</div>
	);
}
