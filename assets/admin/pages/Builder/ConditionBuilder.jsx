import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';

const CONDITION_TYPES = [
	{ value: 'cart_value',      label: __( 'Cart Value', 'boostcart' ) },
	{ value: 'product_qty',     label: __( 'Product Quantity', 'boostcart' ) },
	{ value: 'category_qty',    label: __( 'Category Quantity', 'boostcart' ) },
	{ value: 'category_spend',  label: __( 'Category Spend', 'boostcart' ) },
	{ value: 'product_spend',   label: __( 'Product Spend', 'boostcart' ) },
	{ value: 'lifetime_spend',  label: __( 'Lifetime Spend', 'boostcart' ) },
	{ value: 'lifetime_orders', label: __( 'Lifetime Orders', 'boostcart' ) },
	{ value: 'customer_role',   label: __( 'Customer Role', 'boostcart' ) },
	{ value: 'date_range',      label: __( 'Date Range', 'boostcart' ) },
];

const COMPARATORS = [
	{ value: '>=', label: '>=' },
	{ value: '<=', label: '<=' },
	{ value: '>',  label: '>'  },
	{ value: '<',  label: '<'  },
	{ value: '=',  label: '='  },
	{ value: '!=', label: '≠'  },
];

function emptyGroup( operator = 'AND' ) {
	return { _id: uid(), condition_type: 'group', operator, children: [] };
}

function emptyLeaf() {
	return { _id: uid(), condition_type: 'cart_value', comparator: '>=', value: '', meta: {} };
}

let _uid = 0;
function uid() { return ++_uid; }

function ConditionNode( { node, onUpdate, onRemove } ) {
	if ( node.condition_type === 'group' ) {
		return (
			<div className="cm-cond-group">
				<div className="cm-cond-group__header">
					<Select
						options={ [ { value: 'AND', label: 'AND' }, { value: 'OR', label: 'OR' } ] }
						value={ node.operator }
						onChange={ e => onUpdate( { ...node, operator: e.target.value } ) }
					/>
					<Button variant="ghost" size="sm" onClick={ () => onUpdate( { ...node, children: [ ...node.children, emptyLeaf() ] } ) }>
						{ __( '+ Condition', 'boostcart' ) }
					</Button>
					<Button variant="ghost" size="sm" onClick={ () => onUpdate( { ...node, children: [ ...node.children, emptyGroup() ] } ) }>
						{ __( '+ Group', 'boostcart' ) }
					</Button>
					{ onRemove && (
						<Button variant="danger" size="sm" onClick={ onRemove }>{ __( 'Remove Group', 'boostcart' ) }</Button>
					) }
				</div>
				<div className="cm-cond-group__children">
					{ node.children.map( child => (
						<ConditionNode
							key={ child._id }
							node={ child }
							onUpdate={ updated => onUpdate( { ...node, children: node.children.map( c => c._id === updated._id ? updated : c ) } ) }
							onRemove={ () => onUpdate( { ...node, children: node.children.filter( c => c._id !== child._id ) } ) }
						/>
					) ) }
				</div>
			</div>
		);
	}

	return (
		<div className="cm-cond-leaf">
			<Select
				options={ CONDITION_TYPES }
				value={ node.condition_type }
				onChange={ e => onUpdate( { ...node, condition_type: e.target.value } ) }
			/>
			<Select
				options={ COMPARATORS }
				value={ node.comparator }
				onChange={ e => onUpdate( { ...node, comparator: e.target.value } ) }
			/>
			<Input
				type="text"
				placeholder={ __( 'Value', 'boostcart' ) }
				value={ node.value }
				onChange={ e => onUpdate( { ...node, value: e.target.value } ) }
			/>
			<Button variant="ghost" size="sm" onClick={ onRemove } aria-label={ __( 'Remove condition', 'boostcart' ) }>✕</Button>
		</div>
	);
}

export function ConditionBuilder( { tree = [], onChange } ) {
	const [ root, setRoot ] = useState(
		tree.length ? tree[ 0 ] : emptyGroup( 'AND' )
	);

	function handleUpdate( updated ) {
		setRoot( updated );
		onChange( [ updated ] );
	}

	return (
		<div className="cm-condition-builder">
			<ConditionNode node={ root } onUpdate={ handleUpdate } onRemove={ null } />
		</div>
	);
}
