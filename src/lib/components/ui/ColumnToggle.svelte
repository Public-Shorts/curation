<script lang="ts">
	type Column = {
		key: string;
		label: string;
		default: boolean;
	};

	let { columns, visibleColumns = $bindable() } = $props<{
		columns: Column[];
		visibleColumns: Set<string>;
	}>();

	let isOpen = $state(false);

	function toggle(key: string) {
		if (visibleColumns.has(key)) {
			visibleColumns.delete(key);
		} else {
			visibleColumns.add(key);
		}
		visibleColumns = new Set(visibleColumns);
	}

	function showAll() {
		visibleColumns = new Set(columns.map((c: Column) => c.key));
	}

	function showDefaults() {
		visibleColumns = new Set(columns.filter((c: Column) => c.default).map((c: Column) => c.key));
	}
</script>

<div class="relative">
	<button
		type="button"
		onclick={() => (isOpen = !isOpen)}
		class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
			/>
		</svg>
		Columns
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
		>
			<div class="p-3 border-b border-gray-100">
				<div class="flex gap-2 text-xs">
					<button
						type="button"
						onclick={showAll}
						class="text-blue-600 hover:text-blue-800 font-medium"
					>
						Show all
					</button>
					<span class="text-gray-300">|</span>
					<button
						type="button"
						onclick={showDefaults}
						class="text-blue-600 hover:text-blue-800 font-medium"
					>
						Reset
					</button>
				</div>
			</div>
			<div class="p-2 max-h-64 overflow-y-auto">
				{#each columns as col}
					<label
						class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
					>
						<input
							type="checkbox"
							checked={visibleColumns.has(col.key)}
							onchange={() => toggle(col.key)}
							class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<span class="text-sm text-gray-700">{col.label}</span>
					</label>
				{/each}
			</div>
		</div>

		<!-- Backdrop to close dropdown -->
		<button
			type="button"
			class="fixed inset-0 z-40"
			onclick={() => (isOpen = false)}
			aria-label="Close dropdown"
		></button>
	{/if}
</div>
