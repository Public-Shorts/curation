<script lang="ts">
	import Logo from "$lib/components/Logo.svelte";

	let { form }: { form?: { error?: string } } = $props();
</script>

<div class="mx-auto mt-20 max-w-sm space-y-4">
	<Logo/>

	{#if form?.error}
		<p class="text-sm text-red-500">{form.error}</p>
	{/if}

	<form method="POST" class="space-y-3">
		<label class="block">
			<span class="mb-1 block text-sm">Login code</span>
			<input
				name="code"
				type="password"
				autocomplete="one-time-code"
				class="w-full rounded border px-3 py-2"
				required
			/>
		</label>

		<button
			type="submit"
			class="rounded bg-black px-3 py-2 text-sm font-semibold text-white"
		>
			Enter
		</button>
	</form>
</div>
