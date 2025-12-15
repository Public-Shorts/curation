<script lang="ts">
	let { currentPath } = $props();
</script>

<nav class="border-b bg-white">
	<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
		<div class="text-sm font-semibold tracking-wide uppercase text-gray-700">
			Public Shorts · Curation
		</div>

		<div class="flex items-center gap-4 text-xs font-medium text-gray-600">
			<a
				href="/"
				class={currentPath === '/' ? 'text-black' : 'hover:text-black'}
			>
				Submissions
			</a>
			<form method="POST" action="/api/auth/logout">
				<button
					type="submit"
					class="rounded border px-2 py-1 text-[11px] text-gray-500 hover:border-gray-400 hover:text-gray-800"
				>
					Log out
				</button>
			</form>
		</div>
	</div>
</nav>
