<script lang="ts">
	import { Settings as SettingsIcon } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	type Settings = {
		selectedThreshold: number;
		maybeThreshold: number;
		volumeExponent: number;
		tendencyPenalty: number;
	};

	let { settings = $bindable(), isAdmin } = $props<{
		settings: Settings;
		isAdmin: boolean;
	}>();

	let isOpen = $state(false);
	let isSaving = $state(false);

	async function saveSettings() {
		if (!isAdmin) return;
		isSaving = true;

		try {
			const response = await fetch('/api/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(settings)
			});

			if (!response.ok) throw new Error('Failed to save');
			toast.success('Settings saved');
		} catch {
			toast.error('Failed to save settings');
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="relative">
	<button
		type="button"
		onclick={() => (isOpen = !isOpen)}
		class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
	>
		<SettingsIcon class="w-4 h-4" />
		Settings
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4"
		>
			<h3 class="text-sm font-semibold text-gray-900 mb-4">Score Thresholds</h3>

			<div class="space-y-4">
				<!-- Selected Threshold -->
				<div class="space-y-1">
					<div class="flex items-center justify-between">
						<label for="selected" class="text-xs font-medium text-gray-600">Selected ≥</label>
						<span class="text-xs font-mono text-green-600">{settings.selectedThreshold}%</span>
					</div>
					<input
						id="selected"
						type="range"
						min="50"
						max="90"
						step="5"
						bind:value={settings.selectedThreshold}
						disabled={!isAdmin}
						class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600 disabled:opacity-50"
					/>
				</div>

				<!-- Maybe Threshold -->
				<div class="space-y-1">
					<div class="flex items-center justify-between">
						<label for="maybe" class="text-xs font-medium text-gray-600">Maybe ≥</label>
						<span class="text-xs font-mono text-amber-600">{settings.maybeThreshold}%</span>
					</div>
					<input
						id="maybe"
						type="range"
						min="10"
						max="50"
						step="5"
						bind:value={settings.maybeThreshold}
						disabled={!isAdmin}
						class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
					/>
				</div>

				<div class="border-t border-gray-100 pt-4 mt-4">
					<h3 class="text-sm font-semibold text-gray-900 mb-4">Scoring Algorithm</h3>

					<!-- Volume Exponent -->
					<div class="space-y-1 mb-4">
						<div class="flex items-center justify-between">
							<label for="volume" class="text-xs font-medium text-gray-600">Volume Influence</label>
							<span class="text-xs font-mono text-gray-500">{settings.volumeExponent.toFixed(1)}</span>
						</div>
						<input
							id="volume"
							type="range"
							min="0.5"
							max="3"
							step="0.1"
							bind:value={settings.volumeExponent}
							disabled={!isAdmin}
							class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
						/>
						<p class="text-[10px] text-gray-400">How much reviewer experience affects weight</p>
					</div>

					<!-- Tendency Penalty -->
					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<label for="tendency" class="text-xs font-medium text-gray-600">Bias Correction</label>
							<span class="text-xs font-mono text-gray-500">{settings.tendencyPenalty.toFixed(1)}</span>
						</div>
						<input
							id="tendency"
							type="range"
							min="0"
							max="6"
							step="0.5"
							bind:value={settings.tendencyPenalty}
							disabled={!isAdmin}
							class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600 disabled:opacity-50"
						/>
						<p class="text-[10px] text-gray-400">Correction for extreme voters</p>
					</div>
				</div>

				{#if isAdmin}
					<button
						type="button"
						onclick={saveSettings}
						disabled={isSaving}
						class="w-full mt-4 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
					>
						{isSaving ? 'Saving...' : 'Save Settings'}
					</button>
				{:else}
					<p class="text-xs text-gray-400 mt-4 text-center">Only admins can modify settings</p>
				{/if}
			</div>
		</div>

		<!-- Backdrop -->
		<button
			type="button"
			class="fixed inset-0 z-40"
			onclick={() => (isOpen = false)}
			aria-label="Close settings"
		></button>
	{/if}
</div>
