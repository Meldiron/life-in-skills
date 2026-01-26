<script lang="ts">
	import type { PageData } from './$types';
	import Inventory from '$lib/components/Inventory.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<h2
	class="text-2xl font-bold md:text-4xl md:leading-tight dark:text-white flex justify-between items-center gap-3"
>
	<div class="flex items-center gap-3">
		<div class="bg-neutral-800 p-3 rounded-2xl">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="size-6 text-[#e18f49]"
			>
				<path
					d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z"
				/>
				<path
					fill-rule="evenodd"
					d="m3.087 9 .54 9.176A3 3 0 0 0 6.62 21h10.757a3 3 0 0 0 2.995-2.824L20.913 9H3.087Zm6.163 3.75A.75.75 0 0 1 10 12h4a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.75-.75Z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>

		<span>Inventory</span>
	</div>
</h2>

<div class="mt-6">
	<Inventory inventoryItems={data.inventoryItems} admin={true} />
</div>
