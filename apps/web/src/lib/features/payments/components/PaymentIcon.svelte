<script lang="ts">
	let {
		name,
		size = 24
	}: {
		name: 'qr' | 'bank' | 'check' | 'arrow' | 'lock' | 'copy' | 'clock' | 'download' | 'spark';
		size?: number;
	} = $props();
	const paths = {
		qr: 'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6zM12 3v3M3 12h3M12 12h6M12 18v3M21 12v3',
		bank: 'm3 9 9-6 9 6H3Zm2 3v6m7-6v6m7-6v6M3 21h18',
		check: 'm5 12 4 4L19 6',
		arrow: 'M5 12h14m-6-6 6 6-6 6',
		lock: 'M6 10h12v11H6zM8 10V7a4 4 0 0 1 8 0v3m-4 5v2',
		copy: 'M9 9h12v12H9zM5 15H3V3h12v2',
		clock: 'M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
		download: 'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',
		spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z'
	};
</script>

<svg
	aria-hidden="true"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"><path d={paths[name]} /></svg
>
