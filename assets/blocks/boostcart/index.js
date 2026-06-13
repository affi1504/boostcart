import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit( { attributes, setAttributes } ) {
		const blockProps = useBlockProps( { className: 'cm-block-editor-preview' } );

		return (
			<div { ...blockProps }>
				<InspectorControls>
					<PanelBody title={ __( 'Display Settings', 'boostcart' ) }>
						<SelectControl
							label={ __( 'Style', 'boostcart' ) }
							value={ attributes.style }
							options={ [
								{ label: __( 'Horizontal (timeline)', 'boostcart' ), value: 'horizontal' },
								{ label: __( 'Vertical (list)', 'boostcart' ), value: 'vertical' },
							] }
							onChange={ style => setAttributes( { style } ) }
						/>
						<TextControl
							label={ __( 'Campaign ID (optional)', 'boostcart' ) }
							help={ __( 'Leave 0 to show all active campaigns.', 'boostcart' ) }
							type="number"
							value={ attributes.campaignId }
							onChange={ val => setAttributes( { campaignId: parseInt( val ) || 0 } ) }
						/>
					</PanelBody>
				</InspectorControls>

				<div style={ { padding: '16px', border: '1px dashed #ebebeb', borderRadius: '8px', background: '#fafafa', textAlign: 'center', color: '#888' } }>
					<span style={ { fontSize: '24px' } }>🏆</span>
					<p style={ { margin: '8px 0 0', fontSize: '13px' } }>
						{ __( 'Boostcart — ', 'boostcart' ) }
						{ attributes.style === 'horizontal' ? __( 'Horizontal Progress', 'boostcart' ) : __( 'Vertical List', 'boostcart' ) }
					</p>
				</div>
			</div>
		);
	},

	save() {
		// Dynamic block — rendered server-side.
		return null;
	},
} );
