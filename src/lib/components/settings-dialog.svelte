<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { settings } from '$lib/state/settings.svelte.js';
	import { Settings } from '@lucide/svelte';
</script>

<Dialog.Root>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" aria-label="Settings">
				<Settings />
			</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Settings</Dialog.Title>
			<Dialog.Description>Rules applied when you start a new game.</Dialog.Description>
		</Dialog.Header>
		<div class="flex items-center justify-between gap-4 py-2">
			<div class="space-y-1">
				<Label for="elimination-rule">Elimination rule</Label>
				<p class="text-muted-foreground text-sm">Three misses in a row knocks a player out.</p>
			</div>
			<Switch
				id="elimination-rule"
				bind:checked={() => settings.eliminationRule, (v) => (settings.eliminationRule = v)}
			/>
		</div>
	</Dialog.Content>
</Dialog.Root>
