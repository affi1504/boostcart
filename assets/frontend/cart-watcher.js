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
		// Network errors — widgets stay in current state.
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
	jQuery( document ).on(
		'wc_fragments_refreshed'    + ' ' +  // Cart fragments reloaded after AJAX
		'wc-cart-fragments-loaded'  + ' ' +  // Fragments loaded on page load
		'added_to_cart'             + ' ' +  // Product added via AJAX
		'removed_from_cart'         + ' ' +  // Product removed via AJAX
		'cart_page_refreshed'       + ' ' +  // WooCommerce Blocks cart page refresh
		'woocommerce_cart_updated',           // Any cart change
		() => scheduleFetch()
	);

	// Mini cart opened/refreshed.
	jQuery( document ).on( 'wc_fragments_loaded', () => scheduleFetch( 100 ) );
}

// ── WooCommerce Blocks (store-api / checkout block) ───────────────────────
// The Blocks cart fires custom DOM events instead of jQuery events.
document.addEventListener( 'wc-blocks_added_to_cart',     () => scheduleFetch() );
document.addEventListener( 'wc-blocks_removed_from_cart', () => scheduleFetch() );
document.addEventListener( 'wc-blocks_cart_updated',      () => scheduleFetch() );

// ── MutationObserver fallback ─────────────────────────────────────────────
// For headless/custom carts that don't fire standard WC events, watch for
// DOM changes inside the WC cart container.
const cartSelector = '.woocommerce-cart-form, .wp-block-woocommerce-cart, .cart_totals';
const cartRoot     = document.querySelector( cartSelector );
if ( cartRoot ) {
	const observer = new MutationObserver( () => scheduleFetch( 500 ) );
	observer.observe( cartRoot, { childList: true, subtree: true, attributes: true, attributeFilter: [ 'class', 'data-block-name' ] } );
}

// ── After JS injection, immediately fetch progress ────────────────────────
window.addEventListener( 'cm:inject-complete', () => scheduleFetch( 100 ) );

export { fetchProgress };
