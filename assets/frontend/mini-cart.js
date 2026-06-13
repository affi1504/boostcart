/**
 * Boostcart — Mini Cart Widget
 */
import './styles/mini-cart.css';

const MINI_CART_SELECTOR = '[data-cm-widget="mini-cart"]';

function renderMiniCart( campaigns ) {
	const widgets = document.querySelectorAll( MINI_CART_SELECTOR );
	if ( ! widgets.length ) return;

	const campaign = campaigns && campaigns[ 0 ];

	widgets.forEach( widget => {
		const content = widget.querySelector( '.cm-mini-cart-widget__content' );
		if ( ! content ) return;

		if ( ! campaign ) {
			widget.hidden = true;
			return;
		}

		widget.hidden  = false;
		const { progress, message } = campaign;
		const pct = Math.min( 100, Math.max( 0, progress.percent || 0 ) );

		content.innerHTML = `
			<p class="cm-mini-cart-widget__message">${ escHtml( message ) }</p>
			<div class="cm-mini-cart-widget__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${ pct }">
				<div class="cm-mini-cart-widget__fill" style="width:${ pct }%"></div>
			</div>
		`;
	} );
}

function escHtml( str ) {
	return str.replace( /[&<>"']/g, m => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } )[ m ] );
}

window.addEventListener( 'cm:progress-updated', e => {
	renderMiniCart( e.detail || [] );
} );
