import React, { useState, useRef, useEffect } from 'react';
import { __ } from '@wordpress/i18n';

const MONTHS = [
	'January','February','March','April','May','June',
	'July','August','September','October','November','December',
];
const DAYS = [ 'Su','Mo','Tu','We','Th','Fr','Sa' ];

function parseValue( v ) {
	if ( ! v ) return null;
	const s = v.replace( 'T', ' ' );
	const [ datePart = '', timePart = '00:00' ] = s.split( ' ' );
	const [ y, m, d ] = datePart.split( '-' ).map( Number );
	const [ hr, min ] = timePart.split( ':' ).map( Number );
	if ( ! y || ! m || ! d ) return null;
	return { year: y, month: m - 1, day: d, hour: hr || 0, minute: min || 0 };
}

function toValue( dt ) {
	if ( ! dt ) return '';
	const pad = n => String( n ).padStart( 2, '0' );
	return `${ dt.year }-${ pad( dt.month + 1 ) }-${ pad( dt.day ) } ${ pad( dt.hour ) }:${ pad( dt.minute ) }:00`;
}

function formatDisplay( dt ) {
	if ( ! dt ) return '';
	const pad = n => String( n ).padStart( 2, '0' );
	const ampm = dt.hour >= 12 ? 'PM' : 'AM';
	const h12  = dt.hour % 12 || 12;
	return `${ MONTHS[ dt.month ].slice( 0, 3 ) } ${ dt.day }, ${ dt.year }  ${ h12 }:${ pad( dt.minute ) } ${ ampm }`;
}

function daysInMonth( year, month ) {
	return new Date( year, month + 1, 0 ).getDate();
}

function buildCalendar( year, month ) {
	const firstDay = new Date( year, month, 1 ).getDay();
	const total    = daysInMonth( year, month );
	const cells    = [];
	for ( let i = 0; i < firstDay; i++ ) cells.push( null );
	for ( let d = 1; d <= total; d++ ) cells.push( d );
	return cells;
}

export function DateTimePicker( { label, hint, value = '', onChange } ) {
	const parsed                      = parseValue( value );
	const now                         = new Date();
	const [ open, setOpen ]           = useState( false );
	const [ viewYear, setViewYear ]   = useState( parsed?.year  ?? now.getFullYear() );
	const [ viewMonth, setViewMonth ] = useState( parsed?.month ?? now.getMonth() );
	const [ tab, setTab ]             = useState( 'date' ); // 'date' | 'time'
	const ref                         = useRef( null );

	// Close on outside click.
	useEffect( () => {
		function handler( e ) {
			if ( ref.current && ! ref.current.contains( e.target ) ) {
				setOpen( false );
			}
		}
		document.addEventListener( 'mousedown', handler );
		return () => document.removeEventListener( 'mousedown', handler );
	}, [] );

	function selectDay( day ) {
		const next = {
			year:   viewYear,
			month:  viewMonth,
			day,
			hour:   parsed?.hour   ?? 0,
			minute: parsed?.minute ?? 0,
		};
		onChange( toValue( next ) );
		setTab( 'time' ); // auto-advance to time after picking date
	}

	function setHour( h ) {
		if ( ! parsed ) return;
		onChange( toValue( { ...parsed, hour: h } ) );
	}

	function setMinute( m ) {
		if ( ! parsed ) return;
		onChange( toValue( { ...parsed, minute: m } ) );
	}

	function prevMonth() {
		if ( viewMonth === 0 ) { setViewMonth( 11 ); setViewYear( y => y - 1 ); }
		else setViewMonth( m => m - 1 );
	}
	function nextMonth() {
		if ( viewMonth === 11 ) { setViewMonth( 0 ); setViewYear( y => y + 1 ); }
		else setViewMonth( m => m + 1 );
	}

	const cells = buildCalendar( viewYear, viewMonth );
	const today = new Date();

	return (
		<div className="cm-field cm-dtp-field" ref={ ref }>
			{ label && <label className="cm-field__label">{ label }</label> }

			{/* Trigger button */}
			<button
				type="button"
				className={ `cm-dtp-trigger${ open ? ' --open' : '' }${ ! parsed ? ' --empty' : '' }` }
				onClick={ () => setOpen( o => ! o ) }
			>
				<span className="cm-dtp-trigger__icon">📅</span>
				<span className="cm-dtp-trigger__text">
					{ parsed ? formatDisplay( parsed ) : __( 'Pick a date & time…', 'boostcart' ) }
				</span>
				{ parsed && (
					<button
						type="button"
						className="cm-dtp-trigger__clear"
						onClick={ e => { e.stopPropagation(); onChange( '' ); } }
						aria-label={ __( 'Clear', 'boostcart' ) }
					>✕</button>
				) }
			</button>

			{/* Popover */}
			{ open && (
				<div className="cm-dtp-popover">
					{/* Tab bar */}
					<div className="cm-dtp-tabs">
						<button
							type="button"
							className={ `cm-dtp-tab${ tab === 'date' ? ' --active' : '' }` }
							onClick={ () => setTab( 'date' ) }
						>
							📅 { __( 'Date', 'boostcart' ) }
						</button>
						<button
							type="button"
							className={ `cm-dtp-tab${ tab === 'time' ? ' --active' : '' }${ ! parsed ? ' --disabled' : '' }` }
							onClick={ () => parsed && setTab( 'time' ) }
						>
							🕐 { __( 'Time', 'boostcart' ) }
						</button>
					</div>

					{ tab === 'date' && (
						<div className="cm-dtp-calendar">
							{/* Month nav */}
							<div className="cm-dtp-cal-nav">
								<button type="button" className="cm-dtp-nav-btn" onClick={ prevMonth }>‹</button>
								<span className="cm-dtp-cal-title">{ MONTHS[ viewMonth ] } { viewYear }</span>
								<button type="button" className="cm-dtp-nav-btn" onClick={ nextMonth }>›</button>
							</div>

							{/* Day labels */}
							<div className="cm-dtp-cal-grid">
								{ DAYS.map( d => (
									<div key={ d } className="cm-dtp-day-label">{ d }</div>
								) ) }

								{/* Day cells */}
								{ cells.map( ( day, i ) => {
									if ( ! day ) return <div key={ `e${ i }` } />;
									const isSelected = parsed && parsed.day === day && parsed.month === viewMonth && parsed.year === viewYear;
									const isToday    = today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
									return (
										<button
											key={ day }
											type="button"
											className={ `cm-dtp-day${ isSelected ? ' --selected' : '' }${ isToday ? ' --today' : '' }` }
											onClick={ () => selectDay( day ) }
										>
											{ day }
										</button>
									);
								} ) }
							</div>
						</div>
					) }

					{ tab === 'time' && parsed && (
						<div className="cm-dtp-time">
							<div className="cm-dtp-time-cols">
								{/* Hour column */}
								<div className="cm-dtp-time-col">
									<div className="cm-dtp-time-col-label">{ __( 'Hour', 'boostcart' ) }</div>
									<div className="cm-dtp-time-scroll">
										{ Array.from( { length: 24 }, ( _, h ) => (
											<button
												key={ h }
												type="button"
												className={ `cm-dtp-time-cell${ parsed.hour === h ? ' --selected' : '' }` }
												onClick={ () => setHour( h ) }
											>
												{ String( h ).padStart( 2, '0' ) }
											</button>
										) ) }
									</div>
								</div>

								<div className="cm-dtp-time-sep">:</div>

								{/* Minute column */}
								<div className="cm-dtp-time-col">
									<div className="cm-dtp-time-col-label">{ __( 'Min', 'boostcart' ) }</div>
									<div className="cm-dtp-time-scroll">
										{ [ 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 ].map( m => (
											<button
												key={ m }
												type="button"
												className={ `cm-dtp-time-cell${ parsed.minute === m ? ' --selected' : '' }` }
												onClick={ () => setMinute( m ) }
											>
												{ String( m ).padStart( 2, '0' ) }
											</button>
										) ) }
									</div>
								</div>
							</div>

							{/* AM/PM quick toggle */}
							<div className="cm-dtp-ampm">
								<button
									type="button"
									className={ `cm-dtp-ampm-btn${ parsed.hour < 12 ? ' --active' : '' }` }
									onClick={ () => parsed.hour >= 12 && setHour( parsed.hour - 12 ) }
								>AM</button>
								<button
									type="button"
									className={ `cm-dtp-ampm-btn${ parsed.hour >= 12 ? ' --active' : '' }` }
									onClick={ () => parsed.hour < 12 && setHour( parsed.hour + 12 ) }
								>PM</button>
							</div>
						</div>
					) }

					{/* Footer */}
					<div className="cm-dtp-footer">
						{ parsed && (
							<span className="cm-dtp-footer__value">{ formatDisplay( parsed ) }</span>
						) }
						<button
							type="button"
							className="cm-dtp-footer__done"
							onClick={ () => setOpen( false ) }
						>
							{ __( 'Done', 'boostcart' ) } ✓
						</button>
					</div>
				</div>
			) }

			{ hint && <p className="cm-field__hint">{ hint }</p> }
		</div>
	);
}
