/**
 * Boostcart — Cart Watcher
 * Listens for WooCommerce cart update events and refreshes CM widgets.
 */

/* global cmFrontendData, jQuery */

let isRefreshing = false;
let debounceTimer = null;

async function fetchProgress() {
	if ( isRefreshing ) return;
	isRefreshing = true;

	try {
		const res = await fetch( cmFrontendData.restUrl + 'progress', {
			headers: {
				'X-WP-Nonce': cmFrontendData.nonce,
				'Content-Type': 'application/json',
			},
		} );

		if ( ! res.ok ) return;
		const data = await res.json();
		window.dispatchEvent( new CustomEvent( 'cm:progress-updated', { detail: data } ) );
	} catch {
		// Silently ignore — widgets stay in their current state.
	} finally {
		isRefreshing = false;
	}
}

function scheduleFetch( delay = 300 ) {
	clearTimeout( debounceTimer );
	debounceTimer = setTimeout( fetchProgress, delay );
}

// ── Classic WooCommerce AJAX cart events ──────────────────────────────────
// Use a single handler to avoid duplicate fetches on page load.
let _initialFetchDone = false;

if ( typeof jQuery !== 'undefined' ) {
	// wc_fragments_loaded fires once on page load — use it as the initial trigger.
	jQuery( document ).one( 'wc_fragments_loaded wc-cart-fragments-loaded', () => {
		if ( ! _initialFetchDone ) {
			_initialFetchDone = true;
			fetchProgress();
		}
	} );

	// Subsequent AJAX cart changes.
	jQuery( document ).on(
		'wc_fragments_refreshed added_to_cart removed_from_cart cart_page_refreshed',
		() => scheduleFetch()
	);
}

// ── WooCommerce Blocks ────────────────────────────────────────────────────
document.addEventListener( 'wc-blocks_added_to_cart',     () => scheduleFetch() );
document.addEventListener( 'wc-blocks_removed_from_cart', () => scheduleFetch() );
document.addEventListener( 'wc-blocks_cart_updated',      () => scheduleFetch() );

// ── After JS injection ────────────────────────────────────────────────────
window.addEventListener( 'cm:inject-complete', () => scheduleFetch( 100 ) );

// ── Qty input observer fallback ───────────────────────────────────────────
// Only watch quantity inputs changing — not the whole cart DOM.
const qtyForms = document.querySelectorAll( '.woocommerce-cart-form' );
qtyForms.forEach( form => {
	form.addEventListener( 'change', e => {
		if ( e.target.classList.contains( 'qty' ) || e.target.name?.includes( 'qty' ) ) {
			scheduleFetch( 600 );
		}
	} );
} );

// ── Initial page load fallback if jQuery events don't fire ────────────────
document.addEventListener( 'DOMContentLoaded', () => {
	if ( ! _initialFetchDone ) {
		_initialFetchDone = true;
		fetchProgress();
	}
} );

export { fetchProgress };
