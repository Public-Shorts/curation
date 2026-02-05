<script lang="ts">
	let {
		settings = $bindable(),
		isAdmin = false,
		onSave
	} = $props<{
		settings: {
			selectedThreshold: number;
			maybeThreshold: number;
		};
		isAdmin: boolean;
		onSave?: () => void;
	}>();

	let isSaving = $state(false);
	let saveSuccess = $state(false);
	let saveError = $state('');

	async function handleSave() {
		if (!isAdmin) return;
		isSaving = true;
		saveSuccess = false;
		saveError = '';

		try {
			const response = await fetch('/api/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					selectedThreshold: settings.selectedThreshold,
					maybeThreshold: settings.maybeThreshold
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to save');
			}

			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 2000);
			onSave?.();
		} catch (e: any) {
			saveError = e.message || 'Failed to save settings';
		} finally {
			isSaving = false;
		}
	}

	function handleReset() {
		// Reset to server defaults - triggers parent to reload from data
		window.location.reload();
	}
</script>

<div class="settings-panel">
	<h3 class="settings-title">Selection Thresholds</h3>

	<div class="settings-grid">
		<div class="setting-item">
			<label for="selected-threshold" class="setting-label">
				<span class="label-dot selected"></span>
				Selected Threshold
			</label>
			<div class="setting-input-group">
				<input
					id="selected-threshold"
					type="range"
					min="50"
					max="95"
					step="5"
					bind:value={settings.selectedThreshold}
					class="setting-slider"
				/>
				<span class="setting-value">{settings.selectedThreshold}%</span>
			</div>
			<p class="setting-hint">Films scoring above this are "Selected"</p>
		</div>

		<div class="setting-item">
			<label for="maybe-threshold" class="setting-label">
				<span class="label-dot maybe"></span>
				Maybe Threshold
			</label>
			<div class="setting-input-group">
				<input
					id="maybe-threshold"
					type="range"
					min="15"
					max="50"
					step="5"
					bind:value={settings.maybeThreshold}
					class="setting-slider"
				/>
				<span class="setting-value">{settings.maybeThreshold}%</span>
			</div>
			<p class="setting-hint">Films scoring above this are "Maybe"</p>
		</div>
	</div>

	<div class="settings-actions">
		<button class="reset-btn" onclick={handleReset} type="button"> ↺ Reset </button>
		{#if isAdmin}
			<button class="save-btn" onclick={handleSave} disabled={isSaving}>
				{#if isSaving}
					<span class="spinner"></span> Saving...
				{:else if saveSuccess}
					✓ Saved
				{:else}
					Save Settings
				{/if}
			</button>
			{#if saveError}
				<span class="error-msg">{saveError}</span>
			{/if}
		{:else}
			<span class="preview-note">Preview mode · Only admins can save</span>
		{/if}
	</div>
</div>

<style>
	.settings-panel {
		/* Minimal style */
		margin-bottom: 2rem;
	}

	.settings-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-gallery-400);
		margin: 0 0 1rem;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 2rem;
		align-items: end;
	}

	.setting-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-gallery-700);
	}

	.label-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.label-dot.selected {
		background: #22c55e;
	}

	.label-dot.maybe {
		background: #f59e0b;
	}

	.setting-input-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.setting-slider {
		flex: 1;
		height: 6px;
		appearance: none;
		background: var(--color-gallery-200);
		border-radius: 3px;
		cursor: pointer;
	}

	.setting-slider::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--color-gallery-700);
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.setting-slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}

	.setting-slider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.setting-value {
		font-size: 0.875rem;
		font-weight: 600;
		font-family: monospace;
		min-width: 40px;
		text-align: right;
		color: var(--color-gallery-800);
	}

	.setting-hint {
		font-size: 0.75rem;
		color: var(--color-gallery-400);
		margin: 0;
	}

	.settings-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 2rem;
	}

	.save-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
		background: var(--color-gallery-800);
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.save-btn:hover:not(:disabled) {
		background: var(--color-gallery-900);
	}

	.save-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-msg {
		font-size: 0.75rem;
		color: #dc2626;
	}

	.reset-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-gallery-600);
		background: white;
		border: 1px solid var(--color-gallery-200);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.reset-btn:hover {
		background: var(--color-gallery-50);
		border-color: var(--color-gallery-300);
	}

	.preview-note {
		font-size: 0.75rem;
		color: var(--color-gallery-400);
		font-style: italic;
	}

	@media (max-width: 640px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
