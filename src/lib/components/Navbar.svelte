<script lang="ts">
	import Logo from "./Logo.svelte";

	let { currentPath } = $props();
</script>

<nav class="border-b bg-white">
	<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
		<div class="flex items-center gap-6 uppercase text-sm font-medium text-gray-700">
			<a
				class="flex items-center text-sm font-semibold tracking-wide uppercase text-gray-700 hover:text-gray-900"
				href="/"
			>
				<div class="relative w-24 fill-gray-800">
					<Logo />
				</div>
				<p>· Curation</p>
			</a>

			<a class="uppercase hover:text-gray-900" href="/">Home</a>
			<a class="uppercase hover:text-gray-900" href="/stats">Stats</a>
			<a class="uppercase hover:text-gray-900" href="/selection">Selection</a>
		</div>

		<div class="flex items-center gap-4 text-xs font-medium text-gray-600">
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
