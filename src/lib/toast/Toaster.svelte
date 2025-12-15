<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { getToastMessages, type ToastMessage } from './toastMessages.svelte';

	const toastMessages = getToastMessages();

	// local derived list of toasts currently visible
	let visible = $state<ToastMessage[]>([]);

	$effect(() => {
		// pick messages that were not shown yet
		const newly = toastMessages.messages.filter((m) => !m.isShown);

		if (newly.length) {
			for (const m of newly) {
				m.isShown = true;
				visible.push(m);

				// auto-remove after delay
				const id = m.id;
				setTimeout(() => {
					visible = visible.filter((t) => t.id !== id);
				}, 3000);
			}
		}
	});
</script>

<div class="fixed inset-0 pointer-events-none flex flex-col items-end p-4 gap-2 z-50">
	{#each visible as toast (toast.id)}
		<div
			in:fly={{ x: 100, duration: 150 }}
			out:fade={{ duration: 150 }}
			class={`pointer-events-auto rounded px-3 py-2 text-sm shadow border
        ${
					toast.type === 'success'
						? 'bg-green-600 text-white border-green-700'
						: 'bg-red-600 text-white border-red-700'
				}
      `}
		>
			{toast.message}
		</div>
	{/each}
</div>
