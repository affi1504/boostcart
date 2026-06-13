/**
 * Boostcart — DOM Injector
 *
 * Injects progress bar containers directly into the page using CSS class
 * selectors instead of relying on WooCommerce PHP action hooks.
 * This works regardless of whether the theme overrides WooCommerce templates.
 */

/* global cmFrontendData */

const WIDGET_HTML = `<div class="cm-progress cm-progress--horizontal" data-cm-widget="horizontal">
	<div class="cm-progress__loading" aria-live="polite"><span class="cm-progress__spinner"></span></div>
	<div class="cm-progress__content" hidden>
		<div class="cm-progress__message"></div>
		<div class="cm-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
			<div class="cm-progress__fill"></div>
			<div class="cm-progress__milestones"></div>
		</div>
	</div>
</div>`;

const MINI_CART_HTML = `<div class="cm-mini-cart-widget" data-cm-widget="mini-cart" aria-live="polite">
	<div class="cm-mini-cart-widget__content"></div>
</div>`;

// Ordered list of selectors to try per location.
// First match wins. Multiple selectors handle different themes.
const INJECTION_MAP = {
	cart: [
		{ selector: '.woocommerce-cart-form',               position: 'beforebegin' },
		{ selector: '.cart-collaterals',                    position: 'beforebegin' },
		{ selector: 'form.woocommerce-cart-form',           position: 'beforebegin' },
		{ selector: '.woocommerce .cart',                   position: 'beforebegin' },
		{ selector: '#cart-page',                           position: 'afterbegin'  },
		{ selector: '.woocommerce',                         position: 'afterbegin'  },
	],
	checkout: [
		{ selector: '#order_review',                        position: 'beforebegin' },
		{ selector: '.woocommerce-checkout-review-order',   position: 'beforebegin' },
		{ selector: 'form.checkout',                        position: 'beforebegin' },
		{ selector: '.woocommerce-checkout',                position: 'afterbegin'  },
	],
	product: [
		{ selector: '.entry-summary .cart',                 position: 'beforebegin' },
		{ selector: '.woocommerce-variation-add-to-cart',   position: 'beforebegin' },
		{ selector: 'form.cart',                            position: 'beforebegin' },
		{ selector: '.entry-summary',                       position: 'afterbegin'  },
		{ selector: '.product .summary',                    position: 'afterbegin'  },
	],
	mini_cart: [
		{ selector: '.widget_shopping_cart_content',        position: 'afterbegin'  },
		{ selector: '.woocommerce-mini-cart',               position: 'beforebegin' },
		{ selector: '.cart-dropdown .cart-contents-inner',  position: 'afterbegin'  },
		{ selector: '.mini-cart .cart-inner',               position: 'afterbegin'  },
		{ selector: '.wc-block-mini-cart__drawer',          position: 'afterbegin'  },
	],
};

function alreadyInjected( selector ) {
	const container = document.querySelector( selector );
	if ( ! container ) return false;
	// Check if a CM widget is already adjacent.
	const prev = container.previousElementSibling;
	const parent = container.parentElement;
	return ( prev && prev.hasAttribute( 'data-cm-widget' ) ) ||
	       !! ( parent && parent.querySelector( '[data-cm-widget]' ) );
}

function injectWidget( locationKey, html ) {
	const targets = INJECTION_MAP[ locationKey ] || [];
	for ( const { selector, position } of targets ) {
		const el = document.querySelector( selector );
		if ( ! el ) continue;
		// Don't inject twice.
		if ( el.querySelector( '[data-cm-widget]' ) ) return true;
		if ( position === 'beforebegin' && el.previousElementSibling?.hasAttribute( 'data-cm-widget' ) ) return true;

		el.insertAdjacentHTML( position, html );
		return true;
	}
	return false;
}

function getActiveLocations() {
	return window.cmFrontendData?.locations || [ 'cart', 'checkout', 'mini_cart' ];
}

function inject() {
	const locations = getActiveLocations();

	if ( locations.includes( 'cart' ) ) {
		injectWidget( 'cart', WIDGET_HTML );
	}
	if ( locations.includes( 'checkout' ) ) {
		injectWidget( 'checkout', WIDGET_HTML );
	}
	if ( locations.includes( 'product' ) ) {
		injectWidget( 'product', WIDGET_HTML );
	}
	if ( locations.includes( 'mini_cart' ) ) {
		injectWidget( 'mini_cart', MINI_CART_HTML );
	}
}

// Run on DOMContentLoaded.
document.addEventListener( 'DOMContentLoaded', inject );

// Re-run after AJAX mini cart opens (many themes load it lazily).
document.addEventListener( 'click', ( e ) => {
	if ( e.target.closest( '.cart-icon, .mini-cart-icon, .cart-contents, [class*="cart-toggle"], [class*="mini-cart"]' ) ) {
		setTimeout( () => {
			if ( getActiveLocations().includes( 'mini_cart' ) ) {
				injectWidget( 'mini_cart', MINI_CART_HTML );
			}
			// Trigger a progress update after injection.
			window.dispatchEvent( new CustomEvent( 'cm:inject-complete' ) );
		}, 350 );
	}
} );

// Re-run when WC Blocks cart drawer opens.
document.addEventListener( 'wc-blocks_open_mini_cart_drawer', () => {
	setTimeout( () => {
		if ( getActiveLocations().includes( 'mini_cart' ) ) {
			injectWidget( 'mini_cart', MINI_CART_HTML );
		}
		window.dispatchEvent( new CustomEvent( 'cm:inject-complete' ) );
	}, 300 );
} );

export { inject };
