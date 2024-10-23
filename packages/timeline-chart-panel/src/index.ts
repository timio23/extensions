import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'panel-timeline-chart',
	name: 'Timeline Chart',
	icon: 'view_timeline',
	description: 'View timelines for various labels',
	component: PanelComponent,
	options: ({ options }): Array<Object> => {
		const series = options?.["series"];
		return [
			{
				field: 'collection',
				type: 'string',
				name: '$t:collection',
				required: true,
				meta: {
					interface: 'system-collection',
					options: {
						includeSystem: true,
						includeSingleton: false,
						placeholder: '$t:select_a_collection',
					},
					width: 'full',
				},
			},
			{
				field: 'filter',
				type: 'json',
				name: '$t:filter',
				meta: {
					interface: 'system-filter',
					options: {
						collectionField: 'collection',
						relationalFieldSelectable: true,
					},
				},
			},
			{
				field: 'label',
				type: 'string',
				name: '$t:label',
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						placeholder: '$t:select_a_field',
						typeAllowList: ['string'],
					},
					width: 'half',
				},
			},
			{
				field: 'datetimeStart',
				type: 'string',
				name: '$t:fields.directus_shares.date_start',
				required: true,
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						placeholder: '$t:select_a_field',
						typeAllowList: ['dateTime', 'date', 'timestamp'],
					},
					width: 'half',
				},
			},
			{
				field: 'datetimeEnd',
				type: 'string',
				name: '$t:fields.directus_shares.date_end',
				required: true,
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						placeholder: '$t:select_a_field',
						typeAllowList: ['dateTime', 'date', 'timestamp'],
					},
					width: 'half',
				},
			},
			{
				field: 'task',
				type: 'string',
				name: '$t:display_text',
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						placeholder: '$t:select_a_field',
						typeAllowList: ['string'],
					},
					width: 'half',
				},
			},
			{
				field: 'series',
				type: 'string',
				name: '$t:series_grouping',
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						placeholder: '$t:select_a_field',
						typeAllowList: ['string'],
						allowNone: true,
					},
					width: 'half',
				},
			},
			{
				field: 'color',
				name: '$t:color',
				type: 'integer',
				schema: {
					default_value: '#6644FF',
				},
				meta: series ? {
					interface: 'presentation-notice',
					width: 'half',
					options: {
						text: '$t:theme_auto',
					},
				} : {
					interface: 'select-color',
					display: 'color',
					width: 'half',
				},
			},
			{
				field: 'showMarker',
				name: '$t:panels.linechart.show_marker',
				type: 'boolean',
				schema: {
					default_value: true,
				},
				meta: {
					interface: 'boolean',
					width: 'half',
				},
			},
			{
				field: 'showDataLabel',
				name: '$t:show_data_label',
				type: 'boolean',
				schema: {
					default_value: true,
				},
				meta: {
					interface: 'boolean',
					width: 'half',
				},
			},
		];
	},
	minWidth: 12,
	minHeight: 8,
});
