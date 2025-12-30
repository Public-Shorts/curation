<script lang="ts">
	let { selectedNotes = [] }: { selectedNotes?: string[] } = $props();

	const contentNoteOptions = [
		{ val: 'violence', label: 'Violence' },
		{ val: 'sexualContent', label: 'Sexual Content' },
		{ val: 'strongLanguage', label: 'Strong Language' },
		{ val: 'drugAlcoholUse', label: 'Drug/Alcohol' },
		{ val: 'horrorDisturbingImages', label: 'Horror/Disturbing' },
		{ val: 'sensitiveThemes', label: 'Sensitive Themes' }
	];
</script>

<div>
	<span class="block text-sm font-medium text-gray-700 mb-3">Content Notes</span>
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
		{#each contentNoteOptions as item}
			<!-- Checkbox items -->
			<label
				class="flex items-center gap-3 p-2.5 sm:p-2 rounded border border-gray-100 bg-gray-50/50 hover:bg-gray-50 cursor-pointer"
			>
				<input
					type="checkbox"
					name="contentNotes"
					value={item.val}
					class="h-4 w-4 rounded border-gray-300 text-black focus:ring-black shrink-0"
					checked={selectedNotes?.includes(item.val)}
				/>
				<span class="text-sm text-gray-700">{item.label}</span>
			</label>
		{/each}
	</div>
</div>
