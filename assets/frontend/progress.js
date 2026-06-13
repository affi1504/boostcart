/**
 * Boostcart — Progress Bars (horizontal + vertical)
 */

const HORIZONTAL_SELECTOR = '[data-cm-widget="horizontal"]';
const VERTICAL_SELECTOR   = '[data-cm-widget="vertical"]';

function formatCurrency( amount ) {
	// Use WooCommerce price format if available.
	return new Intl.NumberFormat( document.documentElement.lang || 'en', {
		style: 'currency',
		currency: window.cmFrontendData?.currency?.code || 'USD',
		minimumFractionDigits: 2,
	} ).format( amount );
}

function renderHorizontal( el, campaigns ) {
	const campaign = getCampaignForWidget( el, campaigns );
	if ( ! campaign ) {
		el.hidden = true;
		return;
	}

	const { progress, message, all_milestones: milestones } = campaign;
	const content  = el.querySelector( '.cm-progress__content' );
	const loading  = el.querySelector( '.cm-progress__loading' );
	const msgEl    = el.querySelector( '.cm-progress__message' );
	const fill     = el.querySelector( '.cm-progress__fill' );
	const track    = el.querySelector( '.cm-progress__track' );
	const mstsEl   = el.querySelector( '.cm-progress__milestones' );

	loading.hidden  = true;
	content.hidden  = false;
	el.hidden       = false;

	msgEl.textContent = message;

	// Progress fill.
	const pct = Math.min( 100, Math.max( 0, progress.percent || 0 ) );
	fill.style.width = `${ pct }%`;
	track.setAttribute( 'aria-valuenow', pct );

	// Milestone dots.
	mstsEl.innerHTML = '';
	const max = milestones[ milestones.length - 1 ]?.threshold_value || 1;
	milestones.forEach( ms => {
		const pos     = ( ms.threshold_value / max ) * 100;
		const earned  = progress.earned_milestones.some( e => e.id === ms.id );
		const dot     = document.createElement( 'div' );
		dot.className = `cm-milestone-dot${ earned ? ' cm-milestone-dot--earned' : '' }${ ms.is_best_value ? ' cm-milestone-dot--best-value' : '' }`;
		dot.style.left = `${ pos }%`;
		dot.title      = ms.label || '';

		if ( ms.is_best_value ) {
			const star = document.createElement( 'span' );
			star.textContent = '⭐';
			star.className   = 'cm-milestone-dot__star';
			dot.appendChild( star );
		}

		mstsEl.appendChild( dot );
	} );
}

function renderVertical( el, campaigns ) {
	const campaign = getCampaignForWidget( el, campaigns );
	if ( ! campaign ) {
		el.hidden = true;
		return;
	}

	const { progress, message, all_milestones: milestones } = campaign;
	const content = el.querySelector( '.cm-progress__content' );
	const loading = el.querySelector( '.cm-progress__loading' );
	const msgEl   = el.querySelector( '.cm-progress__message' );
	const list    = el.querySelector( '.cm-progress__list' );

	loading.hidden = true;
	content.hidden = false;
	el.hidden      = false;

	msgEl.textContent = message;
	list.innerHTML    = '';

	milestones.forEach( ms => {
		const earned = progress.earned_milestones.some( e => e.id === ms.id );
		const li     = document.createElement( 'li' );
		li.className = `cm-milestone-item${ earned ? ' cm-milestone-item--earned' : '' }${ ms.is_best_value ? ' cm-milestone-item--best-value' : '' }`;
		li.innerHTML = `
			<span class="cm-milestone-item__icon" aria-hidden="true">${ earned ? '✓' : '○' }</span>
			<span class="cm-milestone-item__label">${ escHtml( ms.label || '' ) }</span>
			<span class="cm-milestone-item__threshold">${ formatCurrency( ms.threshold_value ) }</span>
			${ ms.is_best_value ? '<span class="cm-milestone-item__best-value" aria-label="Best value">⭐</span>' : '' }
		`;
		list.appendChild( li );
	} );
}

function getCampaignForWidget( el, campaigns ) {
	const cid = el.dataset.campaignId ? parseInt( el.dataset.campaignId, 10 ) : null;
	if ( cid ) {
		return campaigns.find( c => c.campaign_id === cid ) || null;
	}
	return campaigns[ 0 ] || null;
}

function escHtml( str ) {
	return str.replace( /[&<>"']/g, m => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } )[ m ] );
}

window.addEventListener( 'cm:progress-updated', e => {
	const campaigns = e.detail || [];

	document.querySelectorAll( HORIZONTAL_SELECTOR ).forEach( el => renderHorizontal( el, campaigns ) );
	document.querySelectorAll( VERTICAL_SELECTOR ).forEach( el => renderVertical( el, campaigns ) );
} );
