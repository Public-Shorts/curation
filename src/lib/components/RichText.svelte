<script lang="ts">
	type Mark = {
		_type: string;
		_key: string;
		href?: string;
	};

	type Span = {
		_type: 'span';
		_key: string;
		text: string;
		marks: string[];
	};

	type Block = {
		_type: 'block';
		_key: string;
		style: string;
		children: Span[];
		markDefs: Mark[];
		listItem?: 'bullet' | 'number';
		level?: number;
	};

	let { blocks, class: className = '' }: { blocks: Block[]; class?: string } = $props();

	type Group =
		| { type: 'block'; block: Block }
		| { type: 'list'; listType: 'bullet' | 'number'; items: Block[] };

	function groupBlocks(blocks: Block[]): Group[] {
		const groups: Group[] = [];
		for (const block of blocks) {
			if (block.listItem) {
				const last = groups[groups.length - 1];
				if (last && last.type === 'list' && last.listType === block.listItem) {
					last.items.push(block);
				} else {
					groups.push({ type: 'list', listType: block.listItem, items: [block] });
				}
			} else {
				groups.push({ type: 'block', block });
			}
		}
		return groups;
	}

	const groups = $derived(groupBlocks(blocks));
</script>

{#snippet spanContent(span: Span, block: Block)}
	{@const link =
		span.marks.length > 0
			? block.markDefs?.find((m) => span.marks.includes(m._key) && m._type === 'link')
			: null}
	{@const isBold = span.marks.includes('strong')}
	{@const isItalic = span.marks.includes('em')}
	{#if link}
		<a href={link.href} target="_blank" rel="noopener noreferrer" class="rich-link">
			<span class:font-bold={isBold} class:italic={isItalic}>{span.text}</span>
		</a>
	{:else if isBold && isItalic}
		<strong><em>{span.text}</em></strong>
	{:else if isBold}
		<strong>{span.text}</strong>
	{:else if isItalic}
		<em>{span.text}</em>
	{:else}
		{span.text}
	{/if}
{/snippet}

<div class={className}>
	{#each groups as group}
		{#if group.type === 'list'}
			<svelte:element this={group.listType === 'number' ? 'ol' : 'ul'} class="rich-list">
				{#each group.items as block (block._key)}
					<li>
						{#each block.children as span (span._key)}
							{@render spanContent(span, block)}
						{/each}
					</li>
				{/each}
			</svelte:element>
		{:else}
			{@const block = group.block}
			{@const Tag = block.style === 'h3' ? 'h3' : 'p'}
			<svelte:element
				this={Tag}
				class={block.style === 'h3' ? 'rich-heading' : 'rich-paragraph'}
			>
				{#each block.children as span (span._key)}
					{@render spanContent(span, block)}
				{/each}
			</svelte:element>
		{/if}
	{/each}
</div>

<style>
	.rich-link {
		text-decoration: underline;
		text-underline-offset: 2px;
		color: inherit;
		transition: opacity 0.15s;
	}
	.rich-link:hover {
		opacity: 0.7;
	}
	.rich-list {
		padding-left: 1.5em;
	}
	ul.rich-list {
		list-style-type: disc;
	}
	ol.rich-list {
		list-style-type: decimal;
	}
</style>
