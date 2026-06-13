import React, { useState, useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';

// ── Mock data for the preview ──────────────────────────────────────────────
const MOCK_MILESTONES = [
	{ id: 1, threshold_value: 499,  label: 'Free Shipping', reward_type: 'free_shipping',       is_best_value: false },
	{ id: 2, threshold_value: 999,  label: '10% OFF',       reward_type: 'percentage_discount', is_best_value: true  },
	{ id: 3, threshold_value: 1999, label: '20% OFF',       reward_type: 'percentage_discount', is_best_value: false },
];
const MOCK_CART       = 650;   // current cart value — milestone 1 earned
const MOCK_CURRENCY   = '₹';

function fmt( v ) { return `${ MOCK_CURRENCY }${ Number( v ).toFixed( 0 ) }`; }

function computeProgress( milestones, cartValue ) {
	const sorted = [ ...milestones ].sort( ( a, b ) => a.threshold_value - b.threshold_value );
	const earned = sorted.filter( m => cartValue >= m.threshold_value );
	const next   = sorted.find( m => cartValue < m.threshold_value ) || null;
	const max    = sorted[ sorted.length - 1 ]?.threshold_value || 1;
	const pct    = Math.min( 100, ( cartValue / max ) * 100 );
	return { sorted, earned, next, pct };
}

// ── Style 1: Classic Dots ──────────────────────────────────────────────────
function ClassicDots( { milestones, cartValue, colors, animated } ) {
	const { sorted, earned, next, pct } = computeProgress( milestones, cartValue );
	const max = sorted[ sorted.length - 1 ]?.threshold_value || 1;

	return (
		<div className="cm-prev classic-dots">
			{ next && (
				<p className="cm-prev__msg" style={ { color: colors.text } }>
					{ fmt( next.threshold_value - cartValue ) } more for <strong>{ next.label }</strong>
				</p>
			) }
			<div className="cm-prev__track-wrap">
				<div className="cm-prev__track" style={ { background: colors.track } }>
					<div
						className={ `cm-prev__fill${ animated ? ' cm-prev__fill--anim' : '' }` }
						style={ { width: `${ pct }%`, background: colors.bar } }
					/>
					{ sorted.map( ms => {
						const pos  = ( ms.threshold_value / max ) * 100;
						const done = cartValue >= ms.threshold_value;
						const isNext = ms.id === next?.id;
						return (
							<div
								key={ ms.id }
								className={ `cm-prev__dot${ done ? ' --done' : '' }${ isNext ? ' --next' : '' }` }
								style={ {
									left:       `${ pos }%`,
									background: done ? colors.bar : colors.track,
									borderColor: done ? colors.bar : colors.accent,
									boxShadow:  isNext ? `0 0 0 3px ${ colors.accent }33` : undefined,
								} }
								title={ ms.label }
							>
								{ done && <span className="cm-prev__dot-check">✓</span> }
								{ ms.is_best_value && ! done && <span className="cm-prev__star">⭐</span> }
							</div>
						);
					} ) }
				</div>
				<div className="cm-prev__labels">
					{ sorted.map( ms => (
						<div key={ ms.id } className="cm-prev__label" style={ { left: `${ ( ms.threshold_value / max ) * 100 }%` } }>
							<span style={ { color: cartValue >= ms.threshold_value ? colors.bar : colors.text } }>{ ms.label }</span>
						</div>
					) ) }
				</div>
			</div>
		</div>
	);
}

// ── Style 2: Gradient Flow ─────────────────────────────────────────────────
function GradientFlow( { milestones, cartValue, colors, animated } ) {
	const { sorted, earned, next, pct } = computeProgress( milestones, cartValue );
	const max = sorted[ sorted.length - 1 ]?.threshold_value || 1;

	const grad = `linear-gradient(90deg, ${ colors.bar }, ${ colors.accent })`;

	return (
		<div className="cm-prev gradient-flow">
			{ next && (
				<p className="cm-prev__msg" style={ { color: colors.text } }>
					{ fmt( next.threshold_value - cartValue ) } away from <strong style={ { color: colors.accent } }>{ next.label }</strong>
				</p>
			) }
			<div className="cm-prev__gflow-wrap">
				<div className="cm-prev__gflow-track" style={ { background: colors.track } }>
					<div
						className={ `cm-prev__gflow-fill${ animated ? ' --anim' : '' }` }
						style={ { width: `${ pct }%`, background: grad } }
					/>
					{ sorted.map( ms => (
						<div
							key={ ms.id }
							className="cm-prev__gflow-tick"
							style={ { left: `${ ( ms.threshold_value / max ) * 100 }%`, background: cartValue >= ms.threshold_value ? '#fff' : colors.accent } }
						/>
					) ) }
				</div>
				<div className="cm-prev__gflow-labels">
					{ sorted.map( ms => (
						<div key={ ms.id } className="cm-prev__gflow-lbl" style={ { left: `${ ( ms.threshold_value / max ) * 100 }%` } }>
							<span style={ { color: colors.text, fontWeight: ms.is_best_value ? 700 : 400 } }>
								{ fmt( ms.threshold_value ) } { ms.is_best_value ? '⭐' : '' }
							</span>
							<span style={ { color: colors.accent, fontSize: 11 } }>{ ms.label }</span>
						</div>
					) ) }
				</div>
			</div>
		</div>
	);
}

// ── Style 3: Segment Tiles ─────────────────────────────────────────────────
function SegmentTiles( { milestones, cartValue, colors, animated } ) {
	const sorted = [ ...milestones ].sort( ( a, b ) => a.threshold_value - b.threshold_value );

	return (
		<div className="cm-prev segment-tiles">
			<div className="cm-prev__tiles">
				{ sorted.map( ( ms, i ) => {
					const prev    = i === 0 ? 0 : sorted[ i - 1 ].threshold_value;
					const range   = ms.threshold_value - prev;
					const into    = Math.max( 0, Math.min( range, cartValue - prev ) );
					const tilePct = ( into / range ) * 100;
					const done    = cartValue >= ms.threshold_value;

					return (
						<div
							key={ ms.id }
							className={ `cm-prev__tile${ done ? ' --done' : '' }${ ms.is_best_value ? ' --best' : '' }` }
							style={ { flex: 1 } }
						>
							<div className="cm-prev__tile-track" style={ { background: colors.track } }>
								<div
									className={ `cm-prev__tile-fill${ animated ? ' --anim' : '' }` }
									style={ {
										width: `${ tilePct }%`,
										background: done ? colors.bar : `${ colors.accent }88`,
									} }
								/>
							</div>
							<div className="cm-prev__tile-label" style={ { color: done ? colors.bar : colors.text } }>
								{ done ? '✓ ' : '' }{ ms.label }
								{ ms.is_best_value && <span style={ { marginLeft: 3 } }>⭐</span> }
							</div>
							<div className="cm-prev__tile-threshold" style={ { color: colors.text, opacity: 0.6 } }>
								{ fmt( ms.threshold_value ) }
							</div>
						</div>
					);
				} ) }
			</div>
		</div>
	);
}

// ── Style 4: Bold Steps ────────────────────────────────────────────────────
function BoldSteps( { milestones, cartValue, colors, animated } ) {
	const { sorted, next, pct } = computeProgress( milestones, cartValue );
	const max = sorted[ sorted.length - 1 ]?.threshold_value || 1;

	return (
		<div className="cm-prev bold-steps">
			<div className="cm-prev__bold-badges">
				{ sorted.map( ms => {
					const pos  = ( ms.threshold_value / max ) * 100;
					const done = cartValue >= ms.threshold_value;
					const isNext = ms.id === next?.id;
					return (
						<div key={ ms.id } className="cm-prev__bold-badge-wrap" style={ { left: `${ pos }%` } }>
							<div
								className={ `cm-prev__bold-badge${ done ? ' --done' : '' }${ isNext ? ' --next' : '' }${ ms.is_best_value ? ' --best' : '' }` }
								style={ {
									background:  done ? colors.bar : isNext ? colors.accent : '#fff',
									color:       done || isNext ? '#fff' : colors.text,
									borderColor: done ? colors.bar : isNext ? colors.accent : colors.track,
									boxShadow:   isNext ? `0 4px 12px ${ colors.accent }44` : undefined,
								} }
							>
								{ ms.is_best_value ? '⭐ ' : '' }{ ms.label }
							</div>
						</div>
					);
				} ) }
			</div>
			<div className="cm-prev__bold-bar-wrap">
				<div className="cm-prev__bold-track" style={ { background: colors.track } }>
					<div
						className={ `cm-prev__bold-fill${ animated ? ' --anim' : '' }` }
						style={ { width: `${ pct }%`, background: colors.bar } }
					/>
					{ sorted.map( ms => (
						<div
							key={ ms.id }
							className="cm-prev__bold-marker"
							style={ { left: `${ ( ms.threshold_value / max ) * 100 }%`, background: cartValue >= ms.threshold_value ? '#fff' : colors.track } }
						/>
					) ) }
				</div>
				<div className="cm-prev__bold-ends">
					<span style={ { color: colors.text, fontSize: 11 } }>{ fmt( 0 ) }</span>
					<span style={ { color: colors.bar, fontWeight: 700, fontSize: 13 } }>{ fmt( cartValue ) }</span>
					<span style={ { color: colors.text, fontSize: 11 } }>{ fmt( max ) }</span>
				</div>
			</div>
		</div>
	);
}

// ── Style 5: Minimal Strip ─────────────────────────────────────────────────
function MinimalStrip( { milestones, cartValue, colors, animated } ) {
	const { sorted, next, pct } = computeProgress( milestones, cartValue );

	return (
		<div className="cm-prev minimal-strip">
			<div className="cm-prev__strip-row">
				<span className="cm-prev__strip-val" style={ { color: colors.bar, fontWeight: 700 } }>
					{ fmt( cartValue ) }
				</span>
				<div className="cm-prev__strip-track" style={ { background: colors.track } }>
					<div
						className={ `cm-prev__strip-fill${ animated ? ' --anim' : '' }` }
						style={ { width: `${ pct }%`, background: colors.bar } }
					/>
				</div>
				<span className="cm-prev__strip-next" style={ { color: colors.accent } }>
					{ next ? `→ ${ next.label }` : '🎉 All unlocked!' }
				</span>
			</div>
			{ next && (
				<p className="cm-prev__strip-msg" style={ { color: colors.text } }>
					{ fmt( next.threshold_value - cartValue ) } more for <strong>{ next.label }</strong> ({ fmt( next.threshold_value ) } total)
				</p>
			) }
		</div>
	);
}

// ── Style registry ─────────────────────────────────────────────────────────
export const PROGRESS_STYLES = [
	{
		id:          'classic',
		label:       'Classic Dots',
		description: 'Thin track with milestone dots. Each dot fills when earned.',
		component:   ClassicDots,
	},
	{
		id:          'gradient',
		label:       'Gradient Flow',
		description: 'Smooth gradient bar that flows toward the next reward.',
		component:   GradientFlow,
	},
	{
		id:          'tiles',
		label:       'Segment Tiles',
		description: 'Bar split into reward tiles — each tile fills independently.',
		component:   SegmentTiles,
	},
	{
		id:          'bold',
		label:       'Bold Steps',
		description: 'Thick bar with floating reward badges above each milestone.',
		component:   BoldSteps,
	},
	{
		id:          'minimal',
		label:       'Minimal Strip',
		description: 'Ultra-thin one-liner — great for checkout or mini cart.',
		component:   MinimalStrip,
	},
];

// ── Main ProgressPreview export ────────────────────────────────────────────
export function ProgressPreview( { style = 'classic', colors, animated = true } ) {
	const def = PROGRESS_STYLES.find( s => s.id === style ) || PROGRESS_STYLES[0];
	const Comp = def.component;

	return (
		<div className="cm-progress-preview-frame">
			<div className="cm-progress-preview-label">
				<span>{ __( 'Preview', 'boostcart' ) }</span>
				<span style={ { opacity: 0.5, fontSize: 11 } }>
					{ __( 'Cart:', 'boostcart' ) } { fmt( MOCK_CART ) } · { __( 'Milestone 1 earned', 'boostcart' ) }
				</span>
			</div>
			<div className="cm-progress-preview-body">
				<Comp
					milestones={ MOCK_MILESTONES }
					cartValue={ MOCK_CART }
					colors={ colors }
					animated={ animated }
				/>
			</div>
		</div>
	);
}
