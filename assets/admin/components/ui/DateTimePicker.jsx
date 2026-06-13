import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Clean date + time picker that replaces the browser's inconsistent datetime-local.
 * Value format: "YYYY-MM-DD HH:MM:SS" (MySQL) or "" for empty.
 */
export function DateTimePicker( { label, hint, value = '', onChange } ) {
	function parse( v ) {
		if ( ! v ) return { date: '', hour: '00', minute: '00' };
		const [ datePart, timePart = '' ] = v.replace( 'T', ' ' ).split( ' ' );
		const [ hour = '00', minute = '00' ] = timePart.split( ':' );
		return { date: datePart, hour: hour.padStart( 2, '0' ), minute: minute.padStart( 2, '0' ) };
	}

	const parsed = parse( value );

	function emit( date, hour, minute ) {
		if ( ! date ) {
			onChange( '' );
			return;
		}
		onChange( `${ date } ${ hour }:${ minute }:00` );
	}

	const hours   = Array.from( { length: 24 }, ( _, i ) => String( i ).padStart( 2, '0' ) );
	const minutes = [ '00', '15', '30', '45' ];

	return (
		<div className="cm-field">
			{ label && <label className="cm-field__label">{ label }</label> }
			<div className="cm-datetime-picker">
				<input
					type="date"
					className="cm-field__input cm-datetime-picker__date"
					value={ parsed.date }
					onChange={ e => emit( e.target.value, parsed.hour, parsed.minute ) }
				/>
				<select
					className="cm-field__select cm-datetime-picker__hour"
					value={ parsed.hour }
					onChange={ e => emit( parsed.date, e.target.value, parsed.minute ) }
					disabled={ ! parsed.date }
				>
					{ hours.map( h => <option key={ h } value={ h }>{ h }:00</option> ) }
				</select>
				<span className="cm-datetime-picker__sep">:</span>
				<select
					className="cm-field__select cm-datetime-picker__minute"
					value={ parsed.minute }
					onChange={ e => emit( parsed.date, parsed.hour, e.target.value ) }
					disabled={ ! parsed.date }
				>
					{ minutes.map( m => <option key={ m } value={ m }>{ m }</option> ) }
				</select>
				{ parsed.date && (
					<button
						type="button"
						className="cm-datetime-picker__clear"
						onClick={ () => onChange( '' ) }
						aria-label={ __( 'Clear date', 'boostcart' ) }
					>
						✕
					</button>
				) }
			</div>
			{ hint && <p className="cm-field__hint">{ hint }</p> }
		</div>
	);
}
