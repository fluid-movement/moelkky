<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import UpdatePrompt from '$lib/components/update-prompt.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
	<meta name="theme-color" content="#151229" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content="Mölkky" />
</svelte:head>
{@render children()}
<UpdatePrompt />
