import React, { useState, useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from './Spinner';

/**
 * Searchable product or category picker.
 * endpoint: 'products' | 'categories'
 */
export function EntityPicker( { endpoint = 'products', value = [], onChange, placeholder } ) {
	const [ query, setQuery ]     = useState( '' );
	const [ results, setResults ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ names, setNames ]     = useState( {} ); // id → name cache
	const debounce                = useRef( null );

	// Resolve names for pre-selected IDs on mount.
	useEffect( () => {
		if ( ! value.length ) return;
		const unknown = value.filter( id => ! names[ id ] );
		if ( ! unknown.length ) return;

		const path = endpoint === 'products'
			? `/wc/v3/products?include=${ unknown.join( ',' ) }&per_page=100`
			: `/wc/v3/products/categories?include=${ unknown.join( ',' ) }&per_page=100`;

		apiFetch( { path } ).then( items => {
			const map = {};
			items.forEach( item => { map[ item.id ] = item.name; } );
			setNames( prev => ( { ...prev, ...map } ) );
		} ).catch( () => {} );
	}, [ value.join( ',' ) ] );

	function search( q ) {
		setQuery( q );
		clearTimeout( debounce.current );
		if ( ! q.trim() ) { setResults( [] ); return; }

		debounce.current = setTimeout( async () => {
			setLoading( true );
			try {
				const path = endpoint === 'products'
					? `/wc/v3/products?search=${ encodeURIComponent( q ) }&per_page=10&status=publish`
					: `/wc/v3/products/categories?search=${ encodeURIComponent( q ) }&per_page=10`;
				const items = await apiFetch( { path } );
				// Cache names.
				const map = {};
				items.forEach( i => { map[ i.id ] = i.name; } );
				setNames( prev => ( { ...prev, ...map } ) );
				setResults( items.filter( i => ! value.includes( i.id ) ) );
			} catch {
				setResults( [] );
			} finally {
				setLoading( false );
			}
		}, 300 );
	}

	function add( id ) {
		onChange( [ ...value, id ] );
		setResults( [] );
		setQuery( '' );
	}

	function remove( id ) {
		onChange( value.filter( v => v !== id ) );
	}

	return (
		<div className="cm-entity-picker">
			{ value.length > 0 && (
				<div className="cm-entity-picker__tags">
					{ value.map( id => (
						<span key={ id } className="cm-entity-tag">
							{ names[ id ] || `#${ id }` }
							<button type="button" onClick={ () => remove( id ) } aria-label={ `Remove ${ names[ id ] || id }` }>×</button>
						</span>
					) ) }
				</div>
			) }
			<div className="cm-entity-picker__search">
				<input
					type="text"
					className="cm-field__input"
					placeholder={ placeholder || ( endpoint === 'products' ? __( 'Search products…', 'boostcart' ) : __( 'Search categories…', 'boostcart' ) ) }
					value={ query }
					onChange={ e => search( e.target.value ) }
					autoComplete="off"
				/>
				{ loading && <span className="cm-entity-picker__spinner"><Spinner size="sm" /></span> }
			</div>
			{ results.length > 0 && (
				<ul className="cm-entity-picker__results">
					{ results.map( item => (
						<li key={ item.id }>
							<button type="button" onClick={ () => add( item.id ) }>
								{ item.name }
								<span className="cm-entity-picker__id">#{item.id}</span>
							</button>
						</li>
					) ) }
				</ul>
			) }
		</div>
	);
}
