<script lang="ts">
	type Props = {
		selection: "selected" | "notSelected" | "maybe" ;
	};
	let { selection } : { selection: string } = $props();


</script>

<span
	class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset
                            {selection === 'selected'
		? 'bg-green-50 text-green-700 ring-green-600/20'
		: selection === 'notSelected'
			? 'bg-red-50 text-red-700 ring-red-600/20'
			: 'bg-gray-50 text-gray-600 ring-gray-500/10'}"
>
	{selection === 'selected' ? 'Selected' : selection === 'notSelected' ? 'Not Selected' : 'Maybe'}
</span>
