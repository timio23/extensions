<script setup lang="ts">
import { useStores } from '@directus/extensions-sdk';
import { useClipboard } from '@vueuse/core';
import { formatRelative, isPast } from 'date-fns';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getPublicURL } from './get-root-path';

interface Props {
	value?: {
		startDate: string;
		endDate: string;
		roomName: string;
		roomUrl: string;
		meetingId: string;
		hostRoomUrl?: string;
		viewerRoomUrl?: string;
	};
}

const props = defineProps<Props>();
const emit = defineEmits(['input']);

const valuesLoaded = ref(false);
const { useUserStore } = useStores();
const userStore = useUserStore();
const { t } = useI18n();

const loadMeeting = ref(false);
const showDialog = ref(false);

const { copy: copyToClipboard } = useClipboard();

onMounted(() => {
	const script = document.createElement('script');
	script.src = 'https://cdn.srv.whereby.com/embed/v2-embed.js';
	script.type = 'module';
	document.head.append(script);

	script.addEventListener('load', () => {
		valuesLoaded.value = true;
	});
});

const embedUrl = computed(() => {
	return props.value?.hostRoomUrl || props.value?.roomUrl || '';
});

const roomName = computed(() => {
	return props.value?.roomName?.replace(/[^a-z0-9]/gi, '') || 'Meeting Room';
});

const expirationDate = computed(() => {
	if (props.value?.endDate) {
		return formatRelative(new Date(props.value.endDate), new Date());
	}

	return '';
});

const isExpired = computed(() => {
	return props.value?.endDate && isPast(new Date(props.value.endDate));
});

function openUrl(url: string) {
	if (!url)
		return;
	window.open(url, '_blank');
}

const menuItems = computed(() => {
	const items = [
		{
			icon: 'edit',
			text: 'Edit Room URL',
			action: () => {
				showDialog.value = true;
			},
		},
	];

	if (props.value?.roomUrl) {
		items.push(
			{
				icon: 'content_copy',
				text: 'Copy Room URL',
				action: () => copyToClipboard(props.value?.roomUrl || ''),
			},
			{
				icon: 'open_in_new',
				text: 'Open Room URL',
				action: () => openUrl(props.value?.roomUrl || ''),
			},
		);
	}

	if (props.value?.hostRoomUrl) {
		items.push({
			icon: 'admin_panel_settings',
			text: 'Open Host Room URL',
			action: () => openUrl(props.value?.hostRoomUrl ?? ''),
		});
	}

	if (props.value?.viewerRoomUrl) {
		items.push({
			icon: 'visibility',
			text: 'Open Viewer Room URL',
			action: () => openUrl(props.value?.viewerRoomUrl ?? ''),
		});
	}

	return items;
});

const componentState = computed(() => {
	if (!props.value || !props.value.roomUrl) {
		return 'no-data';
	}

	if (isExpired.value) {
		return 'expired';
	}

	return 'valid';
});

const avatarUrl = computed(() => {
	const baseUrl = getPublicURL();
	return `${baseUrl}assets/${userStore.currentUser?.avatar?.id}`;
});

const dialogForm = ref({
	hostRoomUrl: props.value?.hostRoomUrl || '',
});

const dialogFields = [
	{
		field: 'hostRoomUrl',
		name: 'Host Room URL',
		type: 'string',
		meta: {
			label: 'Host Room URL',
			required: true,
			placeholder:
				'https://your-subdomain.whereby.com/test-room8774y0?roomKey=eyJhbGciOdfadfadfzI1NiIsInR5cCI6IkpXVCJ9',
			note: 'Add the Host Room URL from Whereby. This is the URL that you use to start the meeting. The  standard Room URL that guests use to join the meeting will be extracted from this URL.',
		},
	},
];

function updateRoomUrl() {
	const newHostRoomUrl = dialogForm.value.hostRoomUrl;
	// Strip the query parameters from the host room URL to get the viewer room URL
	const viewerRoomUrl = newHostRoomUrl.split('?')[0];
	// Extract the room name from the viewer room URL
	// eslint-disable-next-line no-constant-binary-expression
	const roomName = `/${viewerRoomUrl.split('/').pop()}` || '';
	// Other properties can't be determined from the URL, so we keep the existing values
	emit('input', { ...props.value, hostRoomUrl: newHostRoomUrl, roomUrl: viewerRoomUrl, roomName });
	showDialog.value = false;
}

watch(
	() => props.value,
	(newValue) => {
		dialogForm.value.hostRoomUrl = newValue?.hostRoomUrl || '';
	},
	{ deep: true },
);
</script>

<template>
	<div class="whereby-container interface bordered">
		<div class="header">
			<p class="selectable id">
				{{ roomName }}
			</p>
			<div v-if="expirationDate" class="expiration" :class="{ expired: isExpired }">
				{{ isExpired ? 'Expired' : 'Expires' }} {{ expirationDate }}
			</div>
			<v-menu show-arrow placement="bottom-end">
				<template #activator="{ toggle }">
					<v-icon name="more_vert" clickable @click="toggle" />
				</template>
				<v-list>
					<v-list-item v-for="(item, index) in menuItems" :key="index" clickable @click="item.action">
						<v-icon :name="item.icon" class="icon" />
						{{ item.text }}
					</v-list-item>
				</v-list>
			</v-menu>
		</div>
		<div v-if="componentState === 'no-data'" class="info-box">
			<v-info type="danger" title="Missing Whereby Data" icon="warning">
				There is no Whereby data available or some required data is missing. Please contact an administrator.
			</v-info>
			<v-button class="start-meeting" kind="secondary" size="large" block @click="showDialog = true">
				Manually Add Room URL
			</v-button>
		</div>

		<div v-else-if="componentState === 'valid' && !loadMeeting" class="info-box">
			<v-info type="success" title="Meeting Ready" icon="meeting_room">
				Your Whereby meeting is ready to start.
			</v-info>
			<v-button class="start-meeting" color="primary" size="large" block @click="loadMeeting = true">
				Start Meeting
			</v-button>
		</div>

		<div v-else-if="componentState === 'expired' && !loadMeeting" class="info-box">
			<v-info type="warning" title="Meeting Expired" icon="history">
				This meeting has expired. You may still attempt to join, but it may not be accessible.
			</v-info>
			<v-button class="start-meeting" color="secondary" size="large" block @click="loadMeeting = true">
				Attempt to Join Expired Meeting
			</v-button>
		</div>

		<template v-if="valuesLoaded && loadMeeting && embedUrl">
			<!-- Whereby Embed breaks if you hyphenate attributes like Vue expects -->
			<!-- eslint-disable vue/attribute-hyphenation -->
			<whereby-embed
				class="whereby"
				:room="embedUrl"
				:avatarUrl="avatarUrl"
				:displayName="userStore.fullName"
				:externalId="userStore.currentUser?.id"
			/>
		</template>

		<v-dialog v-model="showDialog" @esc="showDialog = false">
			<v-card>
				<v-card-title>Edit Room URL</v-card-title>
				<v-card-text>
					<v-form v-model="dialogForm" :fields="dialogFields" primary-key="+" />
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="showDialog = false">
						{{ t('cancel') }}
					</v-button>
					<v-button @click="updateRoomUrl">
						{{ t('save') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style scoped>
.whereby-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px;
	background-color: var(--theme--background-subdued);
	border-bottom: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--theme--border-radius) var(--theme--border-radius) 0 0;
}

.header .id {
	font-family: var(--theme--fonts--monospace--font-family);
	font-weight: var(--theme--fonts--monospace--font-weight);
}
.header h3 {
	margin: 0;
	font-size: 1.2em;
}
.expiration {
	font-size: 0.9em;
	color: var(--theme--foreground-subdued);
}
.expiration.expired {
	color: var(--theme--danger);
}
.whereby {
	width: 100%;
	height: 100%;
	min-height: 600px;
	aspect-ratio: 16/9;
}
.bordered {
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
}
.start-meeting {
	margin: 10px;
}

.info-box {
	width: 100%;
	padding: var(--theme--form--row-gap);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}

.icon {
	margin-right: 8px;
}
</style>
