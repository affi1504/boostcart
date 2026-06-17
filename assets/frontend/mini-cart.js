/**
 * Boostcart — Mini Cart Widget
 * Uses the same style system as the main progress bar.
 */
import './styles/mini-cart.css';

const CURRENCY_TRIGGERS = [ 'cart_value', 'category_spend', 'product_spend' ];

function formatAmount( amount, triggerType ) {
	if ( CURRENCY_TRIGGERS.includes( triggerType ) ) {
		const d   = window.cmFrontendData?.currency || {};
		const sym = d.symbol || '₹';
		const dec = parseInt( d.decimals ?? 2, 10 );
		return `${ sym }${ Number( amount ).toFixed( dec ) }`;
	}
	return Math.ceil( Math.max( 0, amount ) ).toString();
}

function buildMessage( progress ) {
	const next = progress.next_milestone;
	if ( ! next ) return progress.all_earned ? '🎉 All rewards unlocked!' : '';
	const triggerType = next.trigger_type || 'cart_value';
	const remaining   = Math.max( 0, ( next.threshold_value || 0 ) - ( next.current_value || 0 ) );
	const template    = next.message_template || '';
	if ( template ) {
		return template
			.replace( '{remaining}', formatAmount( remaining, triggerType ) )
			.replace( '{label}',     next.label || '' )
			.replace( '{qty_remaining}', Math.ceil( remaining ).toString() );
	}
	return `Add ${ formatAmount( remaining, triggerType ) } more for ${ next.label || 'your reward' }`;
}

function getGroupPct( progress ) {
	const groups     = progress.groups || [];
	const focusGroup = groups.find( g => g.next_milestone ) || groups[ groups.length - 1 ];
	return focusGroup ? ( focusGroup.percent ?? 0 ) : 0;
}

function escHtml( str ) {
	return String( str ).replace( /[&<>"']/g, c => (
		{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ c ]
	) );
}

function renderMiniCart( campaigns ) {
	const widgets = document.querySelectorAll( '[data-cm-widget="mini-cart"]' );
	if ( ! widgets.length ) return;

	const campaign = campaigns && campaigns[ 0 ];

	widgets.forEach( widget => {
		const content = widget.querySelector( '.cm-mini-cart-widget__content' );
		if ( ! content ) return;

		if ( ! campaign ) {
			widget.hidden = true;
			return;
		}

		widget.hidden = false;
		const { progress } = campaign;
		const message  = buildMessage( progress );
		const pct      = getGroupPct( progress );
		const next     = progress.next_milestone;
		const REWARD_EMOJI = {
			free_shipping: '🚚', percentage_discount: '🏷️',
			fixed_discount: '💸', free_product: '🎁', coupon_unlock: '🎟️',
		};
		const emo = next ? ( REWARD_EMOJI[ next.reward_type ] || '🎉' ) : '🎉';

		content.innerHTML = `
			<div class="cm-mc-row">
				<span class="cm-mc-emoji">${ emo }</span>
				<div class="cm-mc-bar-wrap">
					<div class="cm-mc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${ pct }">
						<div class="cm-mc-fill" style="width:${ pct }%; transition:width 0.5s ease;"></div>
					</div>
				</div>
			</div>
			<p class="cm-mc-msg">${ escHtml( message ) }</p>`;
	} );
}

window.addEventListener( 'cm:progress-updated', e => {
	renderMiniCart( e.detail || [] );
} );
