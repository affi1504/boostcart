/**
 * Boostcart — Frontend Cart Watcher
 *
 * Listens for WooCommerce cart updates and refreshes all CM widgets.
 */

/* global cmFrontendData */

const CM_NAMESPACE = 'boostcart/v1';

let isRefreshing = false;

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
		// Silently ignore network errors — widgets stay in their current state.
	} finally {
		isRefreshing = false;
	}
}

// WooCommerce AJAX cart fragment update.
jQuery( document ).on( 'updated_cart_totals wc_fragments_refreshed', () => {
	fetchProgress();
} );

// Also fetch on page load after WC cart is ready.
jQuery( document ).on( 'wc-cart-fragments-loaded', () => {
	fetchProgress();
} );

// Initial load.
document.addEventListener( 'DOMContentLoaded', () => {
	fetchProgress();
} );

export { fetchProgress };
