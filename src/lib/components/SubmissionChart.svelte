<!-- src/lib/components/SubmissionChart.svelte -->
<script lang="ts">
	import {
		Chart,
		LineController, // <--- ADD THIS
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		Title,
		Tooltip,
		Legend,
		Filler,
		type ChartConfiguration
	} from 'chart.js';

	// Register Chart.js components
	Chart.register(
		LineController, // <--- REGISTER THIS
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		Title,
		Tooltip,
		Legend,
		Filler
	);

	let { data } = $props<{ data: { date: string; count: number }[] }>();

	let canvas = $state<HTMLCanvasElement>();
	let chartInstance: Chart | null = null;

	$effect(() => {
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const config: ChartConfiguration = {
			type: 'line', // This requires LineController
			data: {
				labels: [],
				datasets: []
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: {
						backgroundColor: '#111827',
						titleFont: { size: 13 },
						bodyFont: { size: 13 },
						padding: 10,
						cornerRadius: 8,
						displayColors: false,
						callbacks: {
							label: (context) => ` ${context.parsed.y} submissions`
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						grid: { color: '#f3f4f6' },
						ticks: { precision: 0 },
						border: { display: false }
					},
					x: {
						grid: { display: false },
						border: { display: false }
					}
				},
				interaction: {
					intersect: false,
					mode: 'index'
				}
			}
		};

		chartInstance = new Chart(ctx, config);

		return () => {
			if (chartInstance) {
				chartInstance.destroy();
				chartInstance = null;
			}
		};
	});

	$effect(() => {
		if (chartInstance && data) {
			chartInstance.data = {
				labels: data.map((d: { date: string; count: number }) => d.date),
				datasets: [
					{
						label: 'Submissions',
						data: data.map((d: { date: string; count: number }) => d.count),
						fill: true,
						borderColor: 'rgb(37, 99, 235)',
						backgroundColor: 'rgba(37, 99, 235, 0.1)',
						tension: 0.4,
						borderWidth: 2,
						pointRadius: 4,
						pointBackgroundColor: '#ffffff',
						pointBorderColor: 'rgb(37, 99, 235)',
						pointBorderWidth: 2,
						pointHoverRadius: 6
					}
				]
			};
			chartInstance.update();
		}
	});
</script>

<div class="w-full bg-white rounded-lg border p-6 shadow-sm h-[350px]">
	{#if data.length > 0}
		<canvas bind:this={canvas}></canvas>
	{:else}
		<div class="h-full flex items-center justify-center text-gray-400 italic">
			Not enough data to generate graph.
		</div>
	{/if}
</div>
