/**
 * Boostcart — Frontend Progress Bar Renderer
 * Handles all 5 styles, multi-trigger progress, and dynamic updates.
 */
import './styles/progress.css';

const CURRENCY_TRIGGERS = [ 'cart_value', 'category_spend', 'product_spend' ];

// ── Formatting helpers ────────────────────────────────────────────────────

function formatAmount( amount, triggerType ) {
	if ( CURRENCY_TRIGGERS.includes( triggerType ) ) {
		return formatCurrency( amount );
	}
	return Math.ceil( Math.max( 0, amount ) ).toString();
}

function formatCurrency( amount ) {
	const d     = window.cmFrontendData?.currency || {};
	const sym   = d.symbol || '₹';
	const dec   = parseInt( d.decimals ?? 2, 10 );
	const sep   = d.separator || '.';
	const thou  = d.thousand || ',';
	const num   = Number( amount ).toFixed( dec )
		.replace( '.', '@@' )
		.replace( /\B(?=(\d{3})+(?!\d))/g, thou )
		.replace( '@@', sep );
	const pos   = d.position || 'left';
	if ( pos === 'left' || pos === 'left_space' ) {
		return `${ sym }${ pos === 'left_space' ? ' ' : '' }${ num }`;
	}
	return `${ num }${ pos === 'right_space' ? ' ' : '' }${ sym }`;
}

function escHtml( str ) {
	return String( str ).replace( /[&<>"']/g, c => (
		{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ c ]
	) );
}

// ── Reward emoji ──────────────────────────────────────────────────────────

const REWARD_EMOJI = {
	free_shipping:       '🚚',
	percentage_discount: '🏷️',
	fixed_discount:      '💸',
	free_product:        '🎁',
	coupon_unlock:       '🎟️',
};
function emoji( type ) { return REWARD_EMOJI[ type ] || '🎉'; }

// ── Per-group progress computation ────────────────────────────────────────
// The campaign has multiple trigger groups (e.g. cart_value + category_qty).
// We compute per-group fill % and pick the "focus group" — the next unearned.

function getGroupProgress( progress ) {
	const groups   = progress.groups || [];
	const earned   = progress.earned_milestones || [];
	const earnedIds = new Set( earned.map( m => m.id ) );

	return groups.map( g => {
		const nextInGroup = g.next_milestone;
		const pct         = g.percent ?? 0;
		const remaining   = g.remaining ?? 0;
		const current     = g.current_value ?? 0;
		return { ...g, pct, remaining, current, nextInGroup, earnedIds };
	} );
}

// ── Build the dynamic message for the next milestone ─────────────────────

function buildMessage( progress ) {
	const next = progress.next_milestone;
	if ( ! next ) {
		return progress.all_earned ? '🎉 You\'ve unlocked all rewards!' : '';
	}
	const triggerType = next.trigger_type || 'cart_value';
	const remaining   = Math.max( 0, ( next.threshold_value || 0 ) - ( next.current_value || 0 ) );
	const template    = next.message_template || '';

	if ( template ) {
		return template
			.replace( '{remaining}', formatAmount( remaining, triggerType ) )
			.replace( '{label}',     next.label || '' )
			.replace( '{threshold}', formatAmount( next.threshold_value, triggerType ) )
			.replace( '{current}',   formatAmount( next.current_value || 0, triggerType ) )
			.replace( '{percent}',   Math.round( progress.groups?.find( g => g.trigger_type === triggerType )?.percent || 0 ) + '%' )
			.replace( '{qty_remaining}', Math.ceil( remaining ).toString() );
	}

	const amtStr = formatAmount( remaining, triggerType );
	return `Add ${ amtStr } more for ${ next.label || 'your reward' }`;
}

// ── Style: Classic Dots ───────────────────────────────────────────────────

function renderClassicDots( el, campaign ) {
	const { progress, all_milestones: milestones } = campaign;
	const groupData = getGroupProgress( progress );
	const message   = buildMessage( progress );

	// Use the focus group (first with next_milestone, or last group) for bar %
	const focusGroup = groupData.find( g => g.nextInGroup ) || groupData[ groupData.length - 1 ];
	const pct        = focusGroup ? focusGroup.pct : 0;

	let html = `<div class="cm-pw-wrap">
		<p class="cm-pw-msg">${ escHtml( message ) }</p>
		<div class="cm-pw-track-outer" style="position:relative; padding-bottom: 28px;">
			<div class="cm-pw-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${ pct }">
				<div class="cm-pw-fill" style="width:${ pct }%; transition: width 0.6s ease;"></div>`;

	// Draw milestone dots
	const earned = new Set( ( progress.earned_milestones || [] ).map( m => m.id ) );
	const allMs  = milestones || [];
	const max    = allMs.length ? Math.max( ...allMs.map( m => m.threshold_value ) ) : 1;

	allMs.forEach( ms => {
		const pos   = Math.min( 100, ( ms.threshold_value / max ) * 100 );
		const done  = earned.has( ms.id );
		const isNext = ms.id === progress.next_milestone?.id;
		const cls   = [ 'cm-pw-dot', done ? '--done' : '', isNext ? '--next' : '', ms.is_best_value ? '--best' : '' ].filter( Boolean ).join( ' ' );
		html += `<div class="${ cls }" style="left:${ pos }%" title="${ escHtml( ms.label || '' ) }">
			<span>${ done ? '✓' : emoji( ms.reward_type ) }</span>
			${ ms.is_best_value && ! done ? '<span class="cm-pw-dot__star">⭐</span>' : '' }
		</div>`;
	} );

	html += `</div></div>
		<div class="cm-pw-labels" style="position:relative; height:20px;">`;

	allMs.forEach( ms => {
		const pos  = Math.min( 100, ( ms.threshold_value / max ) * 100 );
		const done = earned.has( ms.id );
		const triggerType = ms.trigger_type || 'cart_value';
		html += `<span class="cm-pw-label${ done ? ' --done' : '' }" style="left:${ pos }%">${ escHtml( ms.label ) }</span>`;
	} );

	html += `</div></div></div>`;
	el.querySelector( '.cm-progress__content' ).innerHTML = html;
}

// ── Style: Segment Tiles ──────────────────────────────────────────────────

function renderSegmentTiles( el, campaign ) {
	const { progress, all_milestones: milestones } = campaign;
	const message = buildMessage( progress );
	const earned  = new Set( ( progress.earned_milestones || [] ).map( m => m.id ) );
	const allMs   = milestones || [];

	let html = `<p class="cm-pw-msg">${ escHtml( message ) }</p><div class="cm-pw-tiles">`;

	allMs.forEach( ( ms, i ) => {
		const prev     = i === 0 ? 0 : allMs[ i - 1 ].threshold_value;
		const range    = ms.threshold_value - prev;
		const current  = ms.current_value || 0;
		const into     = Math.max( 0, Math.min( range, current - prev ) );
		const tilePct  = range > 0 ? ( into / range ) * 100 : 0;
		const done     = earned.has( ms.id );
		const isNext   = ms.id === progress.next_milestone?.id;

		html += `<div class="cm-pw-tile${ done ? ' --done' : '' }${ ms.is_best_value ? ' --best' : '' }">
			<div class="cm-pw-tile-track"><div class="cm-pw-tile-fill" style="width:${ done ? 100 : tilePct }%; transition:width 0.6s ease;"></div></div>
			<div class="cm-pw-tile-icon">${ done ? '✅' : emoji( ms.reward_type ) }</div>
			<div class="cm-pw-tile-label">${ escHtml( ms.label ) }${ ms.is_best_value ? ' ⭐' : '' }</div>
		</div>`;
	} );

	html += `</div>`;
	el.querySelector( '.cm-progress__content' ).innerHTML = html;
}

// ── Style: Bold Steps ─────────────────────────────────────────────────────

function renderBoldSteps( el, campaign ) {
	const { progress, all_milestones: milestones } = campaign;
	const message = buildMessage( progress );
	const earned  = new Set( ( progress.earned_milestones || [] ).map( m => m.id ) );
	const allMs   = milestones || [];
	const groupData = getGroupProgress( progress );
	const focusGroup = groupData.find( g => g.nextInGroup ) || groupData[ groupData.length - 1 ];
	const pct = focusGroup ? focusGroup.pct : 0;
	const max = allMs.length ? Math.max( ...allMs.map( m => m.threshold_value ) ) : 1;

	let badges = '';
	allMs.forEach( ms => {
		const pos    = Math.min( 100, ( ms.threshold_value / max ) * 100 );
		const done   = earned.has( ms.id );
		const isNext = ms.id === progress.next_milestone?.id;
		badges += `<div class="cm-pw-badge-wrap" style="left:${ pos }%">
			<div class="cm-pw-badge${ done ? ' --done' : '' }${ isNext ? ' --next' : '' }${ ms.is_best_value ? ' --best' : '' }">
				${ emoji( ms.reward_type ) } ${ escHtml( ms.label ) }${ ms.is_best_value ? ' ⭐' : '' }
			</div></div>`;
	} );

	el.querySelector( '.cm-progress__content' ).innerHTML = `
		<p class="cm-pw-msg">${ escHtml( message ) }</p>
		<div class="cm-pw-bold-wrap">
			<div class="cm-pw-bold-badges">${ badges }</div>
			<div class="cm-pw-track cm-pw-track--bold" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${ pct }">
				<div class="cm-pw-fill" style="width:${ pct }%; transition:width 0.6s ease;"></div>
			</div>
			<div class="cm-pw-ends"><span>🛒 ${ formatCurrency( focusGroup?.current || 0 ) }</span><span>${ formatCurrency( max ) }</span></div>
		</div>`;
}

// ── Style: Minimal Strip ──────────────────────────────────────────────────

function renderMinimal( el, campaign ) {
	const { progress, all_milestones: milestones } = campaign;
	const message = buildMessage( progress );
	const groupData = getGroupProgress( progress );
	const focusGroup = groupData.find( g => g.nextInGroup ) || groupData[ 0 ];
	const pct = focusGroup ? focusGroup.pct : 0;
	const next = progress.next_milestone;

	el.querySelector( '.cm-progress__content' ).innerHTML = `
		<div class="cm-pw-strip">
			<span class="cm-pw-strip__icon">🛒</span>
			<div class="cm-pw-track cm-pw-track--strip" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${ pct }">
				<div class="cm-pw-fill" style="width:${ pct }%; transition:width 0.6s ease;"></div>
			</div>
			<span class="cm-pw-strip__next">${ next ? emoji( next.reward_type ) : '🎉' }</span>
		</div>
		<p class="cm-pw-msg" style="margin:6px 0 0; font-size:12px;">${ escHtml( message ) }</p>`;
}

// ── Style: Progressive Reveal ─────────────────────────────────────────────

function renderReveal( el, campaign ) {
	const { progress, all_milestones: milestones } = campaign;
	const earned  = new Set( ( progress.earned_milestones || [] ).map( m => m.id ) );
	const allMs   = milestones || [];
	const next    = progress.next_milestone;
	const locked  = allMs.filter( ms => ! earned.has( ms.id ) && ms.id !== next?.id );

	// Segment progress for the active milestone.
	const prevMs      = allMs.filter( ms => earned.has( ms.id ) );
	const segStart    = prevMs.length ? prevMs[ prevMs.length - 1 ].threshold_value : 0;
	const segEnd      = next ? next.threshold_value : 0;
	const segCurrent  = next ? ( next.current_value || 0 ) : 0;
	const segPct      = segEnd > segStart ? Math.min( 100, ( ( segCurrent - segStart ) / ( segEnd - segStart ) ) * 100 ) : ( next ? 0 : 100 );

	const triggerType = next?.trigger_type || 'cart_value';
	const remaining   = next ? Math.max( 0, next.threshold_value - ( next.current_value || 0 ) ) : 0;

	let earnedHtml = prevMs.map( ms => `<div class="cm-pw-rev-earned"><span>${ emoji( ms.reward_type ) } ${ escHtml( ms.label ) }</span><span>✅</span></div>` ).join( '' );

	let activeHtml = '';
	if ( next ) {
		activeHtml = `<div class="cm-pw-rev-card">
			<div class="cm-pw-rev-header">
				<div class="cm-pw-rev-emoji">${ emoji( next.reward_type ) }</div>
				<div class="cm-pw-rev-info">
					<div class="cm-pw-rev-label">${ escHtml( next.label ) }${ next.is_best_value ? ' ⭐' : '' }</div>
					<div class="cm-pw-rev-sub">${ formatAmount( segCurrent, triggerType ) } / ${ formatAmount( next.threshold_value, triggerType ) }</div>
				</div>
				<div class="cm-pw-rev-pct">${ Math.round( segPct ) }%</div>
			</div>
			<div class="cm-pw-track" style="height:8px; border-radius:100px;" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${ segPct }">
				<div class="cm-pw-fill" style="width:${ segPct }%; transition:width 0.6s ease; background:linear-gradient(90deg,#171717,#0070f3);"></div>
			</div>
			<div class="cm-pw-rev-remaining">Add <strong>${ formatAmount( remaining, triggerType ) }</strong> more to unlock</div>
		</div>`;
	}

	let lockedHtml = locked.map( ( ms, i ) => `<div class="cm-pw-rev-locked">🔒 <span>${ i === 0 && next ? `Unlocks after "${ escHtml( next.label ) }"` : 'Locked' }</span></div>` ).join( '' );

	let allDoneHtml = ! next ? `<div class="cm-pw-rev-done">🎉 <strong>All rewards unlocked!</strong></div>` : '';

	el.querySelector( '.cm-progress__content' ).innerHTML = earnedHtml + activeHtml + lockedHtml + allDoneHtml;
}

// ── Style dispatcher ──────────────────────────────────────────────────────

const STYLE_RENDERERS = {
	classic:  renderClassicDots,
	tiles:    renderSegmentTiles,
	bold:     renderBoldSteps,
	minimal:  renderMinimal,
	reveal:   renderReveal,
};

function getStyle() {
	return window.cmFrontendData?.progressStyle || 'classic';
}

function renderWidget( el, campaigns ) {
	const campaign = getCampaignForWidget( el, campaigns );
	const loading  = el.querySelector( '.cm-progress__loading' );
	const content  = el.querySelector( '.cm-progress__content' );

	if ( ! campaign ) {
		el.hidden = true;
		return;
	}

	if ( loading ) loading.hidden = true;
	if ( content ) content.hidden = false;
	el.hidden = false;

	const style    = el.dataset.style || getStyle();
	const renderer = STYLE_RENDERERS[ style ] || renderClassicDots;
	renderer( el, campaign );
}

function getCampaignForWidget( el, campaigns ) {
	const cid = el.dataset.campaignId ? parseInt( el.dataset.campaignId, 10 ) : null;
	if ( cid ) return campaigns.find( c => c.campaign_id === cid ) || null;
	return campaigns[ 0 ] || null;
}

// ── Event listeners ───────────────────────────────────────────────────────

window.addEventListener( 'cm:progress-updated', e => {
	const campaigns = e.detail || [];
	document.querySelectorAll( '[data-cm-widget="horizontal"], [data-cm-widget="vertical"]' ).forEach( el => {
		renderWidget( el, campaigns );
	} );
} );
