<script lang="ts">
	import type { Flag } from '$lib/utils/types';

	let { flag } = $props<{ flag: Flag }>();
</script>

<div class="group/flag relative inline-flex">
	<span
		class="cursor-help px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border {flag.color}"
	>
		{flag.label}
	</span>

	<!-- Custom Tooltip -->
	<div
		class="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover/flag:opacity-100 transition-opacity pointer-events-none z-50 overflow-hidden"
	>
		<p class="font-bold mb-1">{flag.label}</p>
		<p class="text-gray-300 leading-snug break-words">{flag.details}</p>
	</div>
</div>
