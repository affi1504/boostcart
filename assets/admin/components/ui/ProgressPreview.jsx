import React from 'react';
import { __ } from '@wordpress/i18n';

const MOCK_MILESTONES = [
	{ id: 1, threshold_value: 499,  label: 'Free Shipping', reward_type: 'free_shipping',       is_best_value: false },
	{ id: 2, threshold_value: 999,  label: '10% OFF',       reward_type: 'percentage_discount', is_best_value: true  },
	{ id: 3, threshold_value: 1999, label: '20% OFF',       reward_type: 'percentage_discount', is_best_value: false },
];
const MOCK_CART     = 720;
const MOCK_CURRENCY = '₹';

function fmt( v ) { return `${ MOCK_CURRENCY }${ Number( v ).toFixed( 0 ) }`; }

const REWARD_EMOJI = {
	free_shipping:       '🚚',
	percentage_discount: '🏷️',
	fixed_discount:      '💸',
	free_product:        '🎁',
	coupon_unlock:       '🎟️',
};

function getEmoji( type ) { return REWARD_EMOJI[ type ] || '🎉'; }

function computeProgress( milestones, cartValue ) {
	const sorted = [ ...milestones ].sort( ( a, b ) => a.threshold_value - b.threshold_value );
	const earned = sorted.filter( m => cartValue >= m.threshold_value );
	const next   = sorted.find( m => cartValue < m.threshold_value ) || null;
	const max    = sorted[ sorted.length - 1 ]?.threshold_value || 1;
	const pct    = Math.min( 100, ( cartValue / max ) * 100 );
	return { sorted, earned, next, pct, max };
}

// ─────────────────────────────────────────────────────────────────────────────
// Style 1 — Classic Dots
// Clean track + circular milestone icons floating above dots
// ─────────────────────────────────────────────────────────────────────────────
function ClassicDots( { milestones, cartValue, colors, animated } ) {
	const { sorted, next, pct, max } = computeProgress( milestones, cartValue );

	return (
		<div style={ { padding: '4px 8px 0' } }>
			{ /* Message */ }
			<div style={ { marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 } }>
				<span style={ { fontSize: 22 } }>{ next ? getEmoji( next.reward_type ) : '🎉' }</span>
				<span style={ { fontSize: 13, color: colors.text, lineHeight: 1.4 } }>
					{ next
						? <><strong style={ { color: colors.bar } }>{ fmt( next.threshold_value - cartValue ) }</strong> more for <strong>{ next.label }</strong></>
						: <strong style={ { color: colors.bar } }>All rewards unlocked!</strong>
					}
				</span>
			</div>

			{ /* Track area */ }
			<div style={ { position: 'relative', paddingTop: 36, paddingBottom: 28 } }>
				{ /* Floating milestone icons */ }
				{ sorted.map( ms => {
					const pos  = ( ms.threshold_value / max ) * 100;
					const done = cartValue >= ms.threshold_value;
					const isNext = ms.id === next?.id;
					return (
						<div key={ ms.id } style={ {
							position: 'absolute',
							left: `${ pos }%`,
							top: 0,
							transform: 'translateX(-50%)',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: 4,
							zIndex: 2,
						} }>
							<div style={ {
								width: 32, height: 32,
								borderRadius: '50%',
								background: done ? colors.bar : isNext ? `${ colors.accent }22` : `${ colors.track }`,
								border: `2px solid ${ done ? colors.bar : isNext ? colors.accent : colors.track }`,
								display: 'flex', alignItems: 'center', justifyContent: 'center',
								fontSize: 15,
								boxShadow: isNext ? `0 0 0 4px ${ colors.accent }33` : done ? `0 2px 6px ${ colors.bar }44` : 'none',
								transition: 'all 0.3s',
							} }>
								{ done ? '✅' : getEmoji( ms.reward_type ) }
							</div>
							{ ms.is_best_value && ! done && (
								<span style={ { fontSize: 9, background: '#f5a623', color: '#fff', borderRadius: 100, padding: '1px 5px', fontWeight: 700, whiteSpace: 'nowrap' } }>BEST</span>
							) }
						</div>
					);
				} ) }

				{ /* Track */ }
				<div style={ { height: 8, background: colors.track, borderRadius: 100, position: 'relative', overflow: 'hidden' } }>
					<div style={ {
						height: '100%',
						width: `${ pct }%`,
						background: colors.bar,
						borderRadius: 100,
						transition: animated ? 'width 1s ease' : 'none',
					} } />
				</div>

				{ /* Labels below */ }
				{ sorted.map( ms => (
					<div key={ ms.id } style={ {
						position: 'absolute',
						left: `${ ( ms.threshold_value / max ) * 100 }%`,
						bottom: 0,
						transform: 'translateX(-50%)',
						fontSize: 11,
						color: cartValue >= ms.threshold_value ? colors.bar : colors.text,
						fontWeight: cartValue >= ms.threshold_value ? 600 : 400,
						whiteSpace: 'nowrap',
						opacity: 0.85,
					} }>
						{ fmt( ms.threshold_value ) }
					</div>
				) ) }
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Style 2 — Segment Tiles
// Horizontal tiled cards, each fills independently
// ─────────────────────────────────────────────────────────────────────────────
function SegmentTiles( { milestones, cartValue, colors, animated } ) {
	const sorted = [ ...milestones ].sort( ( a, b ) => a.threshold_value - b.threshold_value );
	const next = sorted.find( m => cartValue < m.threshold_value );

	return (
		<div style={ { display: 'flex', flexDirection: 'column', gap: 8 } }>
			{ next && (
				<p style={ { margin: '0 0 4px', fontSize: 12, color: colors.text } }>
					{ getEmoji( next.reward_type ) } Add <strong style={ { color: colors.accent } }>{ fmt( next.threshold_value - cartValue ) }</strong> more for <strong>{ next.label }</strong>
				</p>
			) }
			<div style={ { display: 'flex', gap: 6 } }>
				{ sorted.map( ( ms, i ) => {
					const prev    = i === 0 ? 0 : sorted[ i - 1 ].threshold_value;
					const range   = ms.threshold_value - prev;
					const into    = Math.max( 0, Math.min( range, cartValue - prev ) );
					const tilePct = ( into / range ) * 100;
					const done    = cartValue >= ms.threshold_value;
					const isNext  = ms.id === next?.id;

					return (
						<div key={ ms.id } style={ {
							flex: 1,
							borderRadius: 10,
							overflow: 'hidden',
							border: `1.5px solid ${ done ? colors.bar : isNext ? colors.accent : colors.track }`,
							background: done ? `${ colors.bar }0d` : '#fff',
							transition: 'all 0.3s',
						} }>
							{ /* Progress fill */ }
							<div style={ { height: 4, background: colors.track, position: 'relative' } }>
								<div style={ {
									height: '100%',
									width: `${ tilePct }%`,
									background: done ? colors.bar : colors.accent,
									transition: animated ? 'width 0.8s ease' : 'none',
								} } />
							</div>
							{ /* Content */ }
							<div style={ { padding: '10px 10px 8px', textAlign: 'center' } }>
								<div style={ { fontSize: 22, marginBottom: 4 } }>
									{ done ? '✅' : getEmoji( ms.reward_type ) }
								</div>
								<div style={ {
									fontSize: 11,
									fontWeight: 600,
									color: done ? colors.bar : isNext ? colors.accent : colors.text,
									lineHeight: 1.3,
								} }>
									{ ms.is_best_value && <span style={ { display: 'block', fontSize: 9, background: '#f5a623', color: '#fff', borderRadius: 100, padding: '1px 4px', marginBottom: 2, fontWeight: 700 } }>⭐ BEST</span> }
									{ ms.label }
								</div>
								<div style={ { fontSize: 10, color: colors.text, opacity: 0.6, marginTop: 2, fontFamily: 'monospace' } }>
									{ fmt( ms.threshold_value ) }
								</div>
							</div>
						</div>
					);
				} ) }
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Style 3 — Bold Steps
// Wide bar with reward badges on top connected by a line
// ─────────────────────────────────────────────────────────────────────────────
function BoldSteps( { milestones, cartValue, colors, animated } ) {
	const { sorted, next, pct, max } = computeProgress( milestones, cartValue );

	return (
		<div style={ { padding: '8px 0' } }>
			{ /* Badges above the bar */ }
			<div style={ { position: 'relative', height: 44, marginBottom: 6 } }>
				{ sorted.map( ms => {
					const pos    = ( ms.threshold_value / max ) * 100;
					const done   = cartValue >= ms.threshold_value;
					const isNext = ms.id === next?.id;

					return (
						<div key={ ms.id } style={ {
							position: 'absolute',
							left: `${ pos }%`,
							transform: 'translateX(-50%)',
							bottom: 0,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: 3,
						} }>
							<div style={ {
								padding: '4px 10px',
								borderRadius: 100,
								fontSize: 11,
								fontWeight: 700,
								whiteSpace: 'nowrap',
								background: done ? colors.bar : isNext ? colors.accent : '#f0f0f0',
								color: done || isNext ? '#fff' : '#666',
								boxShadow: isNext ? `0 3px 10px ${ colors.accent }55` : done ? `0 2px 6px ${ colors.bar }33` : 'none',
								transition: 'all 0.3s',
							} }>
								{ getEmoji( ms.reward_type ) } { ms.label }
								{ ms.is_best_value && <span style={ { marginLeft: 4 } }>⭐</span> }
							</div>
							{ /* Connector dot */ }
							<div style={ {
								width: 6, height: 6,
								borderRadius: '50%',
								background: done ? colors.bar : isNext ? colors.accent : '#ccc',
							} } />
						</div>
					);
				} ) }
			</div>

			{ /* Thick bar */ }
			<div style={ { height: 16, background: colors.track, borderRadius: 100, position: 'relative', overflow: 'hidden' } }>
				<div style={ {
					height: '100%',
					width: `${ pct }%`,
					background: `linear-gradient(90deg, ${ colors.bar }, ${ colors.accent })`,
					borderRadius: 100,
					transition: animated ? 'width 1s ease' : 'none',
					position: 'relative',
					overflow: 'hidden',
				} }>
					{ animated && (
						<div style={ {
							position: 'absolute', inset: 0,
							background: 'linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.25) 50%, transparent 80%)',
							animation: 'cm-shimmer 2s ease infinite',
						} } />
					) }
				</div>
				{ sorted.map( ms => (
					<div key={ ms.id } style={ {
						position: 'absolute',
						top: 3, bottom: 3,
						left: `${ ( ms.threshold_value / max ) * 100 }%`,
						width: 2,
						background: 'rgba(255,255,255,0.5)',
						transform: 'translateX(-50%)',
					} } />
				) ) }
			</div>

			{ /* Cart value indicator */ }
			<div style={ { display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: colors.text, opacity: 0.7 } }>
				<span>🛒 { fmt( cartValue ) } spent</span>
				<span>Goal: { fmt( max ) }</span>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Style 4 — Minimal Strip
// Single compact line — best for checkout / header
// ─────────────────────────────────────────────────────────────────────────────
function MinimalStrip( { milestones, cartValue, colors, animated } ) {
	const { sorted, next, pct } = computeProgress( milestones, cartValue );

	return (
		<div style={ { display: 'flex', flexDirection: 'column', gap: 8 } }>
			<div style={ { display: 'flex', alignItems: 'center', gap: 10 } }>
				<span style={ { fontSize: 20, flexShrink: 0 } }>🛒</span>
				<div style={ { flex: 1 } }>
					<div style={ { height: 6, background: colors.track, borderRadius: 100, overflow: 'hidden', position: 'relative' } }>
						<div style={ {
							height: '100%',
							width: `${ pct }%`,
							background: `linear-gradient(90deg, ${ colors.bar }, ${ colors.accent })`,
							borderRadius: 100,
							transition: animated ? 'width 1s ease' : 'none',
						} } />
					</div>
					<div style={ { display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: colors.text, opacity: 0.7 } }>
						<span>{ fmt( 0 ) }</span>
						{ sorted.map( ms => (
							<span key={ ms.id } style={ { color: cartValue >= ms.threshold_value ? colors.bar : undefined } }>{ fmt( ms.threshold_value ) }</span>
						) ) }
					</div>
				</div>
				<span style={ { fontSize: 20, flexShrink: 0 } }>{ next ? getEmoji( next.reward_type ) : '🎉' }</span>
			</div>

			{ next ? (
				<div style={ {
					background: `${ colors.accent }11`,
					border: `1px solid ${ colors.accent }33`,
					borderRadius: 8,
					padding: '6px 12px',
					fontSize: 12,
					color: colors.text,
					display: 'flex',
					alignItems: 'center',
					gap: 8,
				} }>
					<span>{ getEmoji( next.reward_type ) }</span>
					<span>Add <strong style={ { color: colors.accent } }>{ fmt( next.threshold_value - cartValue ) }</strong> more for <strong>{ next.label }</strong></span>
					{ next.is_best_value && <span style={ { marginLeft: 'auto', fontSize: 10, background: '#f5a623', color: '#fff', borderRadius: 100, padding: '1px 6px', fontWeight: 700 } }>⭐ BEST</span> }
				</div>
			) : (
				<div style={ { textAlign: 'center', fontSize: 13, color: colors.bar, fontWeight: 600 } }>🎉 All rewards unlocked!</div>
			) }
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Style 5 — Progressive Reveal
// Card-based, one milestone at a time, locked ones shown as mystery
// ─────────────────────────────────────────────────────────────────────────────
function ProgressiveReveal( { milestones, cartValue, colors, animated } ) {
	const { sorted, earned, next } = computeProgress( milestones, cartValue );
	const locked = sorted.filter( m => ! earned.includes( m ) && m.id !== next?.id );

	const segStart = earned.length > 0 ? earned[ earned.length - 1 ].threshold_value : 0;
	const segEnd   = next?.threshold_value || sorted[ sorted.length - 1 ]?.threshold_value || 1;
	const segPct   = next ? Math.min( 100, ( ( cartValue - segStart ) / ( segEnd - segStart ) ) * 100 ) : 100;

	return (
		<div style={ { display: 'flex', flexDirection: 'column', gap: 8 } }>
			{ /* Earned badges */ }
			{ earned.length > 0 && (
				<div style={ { display: 'flex', gap: 6, flexWrap: 'wrap' } }>
					{ earned.map( ms => (
						<div key={ ms.id } style={ {
							display: 'flex', alignItems: 'center', gap: 5,
							background: colors.bar, color: '#fff',
							borderRadius: 100, padding: '4px 10px',
							fontSize: 11, fontWeight: 600,
						} }>
							✅ { ms.label }
						</div>
					) ) }
				</div>
			) }

			{ /* Active target card */ }
			{ next && (
				<div style={ {
					background: '#fff',
					borderRadius: 14,
					padding: 16,
					boxShadow: `0 0 0 2px ${ colors.accent }44, 0 8px 24px ${ colors.accent }22`,
				} }>
					<div style={ { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } }>
						<div style={ {
							width: 48, height: 48,
							borderRadius: 12,
							background: `${ colors.accent }18`,
							display: 'flex', alignItems: 'center', justifyContent: 'center',
							fontSize: 26,
						} }>
							{ getEmoji( next.reward_type ) }
						</div>
						<div style={ { flex: 1 } }>
							<div style={ { fontSize: 15, fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: 6 } }>
								{ next.label }
								{ next.is_best_value && (
									<span style={ { fontSize: 10, background: '#f5a623', color: '#fff', borderRadius: 100, padding: '1px 6px', fontWeight: 700 } }>⭐ BEST</span>
								) }
							</div>
							<div style={ { fontSize: 12, color: '#888', marginTop: 2 } }>
								{ fmt( cartValue ) } / { fmt( next.threshold_value ) }
							</div>
						</div>
						<div style={ { fontSize: 22, fontWeight: 800, color: colors.accent, letterSpacing: '-1px' } }>
							{ Math.round( segPct ) }%
						</div>
					</div>

					{ /* Progress bar */ }
					<div style={ { height: 8, background: `${ colors.accent }22`, borderRadius: 100, overflow: 'hidden' } }>
						<div style={ {
							height: '100%',
							width: `${ segPct }%`,
							background: `linear-gradient(90deg, ${ colors.bar }, ${ colors.accent })`,
							borderRadius: 100,
							transition: animated ? 'width 1s ease' : 'none',
							position: 'relative', overflow: 'hidden',
						} }>
							{ animated && <div style={ { position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent 30%,rgba(255,255,255,0.35) 50%,transparent 70%)', animation: 'cm-shimmer 1.8s ease infinite' } } /> }
						</div>
					</div>

					<div style={ { marginTop: 8, fontSize: 12, color: '#555', textAlign: 'center' } }>
						Add <strong style={ { color: colors.accent } }>{ fmt( next.threshold_value - cartValue ) }</strong> more to unlock
					</div>
				</div>
			) }

			{ /* Locked milestones */ }
			{ locked.map( ( ms, i ) => (
				<div key={ ms.id } style={ {
					display: 'flex', alignItems: 'center', gap: 10,
					padding: '10px 14px',
					borderRadius: 10,
					border: '1.5px dashed #ddd',
					opacity: 0.5,
				} }>
					<span style={ { fontSize: 18 } }>🔒</span>
					<span style={ { fontSize: 12, color: '#888' } }>
						{ i === 0 ? `Unlocks after "${ next?.label }"` : 'Locked — unlock previous to reveal' }
					</span>
				</div>
			) ) }

			{ ! next && (
				<div style={ {
					textAlign: 'center', padding: 20,
					background: `${ colors.bar }0d`,
					borderRadius: 12, fontSize: 15, color: colors.bar, fontWeight: 700,
				} }>
					🎉 You've unlocked all rewards!
				</div>
			) }
		</div>
	);
}

// ── Registry ──────────────────────────────────────────────────────────────
export const PROGRESS_STYLES = [
	{ id: 'classic', label: 'Classic Dots',        description: 'Floating emoji icons above a clean progress track.',            component: ClassicDots      },
	{ id: 'tiles',   label: 'Segment Tiles',        description: 'Tiled reward cards, each fills independently as you shop.',    component: SegmentTiles     },
	{ id: 'bold',    label: 'Bold Steps',           description: 'Thick gradient bar with floating reward badges on top.',       component: BoldSteps        },
	{ id: 'minimal', label: 'Minimal Strip',        description: 'Ultra-compact one-liner with reward hint. Great for checkout.', component: MinimalStrip    },
	{ id: 'reveal',  label: 'Progressive Reveal',   description: 'One milestone at a time. Next reward stays locked until current is earned.', component: ProgressiveReveal },
];

// ── Preview wrapper ────────────────────────────────────────────────────────
export function ProgressPreview( { style = 'classic', colors, animated = true } ) {
	const def  = PROGRESS_STYLES.find( s => s.id === style ) || PROGRESS_STYLES[0];
	const Comp = def.component;

	return (
		<div className="cm-progress-preview-frame">
			<div className="cm-progress-preview-label">
				<span>{ __( 'Preview', 'boostcart' ) }</span>
				<span style={ { opacity: 0.5, fontSize: 11 } }>
					{ __( 'Cart: ', 'boostcart' ) }{ fmt( MOCK_CART ) } · { __( '1 milestone earned', 'boostcart' ) }
				</span>
			</div>
			<div className="cm-progress-preview-body" style={ { background: '#fafafa' } }>
				<Comp milestones={ MOCK_MILESTONES } cartValue={ MOCK_CART } colors={ colors } animated={ animated } />
			</div>
		</div>
	);
}
