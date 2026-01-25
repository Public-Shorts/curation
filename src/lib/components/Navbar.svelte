<script lang="ts">
	import Logo from './Logo.svelte';

	let { currentPath } = $props();
	let mobileMenuOpen = $state(false);

	function toggleMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<nav class="border-b border-gallery-200 bg-white">
	<div class="mx-auto max-w-5xl px-4 py-3">
		<div class="flex items-center justify-between">
			<!-- Logo -->
			<a
				class="flex items-center text-sm font-semibold tracking-wide uppercase text-gallery-700 hover:text-gallery-900"
				href="/"
			>
				<div class="relative w-20 sm:w-24 fill-gallery-800">
					<Logo />
				</div>
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center gap-6 uppercase text-sm font-medium text-gallery-700">
				<a class="uppercase hover:text-gallery-900" href="/my-reviews">My Reviews</a>
				<a class="uppercase hover:text-gallery-900" href="/highlights">Highlights</a>
				<a class="uppercase hover:text-gallery-900" href="/stats">Stats</a>
				<a class="uppercase hover:text-gallery-900" href="/selection">Selection</a>
			</div>

			<!-- Desktop Logout -->
			<div class="hidden md:flex items-center gap-4 text-xs font-medium text-gallery-600">
				<form method="POST" action="/api/auth/logout">
					<button
						type="submit"
						class="rounded border border-gallery-300 px-2 py-1 text-[11px] text-gallery-500 hover:border-gallery-400 hover:text-gallery-800"
					>
						Log out
					</button>
				</form>
			</div>

			<!-- Mobile Menu Button -->
			<button
				class="md:hidden p-2 text-gallery-700 hover:text-gallery-900"
				onclick={toggleMenu}
				aria-label="Toggle menu"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if mobileMenuOpen}
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					{:else}
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					{/if}
				</svg>
			</button>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden mt-4 pb-2 border-t border-gallery-200 pt-4 flex flex-col gap-4">
				<a
					class="uppercase text-sm font-medium text-gallery-700 hover:text-gallery-900 py-2"
					href="/my-reviews"
					onclick={toggleMenu}
				>
					My Reviews
				</a>
				<a
					class="uppercase text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
					href="/highlights"
					onclick={toggleMenu}
				>
					Highlights
				</a>
				<a
					class="uppercase text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
					href="/stats"
					onclick={toggleMenu}
				>
					Stats
				</a>
				<a
					class="uppercase text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
					href="/selection"
					onclick={toggleMenu}
				>
					Selection
				</a>
				<form method="POST" action="/api/auth/logout" class="pt-2">
					<button
						type="submit"
						class="w-full text-left rounded border border-gallery-300 px-3 py-2 text-sm text-gallery-500 hover:border-gallery-400 hover:text-gallery-800"
					>
						Log out
					</button>
				</form>
			</div>
		{/if}
	</div>
</nav>
