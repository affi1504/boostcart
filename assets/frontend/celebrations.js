/**
 * Boostcart — Celebrations (confetti, toast, fireworks)
 *
 * Deduplication: uses sessionStorage + a flag set by the PHP layer via
 * the cm:progress-updated event's `celebrations` key.
 */
import './styles/celebrations.css';

const STORAGE_KEY = 'cm_celebrated';

function getStorageCelebrated() {
	try {
		return JSON.parse( sessionStorage.getItem( STORAGE_KEY ) || '[]' );
	} catch {
		return [];
	}
}

function markStorageCelebrated( key ) {
	try {
		const existing = getStorageCelebrated();
		if ( ! existing.includes( key ) ) {
			existing.push( key );
			sessionStorage.setItem( STORAGE_KEY, JSON.stringify( existing ) );
		}
	} catch {
		// sessionStorage blocked — skip.
	}
}

function hasCelebrated( milestoneId, cartHash ) {
	const key = `${ milestoneId }_${ cartHash }`;
	return getStorageCelebrated().includes( key );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function showToast( label ) {
	const toast = document.createElement( 'div' );
	toast.className          = 'cm-toast';
	toast.setAttribute( 'role', 'status' );
	toast.setAttribute( 'aria-live', 'polite' );
	toast.innerHTML = `<span class="cm-toast__icon" aria-hidden="true">🎉</span><span class="cm-toast__label">${ escHtml( label ) }</span>`;
	document.body.appendChild( toast );

	requestAnimationFrame( () => {
		requestAnimationFrame( () => {
			toast.classList.add( 'cm-toast--visible' );
		} );
	} );

	setTimeout( () => {
		toast.classList.remove( 'cm-toast--visible' );
		toast.addEventListener( 'transitionend', () => toast.remove(), { once: true } );
	}, 3500 );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function showConfetti() {
	const COLORS  = [ '#007cf0', '#7928ca', '#ff0080', '#ff4d4d', '#50e3c2', '#f9cb28' ];
	const COUNT   = 80;
	const canvas  = document.createElement( 'canvas' );
	canvas.className = 'cm-confetti-canvas';
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;
	document.body.appendChild( canvas );

	const ctx      = canvas.getContext( '2d' );
	const pieces   = Array.from( { length: COUNT }, () => ( {
		x:    Math.random() * canvas.width,
		y:    Math.random() * canvas.height - canvas.height,
		w:    6 + Math.random() * 6,
		h:    8 + Math.random() * 10,
		color: COLORS[ Math.floor( Math.random() * COLORS.length ) ],
		vy:   2 + Math.random() * 4,
		vx:   ( Math.random() - 0.5 ) * 3,
		rot:  Math.random() * 360,
		rv:   ( Math.random() - 0.5 ) * 6,
	} ) );

	let frame = 0;
	function draw() {
		ctx.clearRect( 0, 0, canvas.width, canvas.height );
		pieces.forEach( p => {
			ctx.save();
			ctx.translate( p.x + p.w / 2, p.y + p.h / 2 );
			ctx.rotate( ( p.rot * Math.PI ) / 180 );
			ctx.fillStyle = p.color;
			ctx.fillRect( -p.w / 2, -p.h / 2, p.w, p.h );
			ctx.restore();
			p.y   += p.vy;
			p.x   += p.vx;
			p.rot += p.rv;
		} );

		frame++;
		if ( frame < 120 ) {
			requestAnimationFrame( draw );
		} else {
			canvas.remove();
		}
	}

	requestAnimationFrame( draw );
}

// ─── Main handler ─────────────────────────────────────────────────────────────

function triggerCelebrations( celebrations, cartHash ) {
	celebrations.forEach( cel => {
		const storageKey = `${ cel.milestone_id }_${ cartHash }`;
		if ( hasCelebrated( cel.milestone_id, cartHash ) ) return;

		markStorageCelebrated( storageKey );

		const types = cel.types || [ 'confetti', 'toast' ];

		if ( types.includes( 'toast' ) ) {
			showToast( cel.label );
		}
		if ( types.includes( 'confetti' ) ) {
			showConfetti();
		}
		// Fireworks — hook for future implementation or 3rd-party library.
		if ( types.includes( 'fireworks' ) ) {
			document.dispatchEvent( new CustomEvent( 'cm:fireworks', { detail: cel } ) );
		}
	} );
}

function escHtml( str ) {
	return str.replace( /[&<>"']/g, m => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } )[ m ] );
}

window.addEventListener( 'cm:progress-updated', e => {
	const campaigns = e.detail || [];
	if ( ! campaigns.length ) return;

	// Compute current cart hash from first campaign's first earned milestone id array.
	const earnedIds = campaigns.flatMap( c => ( c.progress.earned_milestones || [] ).map( m => m.id ) );
	const cartHash  = earnedIds.sort().join( '_' ) || 'empty';

	campaigns.forEach( campaign => {
		const earned = campaign.progress.earned_milestones || [];
		const cels   = earned.map( ms => ( {
			milestone_id: ms.id,
			label:        ms.label || campaign.campaign_name,
			types:        window.cmFrontendData?.celebrations || [ 'confetti', 'toast' ],
		} ) );

		if ( cels.length ) {
			triggerCelebrations( cels, cartHash );
		}
	} );
} );
