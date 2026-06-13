import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { EntityPicker } from '../../components/ui/EntityPicker';

const CONDITION_TYPES = [
	{ value: 'cart_value',     label: __( 'Cart Value', 'boostcart' ) },
	{ value: 'customer_role',  label: __( 'Customer Role', 'boostcart' ) },
	{ value: 'product_qty',    label: __( 'Product Quantity', 'boostcart' ) },
	{ value: 'category_qty',   label: __( 'Category Quantity', 'boostcart' ) },
	{ value: 'date_range',     label: __( 'Date Range', 'boostcart' ) },
];

const COMPARATORS = [
	{ value: '>=', label: '>=' },
	{ value: '<=', label: '<=' },
	{ value: '>',  label: '>'  },
	{ value: '<',  label: '<'  },
	{ value: '=',  label: '='  },
];

const WP_ROLES = [
	{ value: 'customer',      label: __( 'Customer', 'boostcart' ) },
	{ value: 'subscriber',    label: __( 'Subscriber', 'boostcart' ) },
	{ value: 'wholesale_customer', label: __( 'Wholesale Customer', 'boostcart' ) },
	{ value: 'editor',        label: __( 'Editor', 'boostcart' ) },
	{ value: 'administrator', label: __( 'Administrator', 'boostcart' ) },
];

let _uid = 1000;
function uid() { return ++_uid; }

function emptyRule() {
	return { _id: uid(), condition_type: 'cart_value', comparator: '>=', value: '', meta: {} };
}

function RuleRow( { rule, onUpdate, onRemove } ) {
	const type = rule.condition_type;

	return (
		<div className="cm-rule-row">
			<Select
				options={ CONDITION_TYPES }
				value={ type }
				onChange={ e => onUpdate( { ...rule, condition_type: e.target.value, value: '', meta: {} } ) }
			/>

			{ type === 'customer_role' && (
				<Select
					options={ WP_ROLES }
					value={ rule.meta?.role || 'customer' }
					onChange={ e => onUpdate( { ...rule, meta: { role: e.target.value } } ) }
				/>
			) }

			{ type === 'date_range' && (
				<>
					<Input
						type="date"
						placeholder={ __( 'Start date', 'boostcart' ) }
						value={ rule.meta?.start_date || '' }
						onChange={ e => onUpdate( { ...rule, meta: { ...rule.meta, start_date: e.target.value } } ) }
					/>
					<Input
						type="date"
						placeholder={ __( 'End date', 'boostcart' ) }
						value={ rule.meta?.end_date || '' }
						onChange={ e => onUpdate( { ...rule, meta: { ...rule.meta, end_date: e.target.value } } ) }
					/>
				</>
			) }

			{ type !== 'customer_role' && type !== 'date_range' && (
				<>
					<Select
						options={ COMPARATORS }
						value={ rule.comparator }
						onChange={ e => onUpdate( { ...rule, comparator: e.target.value } ) }
					/>
					<input
						type="number"
						className="cm-field__input"
						placeholder={ __( 'Value', 'boostcart' ) }
						value={ rule.value }
						min="0"
						step="0.01"
						onChange={ e => onUpdate( { ...rule, value: e.target.value } ) }
						style={ { width: 100, flexShrink: 0 } }
					/>
				</>
			) }

			<button
				type="button"
				className="cm-rule-remove"
				onClick={ onRemove }
				aria-label={ __( 'Remove rule', 'boostcart' ) }
			>✕</button>
		</div>
	);
}

export function ConditionBuilder( { tree = [], onChange } ) {
	const init = () => {
		if ( tree.length && tree[0]?.children?.length ) {
			return {
				operator: tree[0].operator || 'AND',
				rules:    tree[0].children.map( c => ( { _id: uid(), ...c } ) ),
			};
		}
		return { operator: 'AND', rules: [] };
	};

	const [ operator, setOperator ] = useState( init().operator );
	const [ rules, setRules ]       = useState( init().rules );

	function push( op, rs ) {
		setOperator( op );
		setRules( rs );
		onChange( rs.length ? [ { condition_type: 'group', operator: op, children: rs } ] : [] );
	}

	function addRule() {
		push( operator, [ ...rules, emptyRule() ] );
	}

	function updateRule( _id, updated ) {
		push( operator, rules.map( r => r._id === _id ? updated : r ) );
	}

	function removeRule( _id ) {
		push( operator, rules.filter( r => r._id !== _id ) );
	}

	function changeOperator( op ) {
		push( op, rules );
	}

	return (
		<div className="cm-condition-builder-v2">
			{ rules.length === 0 ? (
				<div className="cm-hint-box">
					{ __( 'No extra conditions. This campaign will be shown to all eligible customers. Add rules to restrict further.', 'boostcart' ) }
				</div>
			) : (
				<div className="cm-condition-builder-v2__header">
					<span>{ __( 'Show campaign when', 'boostcart' ) }</span>
					<Select
						options={ [
							{ value: 'AND', label: __( 'ALL rules match', 'boostcart' ) },
							{ value: 'OR',  label: __( 'ANY rule matches', 'boostcart' ) },
						] }
						value={ operator }
						onChange={ e => changeOperator( e.target.value ) }
					/>
				</div>
			) }

			<div className="cm-condition-builder-v2__rules">
				{ rules.map( rule => (
					<RuleRow
						key={ rule._id }
						rule={ rule }
						onUpdate={ updated => updateRule( rule._id, updated ) }
						onRemove={ () => removeRule( rule._id ) }
					/>
				) ) }
			</div>

			<Button variant="ghost" size="sm" onClick={ addRule } style={ { marginTop: 8 } }>
				{ __( '+ Add Rule', 'boostcart' ) }
			</Button>
		</div>
	);
}
