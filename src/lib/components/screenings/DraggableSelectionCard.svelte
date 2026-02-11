<script lang="ts">
	interface Props {
		filmId: string;
		ondragstart: (e: DragEvent, id: string) => void;
		ondragend: () => void;
		children: any;
	}

	let { filmId, ondragstart, ondragend, children }: Props = $props();
</script>

<div
	role="listitem"
	draggable="true"
	ondragstart={(e) => ondragstart(e, filmId)}
	{ondragend}
	class="cursor-grab active:cursor-grabbing h-full"
>
	{@render children()}
</div>
