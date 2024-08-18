<script lang="ts">
	import { databases, type Activity } from '$lib/appwrite';
	import { toast } from '$lib/toast';
	import { Query } from 'appwrite';
	import type { PageData } from './$types';
	import * as moment from 'moment';

	export let data: PageData;

	let canLoadMore = data.activities.length >= 50;
	let loading = false;
	async function loadMore() {
		if (loading) {
			return;
		}

		loading = true;
		try {
			const response = await databases.listDocuments<Activity>('main', 'activity', [
				Query.orderDesc('$id'),
				Query.limit(50),
				Query.cursorAfter(data.activities[data.activities.length - 1].$id)
			]);
			if (response.documents.length === 0) {
				canLoadMore = false;
			}
			data.activities = [...data.activities, ...response.documents];
			data.activities = data.activities;
			data = data;
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			loading = false;
		}
	}
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

		<span>Activity</span>
	</div>
</h2>

<div class="mt-6">
	<!-- Timeline -->
	<div class="relative">
		{#each data.activities as activity}
			<!-- Item -->
			<div class="flex gap-x-3">
				<!-- Icon -->
				<div
					class="relative last:after:hidden after:absolute after:top-7 after:bottom-0 after:start-3.5 after:w-px after:-translate-x-[0.5px] after:bg-gray-200 dark:after:bg-neutral-700"
				>
					<div class="relative z-10 size-7 flex justify-center items-center">
						<div class="size-2 rounded-full bg-gray-400 dark:bg-neutral-600"></div>
					</div>
				</div>
				<!-- End Icon -->

				<!-- Right Content -->
				<div class="grow pt-0.5 pb-8">
					<h3 class="flex gap-x-1.5 font-semibold text-gray-800 dark:text-white">
						{activity.text}
					</h3>
					<p class="mt-1 text-sm text-gray-600 dark:text-neutral-500 flex items-center gap-1">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="size-4"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
							/>
						</svg>

						{moment.default(activity.$createdAt).format('D MMM YYYY \\a\\t HH:mm')}
					</p>
				</div>
				<!-- End Right Content -->
			</div>
			<!-- End Item -->
		{/each}
	</div>

	<div
		class="relative h-6 w-full -mt-5 bg-gradient-to-t from-neutral-900 z-[5] to-transparent"
	></div>

	{#if canLoadMore}
		<button
			disabled={loading}
			on:click={loadMore}
			type="button"
			class="mt-2 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
		>
			Load older activity
		</button>
	{/if}
	<!-- End Timeline -->
</div>
