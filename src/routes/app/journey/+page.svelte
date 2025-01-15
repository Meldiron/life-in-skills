<script lang="ts">
	import { run } from 'svelte/legacy';

	import { databases, type Activity } from '$lib/appwrite';
	import { toast } from '$lib/toast';
	import { Query } from 'appwrite';
	import type { PageData } from './$types';
	import * as moment from 'moment';

	interface Props {
		data: PageData;
	}

	let { data = $bindable() }: Props = $props();

	let days: any[] = $state([]);

	function syncDays(data: PageData) {
		for (const activity of data.activities) {
			const dateKey = moment.default(activity.$createdAt).format('YYYY-MM-DD');

			let daysDate = days.find((day) => day.date === dateKey);
			if (!daysDate) {
				days.push({
					date: dateKey,
					activities: []
				});
			}

			daysDate = days.find((day) => day.date === dateKey);

			const existingActivity = daysDate.activities.find((a: any) => a.$id === activity.$id);
			if (existingActivity) {
				continue;
			}

			daysDate.activities.push(activity);
		}

		days = days.sort((a, b) => {
			return moment.default(b.date).unix() > moment.default(a.date).unix() ? 1 : -1;
		});
	}

	let canLoadMore = $state(data.activities.length >= 50);
	let loading = $state(false);
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
			if (response.documents.length === 0 || response.documents.length < 50) {
				canLoadMore = false;
			}
			data.activities = [...data.activities, ...response.documents];
			data.activities = data.activities;
			data = data;

			syncDays(data);
			days = days;
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			loading = false;
		}
	}
	run(() => {
		syncDays(data);
	});
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

		<span>Journey</span>
	</div>
</h2>

<div class="mt-6">
	<!-- Timeline -->
	<div class="relative">
		{#each days as day}
			<!-- Heading -->
			<blockquote class="relative mb-4 mt-10">
				<svg
					class="absolute -top-6 -start-8 size-16 text-gray-100 dark:text-neutral-700"
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path
						d="M7.39762 10.3C7.39762 11.0733 7.14888 11.7 6.6514 12.18C6.15392 12.6333 5.52552 12.86 4.76621 12.86C3.84979 12.86 3.09047 12.5533 2.48825 11.94C1.91222 11.3266 1.62421 10.4467 1.62421 9.29999C1.62421 8.07332 1.96459 6.87332 2.64535 5.69999C3.35231 4.49999 4.33418 3.55332 5.59098 2.85999L6.4943 4.25999C5.81354 4.73999 5.26369 5.27332 4.84476 5.85999C4.45201 6.44666 4.19017 7.12666 4.05926 7.89999C4.29491 7.79332 4.56983 7.73999 4.88403 7.73999C5.61716 7.73999 6.21938 7.97999 6.69067 8.45999C7.16197 8.93999 7.39762 9.55333 7.39762 10.3ZM14.6242 10.3C14.6242 11.0733 14.3755 11.7 13.878 12.18C13.3805 12.6333 12.7521 12.86 11.9928 12.86C11.0764 12.86 10.3171 12.5533 9.71484 11.94C9.13881 11.3266 8.85079 10.4467 8.85079 9.29999C8.85079 8.07332 9.19117 6.87332 9.87194 5.69999C10.5789 4.49999 11.5608 3.55332 12.8176 2.85999L13.7209 4.25999C13.0401 4.73999 12.4903 5.27332 12.0713 5.85999C11.6786 6.44666 11.4168 7.12666 11.2858 7.89999C11.5215 7.79332 11.7964 7.73999 12.1106 7.73999C12.8437 7.73999 13.446 7.97999 13.9173 8.45999C14.3886 8.93999 14.6242 9.55333 14.6242 10.3Z"
						fill="currentColor"
					></path>
				</svg>

				<div class="relative z-10">
					<p class="text-xl text-gray-800 md:text-3xl md:leading-normal dark:text-white">
						<em>
							{moment.default(day.date).format('D MMM YYYY')}
						</em>
					</p>
				</div>
			</blockquote>
			<!-- End Heading -->

			{#each day.activities as activity, index}
				<!-- Item -->
				<div class="flex gap-x-3">
					<!-- Icon -->
					<div
						class={`relative ${index === day.activities.length - 1 ? 'after:hidden' : ''} after:absolute after:top-7 after:bottom-0 after:start-4 after:w-px after:-translate-x-[0.5px] after:bg-gray-200 dark:after:bg-neutral-700`}
					>
						<div
							class="relative z-10 size-8 flex justify-center items-center bg-neutral-800 rounded-full"
						>
							<p class="text-sm">{activity.icon ? activity.icon : ''}</p>
						</div>
					</div>
					<!-- End Icon -->

					<!-- Right Content -->
					<div class="grow pt-0.5 pb-8">
						<h3 class="flex gap-x-1.5 font-semibold text-gray-800 dark:text-white">
							{activity.text}
						</h3>
						{#if activity.note}
							<p class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
								{activity.note}
							</p>
						{/if}
						<div
							class="mt-1 -ms-1 p-1 flex items-center gap-x-1 text-xs rounded-lg border border-transparent text-gray-500 items-center disabled:opacity-50 disabled:pointer-events-none dark:text-neutral-400"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="size-4 text-neutral-600"
							>
								<path
									fill-rule="evenodd"
									d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
									clip-rule="evenodd"
								/>
							</svg>
							{moment.default(activity.$createdAt).format('HH:mm')}
						</div>
					</div>
					<!-- End Right Content -->
				</div>
				<!-- End Item -->
			{/each}
		{/each}
	</div>

	<div
		class="relative h-6 w-full -mt-5 bg-gradient-to-t from-neutral-900 z-[5] to-transparent"
	></div>

	{#if canLoadMore}
		<button
			disabled={loading}
			onclick={loadMore}
			type="button"
			class="mt-2 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
		>
			Load older activity
		</button>
	{/if}
	<!-- End Timeline -->
</div>
