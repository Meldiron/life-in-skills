<script lang="ts">
	import { tick } from 'svelte';
	import SkillSettings from './SkillSettings.svelte';
	import { getGraphProgress, getLevel, getXp } from '$lib/levels';
	import SkillActivity from './SkillActivity.svelte';
	import { hasBonus } from '$lib/skills';
	import type { Skill } from '$lib/appwrite';

	interface Props {
		skill: Skill;
	}

	let { skill }: Props = $props();

	let bonusXp = 1; // TODO: Get from user prefs

	let isEditing = $state(false);
	async function editSkill() {
		isEditing = true;
		await tick();
		// @ts-ignore
		window.HSOverlay.open(document.getElementById('new-skill'));
	}

	let isAddingActivity = $state(false);
	let activityXp = $state(0);
	async function addActivity(amount: number) {
		activityXp = amount;
		isAddingActivity = true;
		await tick();
		// @ts-ignore
		window.HSOverlay.open(document.getElementById('skill-activity'));
		await tick();
		document.getElementById('skill-activity-note')?.focus();
	}
</script>

<div
	id="active-skill"
	class="overflow-y-auto mx-auto max-w-[30rem] p-4 rounded-t-xl hs-overlay hs-overlay-open:translate-y-0 translate-y-full fixed bottom-0 inset-x-0 transition-all duration-300 transform max-h-[90%] h-[fit-content] size-full z-[80] bg-neutral-950"
	role="dialog"
	tabindex="-1"
>
	<div class="flex justify-between items-center py-2 px-4">
		<div class="flex gap-2 items-center gap-3">
			<div class="bg-neutral-800 py-2 px-3 text-2xl rounded-xl h-[fit-content]">
				<span>{skill.icon ?? ''}</span>
			</div>
			<div>
				<h3
					id="hs-offcanvas-bottom-label"
					class="line-clamp-1 font-bold text-gray-800 text-xl dark:text-white"
				>
					{skill.name ?? ''}
				</h3>

				<p class="text-sm text-neutral-500 line-clamp-1">
					{skill.reward ?? 'No reward set yet'}
				</p>
			</div>
		</div>

		<div class="items-center gap-2">
			<button
				onclick={editSkill}
				type="button"
				class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-400 dark:focus:bg-neutral-700"
				aria-label="Close"
			>
				<span class="sr-only">Edit</span>

				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="shrink-0 size-4"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
					/>
				</svg>
			</button>

			<button
				type="button"
				class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-400 dark:focus:bg-neutral-700"
				aria-label="Close"
				data-hs-overlay="#active-skill"
			>
				<span class="sr-only">Close</span>
				<svg
					class="shrink-0 size-4"
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 6 6 18"></path>
					<path d="m6 6 12 12"></path>
				</svg>
			</button>
		</div>
	</div>
	<div class="p-4">
		<div class="grid grid-cols-6 sm:grid-cols-12 gap-4">
			<div class="col-span-6 flex justify-center">
				<!-- Gauge Component -->
				<div class="relative size-40 transform -translate-y-2">
					<svg
						class="rotate-[-45deg] size-full"
						viewBox="0 0 36 36"
						xmlns="http://www.w3.org/2000/svg"
					>
						<!-- Background Circle (Gauge) -->
						<circle
							cx="18"
							cy="18"
							r="16"
							fill="none"
							class="stroke-current text-neutral-800"
							stroke-width="1.5"
							stroke-dasharray="75 100"
							stroke-linecap="round"
						></circle>

						<!-- Gauge Progress -->
						<circle
							cx="18"
							cy="18"
							r="16"
							fill="none"
							class="stroke-current text-[#e18f49] transition translate-all duration-1000"
							stroke-width="1.5"
							stroke-dasharray={`${getGraphProgress(skill)} 100`}
							stroke-linecap="round"
						></circle>
					</svg>

					<!-- Value Text -->
					<div
						class="absolute top-1/2 start-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
					>
						<span class="text-3xl font-bold text-[#e18f49]"
							>{getXp(getLevel(skill.xp ?? 0)) - (skill.xp ?? 0)}
							<span class="text-xs">XP</span></span
						>
						<span class="text-neutral-100 block">to level up</span>
					</div>
				</div>
				<!-- End Gauge Component -->
			</div>

			<div class="col-span-6">
				<!-- List Group -->
				<ul class="flex flex-col justify-end text-start -space-y-px">
					<li
						class="flex items-center gap-x-2 p-3 py-1.5 text-sm bg-white border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-lg dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-200"
					>
						<div class="w-full flex justify-between truncate items-center">
							<span class="me-3 flex-1 w-0 truncate text-neutral-400"> Current level </span>
							<button type="button" class="flex items-center text-lg gap-x-2 font-semibold">
								{getLevel(skill.xp ?? 0)}
							</button>
						</div>
					</li>
					<li
						class="flex items-center gap-x-2 p-3 py-1.5 text-sm bg-white border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-lg dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-200"
					>
						<div class="w-full flex justify-between truncate items-center">
							<span class="me-3 flex-1 w-0 truncate text-neutral-400"> Target level </span>
							<button type="button" class="flex items-center text-lg gap-x-2 font-semibold">
								{skill.targetLevel ?? 0}
							</button>
						</div>
					</li>
					<li
						class="flex items-center gap-x-2 p-3 py-2 text-xs bg-white border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-md dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-200"
					>
						<div class="w-full flex justify-between truncate items-center">
							<span class="me-3 flex-1 w-0 truncate text-neutral-400"> Total XP </span>
							<button type="button" class="flex items-center gap-x-2">
								{skill.xp ?? 0}
							</button>
						</div>
					</li>
					<li
						class="flex items-center gap-x-2 p-3 py-2 text-xs bg-white border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-md dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-200"
					>
						<div class="w-full flex justify-between truncate items-center">
							<span class="me-3 flex-1 w-0 truncate text-neutral-400"> Remaining XP </span>
							<button type="button" class="flex items-center gap-x-2">
								{getXp(skill.targetLevel ?? 0) - (skill.xp ?? 0)}
							</button>
						</div>
					</li>
				</ul>
				<!-- End List Group -->
			</div>
		</div>

		<hr class="hidden sm:block border-neutral-800 my-6 border-[1px]" />

		<div class="block sm:hidden mt-6"></div>

		<div class="grid grid-cols-4 sm:grid-cols-12 gap-3 sm:gap-0 rounded-lg w-full">
			<button
				onclick={() => addActivity(1)}
				type="button"
				class="rounded-lg sm:rounded-none py-3 px-4 col-span-4 inline-flex flex flex-col items-center gap-x-2 -ms-px sm:first:rounded-s-lg first:ms-0 sm:last:rounded-e-lg text-sm font-medium focus:z-10 border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 sm:p-5"
			>
				<div class="flex sm:flex-col gap-3 sm:gap-0 items-center">
					<p class="text-neutral-400 line-clamp-1">{skill.smallXpName}</p>
					<p class="text-white text-xs flex-shrink-0"><span class="text-lg">+1</span> XP</p>
				</div>
				{#if hasBonus(skill) && bonusXp > 0}
					<p class="mt-1.5 text-xs px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded-full">
						+{bonusXp}XP bonus
					</p>
				{/if}
			</button>
			<button
				onclick={() => addActivity(5)}
				type="button"
				class="rounded-lg sm:rounded-none py-3 px-4 col-span-4 inline-flex flex flex-col items-center gap-x-2 -ms-px sm:first:rounded-s-lg first:ms-0 sm:last:rounded-e-lg text-sm font-medium focus:z-10 border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 sm:p-5"
			>
				<div class="flex sm:flex-col gap-3 sm:gap-0 items-center">
					<p class="text-neutral-200 line-clamp-1">{skill.mediumXpName}</p>
					<p class="text-white text-xs flex-shrink-0"><span class="text-lg">+5</span> XP</p>
				</div>
				{#if hasBonus(skill) && bonusXp > 0}
					<p class="mt-1.5 text-xs px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded-full">
						+{bonusXp}XP bonus
					</p>
				{/if}
			</button>
			<button
				onclick={() => addActivity(10)}
				type="button"
				class="rounded-lg sm:rounded-none py-3 px-4 col-span-4 inline-flex flex flex-col items-center gap-x-2 -ms-px sm:first:rounded-s-lg first:ms-0 sm:last:rounded-e-lg text-sm font-medium focus:z-10 border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 sm:p-5"
			>
				<div class="flex sm:flex-col gap-3 sm:gap-0 items-center">
					<p class="text-[#e18f49] line-clamp-1">{skill.bigXpName}</p>
					<p class="text-white text-xs flex-shrink-0"><span class="text-lg">+10</span> XP</p>
				</div>

				{#if hasBonus(skill) && bonusXp > 0}
					<p class="mt-1.5 text-xs px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded-full">
						+{bonusXp}XP bonus
					</p>
				{/if}
			</button>
		</div>
	</div>
</div>

<SkillSettings {skill} />

{#if isAddingActivity}
	<SkillActivity amount={activityXp} {skill} />
{/if}
