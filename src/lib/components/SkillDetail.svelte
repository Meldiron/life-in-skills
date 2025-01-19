<script lang="ts">
	import { tick } from 'svelte';
	import SkillSettings from './SkillSettings.svelte';
	import { getGraphProgress, getLevel, getXp } from '$lib/levels';
	import SkillActivity from './SkillActivity.svelte';
	import { hasBonus } from '$lib/skills';
	import type { Skill } from '$lib/appwrite';
	import { storeUser } from '$lib/store.svelte';

	interface Props {
		skill: Skill;
		id: string;
		admin: boolean;
	}

	let { skill, id, admin = false }: Props = $props();

	let remainingXp = $derived(
		getXp(skill.targetLevel ? skill.targetLevel - 1 : 0) - (skill.xp ?? 0)
	);

	let bonusXp = storeUser.value?.prefs?.dailyBonus ?? 3;

	async function editSkill() {
		// @ts-ignore
		window.HSOverlay.getInstance('#skill-edit-' + skill.$id, true).element.open();
	}

	let activityXp = $state(0);
	let activityEffortName = $state('');
	async function addActivity(amount: number, name: string) {
		activityXp = amount;
		activityEffortName = name;

		await tick();
		// @ts-ignore
		window.HSOverlay.getInstance('#skill-activity-' + skill.$id, true).element.open();
	}
</script>

<div
	{id}
	class="overflow-y-auto mx-auto max-w-[30rem] p-4 rounded-t-xl hs-overlay hs-overlay-open:translate-y-0 translate-y-full fixed bottom-0 inset-x-0 transition-all duration-300 transform max-h-[90%] h-[fit-content] size-full z-[80] bg-neutral-950"
	role="dialog"
	tabindex="-1"
>
	<div
		class="flex sm:flex-row gap-4 sm:gap-2 flex-col-reverse justify-between items-center py-2 px-4"
	>
		<div class="flex gap-2 items-center gap-3">
			<div
				class="bg-neutral-800 text-neutral-400 text-center min-w-[45px] py-2 px-3 text-2xl rounded-xl h-[fit-content]"
			>
				<span>{skill.icon ?? ''}</span>
			</div>
			<div>
				<h3 class="line-clamp-1 font-bold text-gray-800 text-xl dark:text-white">
					{skill.name ?? ''}
				</h3>

				<p class={`text-sm ${remainingXp <= 0 ? 'text-green-500' : 'text-green-500'} line-clamp-1`}>
					{skill.reward ? skill.reward : 'No reward set yet'}
				</p>
			</div>
		</div>

		<div class="flex items-center gap-3 sm:gap-2 flex-shrink-0">
			{#if admin}
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
			{/if}

			<button
				type="button"
				class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-400 dark:focus:bg-neutral-700"
				aria-label="Close"
				data-hs-overlay={`#${id}`}
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
		{#if admin && skill.reward && remainingXp <= 0}
			<div
				class="mb-4 -mt-2 bg-green-50 border border-green-200 text-sm text-green-800 rounded-lg p-4 dark:bg-green-800/10 dark:border-green-900 dark:text-green-500"
				role="alert"
				tabindex="-1"
				aria-labelledby="hs-with-description-label"
			>
				<div class="flex">
					<div class="shrink-0">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							class="shrink-0 size-6 mt-0.5"
						>
							<path
								fill-rule="evenodd"
								d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ms-4">
						<h3 id="hs-with-description-label" class="text-sm font-semibold">
							Target level achieved!
						</h3>
						<div class="mt-1 text-sm text-green-700">
							Provide yourself with reward, and edit skill to set a new challanging target level,
							and it's reward.
						</div>
					</div>
				</div>
			</div>
		{/if}
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
							<span class="me-3 flex-1 w-0 truncate text-white"> Current level </span>
							<button type="button" class="flex items-center text-lg gap-x-2 font-semibold">
								{getLevel(skill.xp ?? 0)}
							</button>
						</div>
					</li>
					<li
						class="flex items-center gap-x-2 p-3 py-1.5 text-sm bg-white border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-lg dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-200"
					>
						<div class="w-full flex justify-between truncate items-center">
							<span class="me-3 flex-1 w-0 truncate text-white"> Target level </span>
							<button type="button" class="flex items-center text-lg gap-x-2 font-semibold">
								{skill.targetLevel ?? 0}
							</button>
						</div>
					</li>
					<li
						class="flex items-center gap-x-2 p-3 py-2 text-xs bg-white border-t-none border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-md dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-200"
					>
						<div class="w-full flex justify-between truncate items-center">
							<span class="me-3 flex-1 w-0 truncate text-white"> Total XP </span>
							<button type="button" class="flex items-center gap-x-2">
								{skill.xp ?? 0}
							</button>
						</div>
					</li>
					<li
						class="flex items-center gap-x-2 p-3 py-2 text-xs bg-white border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-md dark:bg-green-950 dark:border-green-800 dark:text-neutral-200"
					>
						<div class="w-full flex justify-between truncate items-center">
							<span class="me-3 flex-1 w-0 truncate text-green-500"> Remaining XP </span>
							<button type="button" class="flex items-center gap-x-2">
								{remainingXp <= 0 ? 'None' : remainingXp}
							</button>
						</div>
					</li>
				</ul>
				<!-- End List Group -->
			</div>
		</div>

		{#if admin}
			<hr class="hidden sm:block border-neutral-800 my-6 border-[1px]" />

			<div class="block sm:hidden mt-6"></div>

			<div class="rounded-lg w-full">
				<button
					onclick={() => addActivity(1, '')}
					type="button"
					class="rounded-lg sm:rounded-none py-3 px-4 w-full inline-flex flex flex-col items-center gap-x-2 -ms-px sm:first:rounded-s-lg first:ms-0 sm:last:rounded-e-lg text-sm font-medium focus:z-10 border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 sm:p-5"
				>
					<div class="flex sm:flex-col gap-3 sm:gap-0 items-center">
						<p class="text-neutral-400 line-clamp-1">Add XP</p>
					</div>
					{#if hasBonus(skill) && bonusXp > 0}
						<p class="mt-1.5 text-xs px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded-full">
							+{bonusXp}XP bonus
						</p>
					{/if}
				</button>
			</div>
		{/if}
	</div>
</div>

{#if admin}
	<SkillSettings id={`skill-edit-${skill.$id}`} {skill} />
	<SkillActivity
		id={`skill-activity-${skill.$id}`}
		effortName={activityEffortName}
		amount={activityXp}
		{skill}
	/>
{/if}
