/**
 * Boostcart — Floating Widget
 */

const WIDGET_ID = 'cm-floating-widget';

function renderFloating( campaigns ) {
	const widget = document.getElementById( WIDGET_ID );
	if ( ! widget ) return;

	if ( ! campaigns || campaigns.length === 0 ) {
		widget.hidden = true;
		return;
	}

	const campaign = campaigns[ 0 ];
	const { progress, message } = campaign;

	widget.hidden = false;

	const label = widget.querySelector( '.cm-floating-widget__label' );
	if ( label ) {
		label.textContent = message || '';
	}

	const toggle = widget.querySelector( '.cm-floating-widget__toggle' );
	const panel  = widget.querySelector( '.cm-floating-widget__panel' );

	// Build panel content.
	const content = widget.querySelector( '.cm-floating-widget__content' );
	if ( content ) {
		const milestones  = campaign.all_milestones || [];
		const earned_ids  = ( progress.earned_milestones || [] ).map( m => m.id );

		content.innerHTML = milestones.map( ms => {
			const earned = earned_ids.includes( ms.id );
			return `<div class="cm-fw-milestone${ earned ? ' cm-fw-milestone--earned' : '' }${ ms.is_best_value ? ' cm-fw-milestone--best-value' : '' }">
				<span class="cm-fw-milestone__icon" aria-hidden="true">${ earned ? '✅' : '🎯' }</span>
				<span class="cm-fw-milestone__label">${ escHtml( ms.label || '' ) }</span>
			</div>`;
		} ).join( '' );
	}

	// Toggle panel on click.
	if ( toggle && panel && ! toggle.dataset.cmBound ) {
		toggle.dataset.cmBound = '1';
		toggle.addEventListener( 'click', () => {
			const isOpen = toggle.getAttribute( 'aria-expanded' ) === 'true';
			toggle.setAttribute( 'aria-expanded', String( ! isOpen ) );
			panel.hidden = isOpen;
		} );

		// Close on Escape.
		document.addEventListener( 'keydown', e => {
			if ( e.key === 'Escape' && ! panel.hidden ) {
				panel.hidden = true;
				toggle.setAttribute( 'aria-expanded', 'false' );
				toggle.focus();
			}
		} );
	}
}

function escHtml( str ) {
	return str.replace( /[&<>"']/g, m => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } )[ m ] );
}

window.addEventListener( 'cm:progress-updated', e => {
	renderFloating( e.detail || [] );
} );
