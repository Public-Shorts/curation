<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let filterType = $state<'all' | 'cinema' | 'tv' | 'both'>('all');
	let editDialogOpen = $state(false);
	let removeDialogOpen = $state(false);
	let selectedVeto = $state<any>(null);
	let editFromCinema = $state(false);
	let editFromTV = $state(false);
	let editReason = $state('');
	let loading = $state(false);
	let error = $state('');

	let filteredVetoes = $derived.by(() => {
		if (filterType === 'all') return data.vetoedSubmissions;
		if (filterType === 'cinema')
			return data.vetoedSubmissions.filter(
				(v: any) => v.vetoedFromCinema && !v.vetoedFromTV
			);
		if (filterType === 'tv')
			return data.vetoedSubmissions.filter((v: any) => v.vetoedFromTV && !v.vetoedFromCinema);
		if (filterType === 'both')
			return data.vetoedSubmissions.filter((v: any) => v.vetoedFromCinema && v.vetoedFromTV);
		return data.vetoedSubmissions;
	});

	function openEditDialog(veto: any) {
		selectedVeto = veto;
		editFromCinema = veto.vetoedFromCinema;
		editFromTV = veto.vetoedFromTV;
		editReason = veto.reason;
		error = '';
		editDialogOpen = true;
	}

	function openRemoveDialog(veto: any) {
		selectedVeto = veto;
		error = '';
		removeDialogOpen = true;
	}

	function closeDialogs() {
		editDialogOpen = false;
		removeDialogOpen = false;
		selectedVeto = null;
		error = '';
	}

	async function submitEdit() {
		if (!editFromCinema && !editFromTV) {
			error = 'Must veto from at least cinema or TV';
			return;
		}

		if (!editReason || editReason.trim().length < 5) {
			error = 'Reason must be at least 5 characters';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/veto', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					submissionId: selectedVeto.submission._id,
					reason: editReason,
					vetoedFromCinema: editFromCinema,
					vetoedFromTV: editFromTV
				})
			});

			if (!response.ok) {
				const data = await response.json();
				error = data.error || 'Failed to update veto';
				loading = false;
				return;
			}

			closeDialogs();
			await invalidateAll();
		} catch (err) {
			error = 'Failed to update veto';
			loading = false;
		}
	}

	async function submitRemove() {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/veto', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					submissionId: selectedVeto.submission._id
				})
			});

			if (!response.ok) {
				const data = await response.json();
				error = data.error || 'Failed to remove veto';
				loading = false;
				return;
			}

			closeDialogs();
			await invalidateAll();
		} catch (err) {
			error = 'Failed to remove veto';
			loading = false;
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="space-y-8">
	<!-- Header -->
	<header>
		<h1 class="text-3xl font-bold mb-1">Vetoed Submissions</h1>
		<p class="text-gallery-600 text-sm">
			Videos excluded from cinema and/or TV display ({data.vetoedSubmissions.length})
		</p>
	</header>

	<!-- Filter Buttons -->
	{#if data.vetoedSubmissions.length > 0}
		<div class="flex gap-2">
			<button
				onclick={() => (filterType = 'all')}
				class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {filterType === 'all'
					? 'bg-gallery-900 text-white'
					: 'bg-gallery-100 text-gallery-700 hover:bg-gallery-200'}"
			>
				All ({data.vetoedSubmissions.length})
			</button>
			<button
				onclick={() => (filterType = 'cinema')}
				class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {filterType ===
				'cinema'
					? 'bg-gallery-900 text-white'
					: 'bg-gallery-100 text-gallery-700 hover:bg-gallery-200'}"
			>
				Cinema Only
			</button>
			<button
				onclick={() => (filterType = 'tv')}
				class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {filterType === 'tv'
					? 'bg-gallery-900 text-white'
					: 'bg-gallery-100 text-gallery-700 hover:bg-gallery-200'}"
			>
				TV Only
			</button>
			<button
				onclick={() => (filterType = 'both')}
				class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {filterType === 'both'
					? 'bg-gallery-900 text-white'
					: 'bg-gallery-100 text-gallery-700 hover:bg-gallery-200'}"
			>
				Both
			</button>
		</div>
	{/if}

	<!-- Vetoed Submissions List -->
	<div class="space-y-4">
		{#if filteredVetoes.length === 0}
			<div class="rounded-lg bg-gallery-50 p-12 text-center">
				<p class="text-gallery-500">
					{#if filterType !== 'all'}
						No submissions match this filter.
					{:else}
						No vetoed submissions yet.
					{/if}
				</p>
			</div>
		{:else}
			{#each filteredVetoes as veto}
				<div class="bg-white rounded-lg border border-gallery-200 p-4 shadow-sm">
					<div class="flex gap-4">
						<!-- Thumbnail -->
						<div class="h-24 w-32 rounded bg-gallery-100 flex-shrink-0 overflow-hidden">
							{#if veto.submission.poster?.asset}
								<img
									src={`${veto.submission.poster.asset.url}?w=200&h=150&fit=crop`}
									alt={veto.submission.englishTitle}
									class="h-full w-full object-cover"
								/>
							{:else if veto.submission.screenshots?.[0]?.asset}
								<img
									src={`${veto.submission.screenshots[0].asset.url}?w=200&h=150&fit=crop`}
									alt={veto.submission.englishTitle}
									class="h-full w-full object-cover"
								/>
							{:else}
								<div class="h-full w-full flex items-center justify-center text-2xl">🎬</div>
							{/if}
						</div>

						<!-- Content -->
						<div class="flex-1 min-w-0 space-y-2">
							<!-- Title and Info -->
							<div>
								<h3 class="font-bold text-lg text-gallery-900">
									{veto.submission.englishTitle}
								</h3>
								<p class="text-sm text-gallery-600">
									{veto.submission.directorName}
									{#if veto.submission.length}
										<span class="text-gallery-300 mx-1.5">•</span>
										<span>{veto.submission.length} min</span>
									{/if}
									{#if veto.submission.categories?.length > 0}
										<span class="text-gallery-300 mx-1.5">•</span>
										<span>{veto.submission.categories.join(', ')}</span>
									{/if}
								</p>
							</div>

							<!-- Veto Status Badges -->
							<div class="flex gap-2">
								{#if veto.vetoedFromCinema}
									<span
										class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full border border-purple-200"
									>
										<span>🎬</span>
										Cinema
									</span>
								{/if}
								{#if veto.vetoedFromTV}
									<span
										class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200"
									>
										<span>📺</span>
										TV
									</span>
								{/if}
							</div>

							<!-- Reason -->
							<div class="text-sm">
								<span class="font-medium text-gallery-700">Reason:</span>
								<span class="text-gallery-600">{veto.reason}</span>
							</div>

							<!-- Meta Info -->
							<div class="text-xs text-gallery-500">
								Vetoed by {veto.vetoedBy?.name || 'Unknown'} on {formatDate(veto.vetoedAt)}
							</div>
						</div>

						<!-- Actions -->
						{#if data.isAdmin}
							<div class="flex flex-col gap-2 justify-center">
								<button
									onclick={() => openEditDialog(veto)}
									class="px-3 py-1.5 text-xs font-medium text-gallery-700 bg-gallery-100 hover:bg-gallery-200 rounded-lg transition-colors"
								>
									Edit Veto
								</button>
								<button
									onclick={() => openRemoveDialog(veto)}
									class="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
								>
									Remove Veto
								</button>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- Edit Veto Dialog -->
{#if editDialogOpen && selectedVeto}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="absolute inset-0 bg-black/50" onclick={closeDialogs}></div>

		<div class="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
			<h2 class="text-xl font-bold mb-1">Edit Veto</h2>
			<p class="text-sm text-gallery-600 mb-4">{selectedVeto.submission.englishTitle}</p>

			<div class="mb-4">
				<p class="text-sm font-medium mb-2">Select contexts to veto from:</p>
				<div class="space-y-2">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={editFromCinema}
							class="w-4 h-4 rounded border-gallery-300"
						/>
						<span class="text-sm">Cinema Screenings</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={editFromTV}
							class="w-4 h-4 rounded border-gallery-300"
						/>
						<span class="text-sm">TV Display</span>
					</label>
				</div>
			</div>

			<div class="mb-4">
				<label class="block text-sm font-medium mb-2">Reason (required)</label>
				<textarea
					bind:value={editReason}
					class="w-full px-3 py-2 border border-gallery-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gallery-900 resize-none"
					rows="3"
				></textarea>
			</div>

			{#if error}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			{/if}

			<div class="flex gap-3 justify-end">
				<button
					onclick={closeDialogs}
					class="px-4 py-2 text-sm font-medium text-gallery-700 hover:text-gallery-900 transition-colors"
					disabled={loading}
				>
					Cancel
				</button>
				<button
					onclick={submitEdit}
					class="px-4 py-2 text-sm font-medium text-white bg-gallery-900 hover:bg-black rounded-lg transition-colors disabled:opacity-50"
					disabled={loading}
				>
					{loading ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Remove Veto Dialog -->
{#if removeDialogOpen && selectedVeto}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="absolute inset-0 bg-black/50" onclick={closeDialogs}></div>

		<div class="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
			<h2 class="text-xl font-bold mb-1">Remove Veto</h2>
			<p class="text-sm text-gallery-600 mb-4">
				Are you sure you want to remove the veto from "{selectedVeto.submission.englishTitle}"?
				This will allow it to appear in highlights again.
			</p>

			{#if error}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			{/if}

			<div class="flex gap-3 justify-end">
				<button
					onclick={closeDialogs}
					class="px-4 py-2 text-sm font-medium text-gallery-700 hover:text-gallery-900 transition-colors"
					disabled={loading}
				>
					Cancel
				</button>
				<button
					onclick={submitRemove}
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
					disabled={loading}
				>
					{loading ? 'Removing...' : 'Remove Veto'}
				</button>
			</div>
		</div>
	</div>
{/if}
