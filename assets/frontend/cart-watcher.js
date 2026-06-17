/**
 * Boostcart — Cart Watcher
 * Listens for all WooCommerce cart update events (classic AJAX + Blocks)
 * and refreshes all CM widgets.
 */

/* global cmFrontendData, jQuery */

let isRefreshing = false;
let debounceTimer = null;

async function fetchProgress() {
	if ( isRefreshing ) return;
	isRefreshing = true;
	console.log( '[Boostcart] fetchProgress triggered' );

	try {
		const res = await fetch( cmFrontendData.restUrl + 'progress', {
			headers: {
				'X-WP-Nonce': cmFrontendData.nonce,
				'Content-Type': 'application/json',
			},
		} );

		console.log( '[Boostcart] progress response status:', res.status );
		if ( ! res.ok ) {
			console.warn( '[Boostcart] progress response not ok:', res.status );
			return;
		}
		const data = await res.json();
		console.log( '[Boostcart] progress data:', JSON.stringify( data, null, 2 ) );
		window.dispatchEvent( new CustomEvent( 'cm:progress-updated', { detail: data } ) );
	} catch ( err ) {
		console.error( '[Boostcart] fetchProgress error:', err );
	} finally {
		isRefreshing = false;
	}
}

// Debounce so rapid successive events don't fire multiple fetches.
function scheduleFetch( delay = 300 ) {
	clearTimeout( debounceTimer );
	debounceTimer = setTimeout( fetchProgress, delay );
}

// ── Classic WooCommerce AJAX cart events ──────────────────────────────────
if ( typeof jQuery !== 'undefined' ) {
	const cartEvents = [
		'wc_fragments_refreshed',
		'wc-cart-fragments-loaded',
		'added_to_cart',
		'removed_from_cart',
		'cart_page_refreshed',
		'woocommerce_cart_updated',
	];
	jQuery( document ).on( cartEvents.join( ' ' ), ( e ) => {
		console.log( '[Boostcart] jQuery cart event fired:', e.type );
		scheduleFetch();
	} );

	jQuery( document ).on( 'wc_fragments_loaded', () => {
		console.log( '[Boostcart] wc_fragments_loaded fired' );
		scheduleFetch( 100 );
	} );
}

// ── WooCommerce Blocks (store-api / checkout block) ───────────────────────
// The Blocks cart fires custom DOM events instead of jQuery events.
document.addEventListener( 'wc-blocks_added_to_cart',     () => scheduleFetch() );
document.addEventListener( 'wc-blocks_removed_from_cart', () => scheduleFetch() );
document.addEventListener( 'wc-blocks_cart_updated',      () => scheduleFetch() );

// ── MutationObserver fallback ─────────────────────────────────────────────
// Only observe quantity inputs, not the whole cart — watching .cart_totals
// fires on every WC recalculation creating an infinite loop.
const qtyForms = document.querySelectorAll( '.woocommerce-cart-form' );
qtyForms.forEach( form => {
	const observer = new MutationObserver( ( mutations ) => {
		// Only react to actual qty input value changes, not style/class updates.
		const relevant = mutations.some( m =>
			m.type === 'childList' && m.addedNodes.length > 0
		);
		if ( relevant ) scheduleFetch( 800 );
	} );
	observer.observe( form, { childList: true, subtree: false } );
} );

// ── After JS injection, immediately fetch progress ────────────────────────
window.addEventListener( 'cm:inject-complete', () => scheduleFetch( 100 ) );

export { fetchProgress };
