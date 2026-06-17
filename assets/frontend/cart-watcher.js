/**
 * Boostcart — Cart Watcher
 * Uses pre-rendered server data first, then keeps in sync via AJAX events.
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

/**
 * Read pre-rendered JSON embedded by PHP (FrontendRenderer) and dispatch
 * the progress-updated event immediately — zero network round-trip.
 */
function hydrateFromPreload() {
	const scripts = document.querySelectorAll( 'script.cm-progress-preload-data' );
	if ( ! scripts.length ) return false;

	let data = null;
	scripts.forEach( script => {
		try {
			const parsed = JSON.parse( script.textContent );
			if ( Array.isArray( parsed ) && parsed.length ) {
				data = parsed;
			}
		} catch { /* malformed JSON — skip */ }
	} );

	if ( data ) {
		window.dispatchEvent( new CustomEvent( 'cm:progress-updated', { detail: data } ) );
		return true;
	}
	return false;
}

// ── On page load: hydrate instantly from pre-rendered data ────────────────
const hydrated = hydrateFromPreload();
if ( ! hydrated ) {
	scheduleFetch( 0 );
}

// ── Cart update events ────────────────────────────────────────────────────
let _initialFetchDone = hydrated;

if ( typeof jQuery !== 'undefined' ) {
	jQuery( document ).one( 'wc_fragments_loaded wc-cart-fragments-loaded', () => {
		if ( ! _initialFetchDone ) {
			_initialFetchDone = true;
			fetchProgress();
		}
	} );

	jQuery( document ).on(
		'wc_fragments_refreshed added_to_cart removed_from_cart cart_page_refreshed',
		() => scheduleFetch()
	);
}

document.addEventListener( 'wc-blocks_added_to_cart',     () => scheduleFetch() );
document.addEventListener( 'wc-blocks_removed_from_cart', () => scheduleFetch() );
document.addEventListener( 'wc-blocks_cart_updated',      () => scheduleFetch() );

window.addEventListener( 'cm:inject-complete', () => {
	if ( ! hydrateFromPreload() ) {
		scheduleFetch( 100 );
	}
} );

const qtyForms = document.querySelectorAll( '.woocommerce-cart-form' );
qtyForms.forEach( form => {
	form.addEventListener( 'change', e => {
		if ( e.target.classList.contains( 'qty' ) || e.target.name?.includes( 'qty' ) ) {
			scheduleFetch( 600 );
		}
	} );
} );

export { fetchProgress };
