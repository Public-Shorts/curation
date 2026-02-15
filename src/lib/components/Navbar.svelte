<script lang="ts">
	import { Menu, X } from 'lucide-svelte';
	import Logo from './Logo.svelte';

	let { currentPath, isAdmin = false, isJury = false } = $props();
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
				class="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase text-gallery-700 hover:text-gallery-900"
				href="/"
			>
				<div class="relative w-20 sm:w-24 fill-gallery-800">
					<Logo />
				</div>
				{#if isJury}
					<span
						class="px-2 py-1 text-[10px] font-black uppercase tracking-wider bg-accent-500 text-white rounded shadow-sm"
					>
						Jury
					</span>
				{/if}
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center gap-6 uppercase text-sm font-medium text-gallery-700">
				{#if !isJury}
					<a class="uppercase hover:text-gallery-900" href="/my-reviews">My Reviews</a>
				{/if}
				<a class="uppercase hover:text-gallery-900" href="/stats">Stats</a>
				{#if !isJury}
					<a class="uppercase hover:text-gallery-900" href="/selection">Selection</a>
				{/if}
				{#if isAdmin}
					<a class="uppercase hover:text-gallery-900" href="/screenings-maker">Screenings</a>
					<a class="uppercase hover:text-gallery-900" href="/admin">Admin</a>
				{/if}
				{#if isAdmin || isJury}
					<a class="uppercase hover:text-gallery-900" href="/meta-categories">Meta Categories</a>
					<a class="uppercase hover:text-gallery-900" href="/visualiser">Visualiser</a>
				{/if}
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
				{#if mobileMenuOpen}
					<X class="w-6 h-6" />
				{:else}
					<Menu class="w-6 h-6" />
				{/if}
			</button>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden mt-4 pb-2 border-t border-gallery-200 pt-4 flex flex-col gap-4">
				{#if !isJury}
					<a
						class="uppercase text-sm font-medium text-gallery-700 hover:text-gallery-900 py-2"
						href="/my-reviews"
						onclick={toggleMenu}
					>
						My Reviews
					</a>
				{/if}
				<a
					class="uppercase text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
					href="/stats"
					onclick={toggleMenu}
				>
					Stats
				</a>
				{#if !isJury}
					<a
						class="uppercase text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
						href="/selection"
						onclick={toggleMenu}
					>
						Selection
					</a>
				{/if}
				{#if isAdmin || isJury}
					<a
						class="uppercase text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
						href="/meta-categories"
						onclick={toggleMenu}
					>
						Meta Categories
					</a>
					<a
						class="uppercase text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
						href="/visualiser"
						onclick={toggleMenu}
					>
						Visualiser
					</a>
				{/if}
				{#if isAdmin}
					<a
						class="uppercase text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
						href="/screenings-maker"
						onclick={toggleMenu}
					>
						Screenings
					</a>
					<a
						class="uppercase text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
						href="/admin"
						onclick={toggleMenu}
					>
						Admin
					</a>
				{/if}
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
