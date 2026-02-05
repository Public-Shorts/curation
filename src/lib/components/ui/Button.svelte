<script lang="ts">
	import type { Snippet } from 'svelte';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type ButtonSize = 'sm' | 'md' | 'lg';

	let {
		variant = 'secondary',
		size = 'md',
		type = 'button',
		disabled = false,
		onclick,
		class: className = '',
		children
	}: {
		variant?: ButtonVariant;
		size?: ButtonSize;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
		children: Snippet;
	} = $props();

	const baseClasses = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
	
	const variantClasses = {
		primary: 'bg-gallery-900 text-white hover:bg-gallery-800 focus:ring-gallery-500',
		secondary: 'border border-gallery-300 bg-white text-gallery-700 hover:bg-gallery-50 hover:border-gallery-400 focus:ring-gallery-300',
		ghost: 'text-gallery-700 hover:bg-gallery-100 hover:text-gallery-900 focus:ring-gallery-300',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
	};

	const sizeClasses = {
		sm: 'px-2 py-1 text-xs rounded',
		md: 'px-3 py-1.5 text-sm rounded',
		lg: 'px-4 py-2 text-base rounded-lg'
	};

	const disabledClasses = 'opacity-50 cursor-not-allowed';

	let classes = $derived(`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? disabledClasses : ''} ${className}`);
</script>

<button {type} {disabled} {onclick} class={classes}>
	{@render children()}
</button>
