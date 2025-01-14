<script lang="ts">
	import { type Combat } from '$lib/appwrite';

	interface Props {
		combat: Combat;
		admin: boolean;
	}

	let { combat, admin = false }: Props = $props();
</script>

<!-- File Uploading Progress Form -->
<div
	class={`border rounded-xl shadow-sm p-4 dark:bg-neutral-800 dark:border-neutral-700 ${admin ? 'rounded-b-none' : ''}`}
>
	<!-- Uploading File Content -->
	<div
		class="mb-2 flex flex-col-reverse item-start sm:flex-row gap-3 justify-between sm:items-center"
	>
		<div class="flex items-start sm:items-center gap-x-3">
			<span
				class="size-8 shrink-0 flex justify-center items-center border border-gray-200 text-gray-500 rounded-lg dark:border-neutral-700 dark:text-neutral-500"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="size-5 text-neutral-400 shrink-0"
				>
					<path
						d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"
					/>
				</svg>
			</span>
			<div>
				<p class="text-sm font-medium text-gray-800 dark:text-white">Health points</p>
				<p class="text-xs text-gray-500 dark:text-neutral-500">
					{admin ? 'Deaths stay forever on your profile!' : "Hero's status when fighting cravings"}
				</p>
			</div>
		</div>
		<div class="inline-flex items-center gap-x-2">
			{#if combat.deaths === 0}
				<span class="relative">
					<span
						class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-500"
					>
						<p>No deaths yet</p>
					</span>
				</span>
			{:else}
				<span class="relative">
					<span
						class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500"
					>
						<p>{combat.deaths} {combat.deaths === 1 ? 'death' : 'deaths'}</p>
					</span>
				</span>
			{/if}
		</div>
	</div>
	<!-- End Uploading File Content -->

	<!-- Progress Bar -->
	<div class="sm:pl-10 flex items-center gap-x-3 whitespace-nowrap">
		<div class="text-center">
			<span class="text-gray-800 dark:text-white text-xl font-semibold tracking-wider"
				>{combat.hp}<span class="text-neutral-500 text-sm font-light"
					><span class="mx-1">/</span>12</span
				></span
			>
		</div>

		<div
			class="transform translate-y-0.5 flex w-full h-3 bg-gray-200 rounded-full overflow-hidden dark:bg-neutral-700"
			role="progressbar"
		>
			<div
				class={`${combat.hp <= 6 ? 'bg-red-500' : 'bg-green-500'} flex flex-col justify-center rounded-full overflow-hidden text-xs text-white text-center whitespace-nowrap transition duration-500`}
				style={`width: ${Math.ceil((combat.hp / 12) * 100)}%`}
			></div>
		</div>
	</div>
	<!-- End Progress Bar -->
</div>
<!-- End File Uploading Progress Form -->
