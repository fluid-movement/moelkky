<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button/index.js';
	import { motion } from '$lib/motion/reduced-motion.svelte.js';
	import { RefreshCw } from '@lucide/svelte';

	/** The installed-but-waiting service worker, once a new version is ready. */
	let waiting = $state<ServiceWorker | null>(null);

	onMount(() => {
		if (!('serviceWorker' in navigator)) return;

		let reloading = false;
		// When the waiting worker takes control (after we accept), reload once to pick it up.
		const onControllerChange = () => {
			if (reloading) return;
			reloading = true;
			location.reload();
		};
		navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

		navigator.serviceWorker.ready.then((registration) => {
			// Only prompt for a genuine update — a controller already runs — not the first install.
			const offerUpdate = (worker: ServiceWorker | null) => {
				if (worker && navigator.serviceWorker.controller) waiting = worker;
			};

			// A worker may already be waiting from a previous session.
			offerUpdate(registration.waiting);

			registration.addEventListener('updatefound', () => {
				const installing = registration.installing;
				installing?.addEventListener('statechange', () => {
					if (installing.state === 'installed') offerUpdate(installing);
				});
			});

			// Check for a new version now rather than waiting for the browser's periodic poll.
			registration.update().catch(() => {});
		});

		return () =>
			navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
	});

	function reloadNow() {
		// Ask the waiting worker to activate; `controllerchange` then reloads the page.
		waiting?.postMessage({ type: 'SKIP_WAITING' });
		waiting = null;
	}
</script>

{#if waiting}
	<div
		class="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-4"
		in:fly={motion.ok ? { y: 24, duration: 300 } : { duration: 0 }}
		out:fly={motion.ok ? { y: 24, duration: 200 } : { duration: 0 }}
	>
		<div
			class="bg-card flex w-full max-w-md items-center gap-3 rounded-xl border p-3 shadow-lg"
			role="status"
		>
			<RefreshCw class="text-primary size-4 shrink-0" />
			<p class="flex-1 text-sm">A new version is available.</p>
			<Button size="sm" variant="ghost" onclick={() => (waiting = null)}>Later</Button>
			<Button size="sm" onclick={reloadNow}>Reload</Button>
		</div>
	</div>
{/if}
