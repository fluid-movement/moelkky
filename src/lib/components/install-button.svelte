<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Download } from '@lucide/svelte';

	// The `beforeinstallprompt` event isn't in the standard lib types.
	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	// Browsers fire `beforeinstallprompt` when the PWA is installable; we stash it and
	// show our own button, since browsers rarely surface the install prompt on their own.
	// (iOS Safari never fires it — those users install via Share → Add to Home Screen.)
	let deferred = $state<BeforeInstallPromptEvent | null>(null);

	onMount(() => {
		const onPrompt = (e: Event) => {
			e.preventDefault();
			deferred = e as BeforeInstallPromptEvent;
		};
		const onInstalled = () => (deferred = null);
		window.addEventListener('beforeinstallprompt', onPrompt);
		window.addEventListener('appinstalled', onInstalled);
		return () => {
			window.removeEventListener('beforeinstallprompt', onPrompt);
			window.removeEventListener('appinstalled', onInstalled);
		};
	});

	async function install() {
		const event = deferred;
		if (!event) return;
		await event.prompt();
		await event.userChoice;
		deferred = null;
	}
</script>

{#if deferred}
	<Button
		variant="ghost"
		onclick={install}
		class="text-muted-foreground h-11 w-full text-sm transition-transform active:scale-[.98]"
	>
		<Download />
		Install app
	</Button>
{/if}
