<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import { invalidateAll } from '$app/navigation';
	import { databases, type Activity, type Skill } from '$lib/appwrite';
	import { capitalizeFirstLetter } from '$lib/helpers';
	import { getLevel } from '$lib/levels';
	import { hasBonus } from '$lib/skills';
	import { toast } from '$lib/toast';
	import { ID } from 'appwrite';
	import { storeUser } from '$lib/store.svelte';

	interface Props {
		id: string;
		amount: number;
		skill: Skill;
		effortName: string;
	}

	let { amount = $bindable(0), skill, id, effortName }: Props = $props();

	let activityNote = $state('');

	let experienceShowCustom = $state(false);

	$effect(() => {
		if (amount >= 10 && !experienceShowCustom) {
			experienceShowCustom = true;
		}
	});

	let size = $state(amount === 1 ? 'small' : amount === 5 ? 'medium' : 'big');

	let bonusXp = storeUser.value?.prefs?.dailyBonus ?? 3;

	let addingXp = $state(false);
	async function addXpFinish() {
		if (!skill || addingXp || !amount) {
			return;
		}

		if (hasBonus(skill) && bonusXp > 0) {
			amount += bonusXp;
		}

		addingXp = true;

		try {
			const oldXp = skill.xp;
			skill.xp = skill.xp + amount;
			skill.lastActivityAt = new Date().toISOString();

			await databases.updateDocument<Skill>('main', 'skills', skill.$id, {
				xp: skill.xp,
				lastActivityAt: skill.lastActivityAt
			});

			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `+${amount} XP in ${skill.name} for ${effortName}`,
				note: activityNote,
				icon: skill.icon
			});

			const previousLevel = getLevel(oldXp);
			const nextLevel = getLevel(skill.xp);

			if (previousLevel !== nextLevel) {
				await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
					text: `${capitalizeFirstLetter(skill.name)} leveled up to ${nextLevel}`,
					icon: skill.icon
				});

				await invalidateAll();

				// @ts-ignore
				celebrateLevel();

				toast.open({
					type: 'success',
					message: `<b>${capitalizeFirstLetter(skill.name)}</b> leveled up to <b>${nextLevel}</b>`
				});
			} else {
				await invalidateAll();
			}

			// @ts-ignore
			window.HSOverlay.getInstance('#skill-activity-' + skill.$id, true).element.close();

			// @ts-ignore
			window.HSOverlay.getInstance('#skill-detail-' + skill.$id, true).element.open();

			setTimeout(() => {
				if (size === 'small') {
					// @ts-ignore
					celebrateSmall();
				} else if (size === 'medium') {
					// @ts-ignore
					celebrateMedium();
				} else if (size === 'big') {
					// @ts-ignore
					celebrateBig();
				}
			}, 300);

			activityNote = '';
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			addingXp = false;
		}
	}
</script>

<div
	{id}
	class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
	role="dialog"
	tabindex="-1"
>
	<div
		class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto"
	>
		<form
			onsubmit={preventDefault(addXpFinish)}
			class="flex flex-col bg-white border shadow-sm rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70"
		>
			<div class="flex justify-between items-center py-3 px-4 border-b dark:border-neutral-700">
				<h3 class="font-bold text-gray-800 dark:text-white">Activity</h3>
				<button
					type="button"
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
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
			<div class="p-4 overflow-y-auto">
				<label for="input-label" class="mb-2 block text-sm font-medium dark:text-white">
					{#if !experienceShowCustom}
						<span class="mr-0.5 font-bold text-white rounded-xl bg-neutral-900 px-3 py-1"
							>{amount}</span
						>
					{/if}
					<span>Experience</span>
				</label>
				<input
					bind:value={amount}
					type="range"
					class="w-full bg-transparent cursor-pointer appearance-none disabled:opacity-50 disabled:pointer-events-none focus:outline-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:-mt-0.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(37,99,235,1)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:ease-in-out [&::-webkit-slider-thumb]:dark:bg-neutral-700 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-blue-600 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150 [&::-moz-range-thumb]:ease-in-out [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-gray-100 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:dark:bg-neutral-700 [&::-moz-range-track]:w-full [&::-moz-range-track]:h-2 [&::-moz-range-track]:bg-gray-100 [&::-moz-range-track]:rounded-full"
					aria-orientation="horizontal"
					min="1"
					max="10"
					step="1"
				/>

				{#if experienceShowCustom}
					<input
						type="number"
						required={true}
						bind:value={amount}
						class="mt-1.5 py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:placeholder-neutral-500 dark:text-neutral-400"
						placeholder="Enter custom amount"
					/>
				{/if}
			</div>
			<div class="p-4 overflow-y-auto">
				<label for="input-label" class="block text-sm font-medium mb-2 dark:text-white"
					>Effort</label
				>
				<input
					type="text"
					required={true}
					bind:value={effortName}
					class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:placeholder-neutral-500 dark:text-neutral-400"
					placeholder="Clean washing machine, Watered garden, Math homework, ..."
				/>
			</div>
			<div class="p-4 overflow-y-auto">
				<label for="input-label" class="block text-sm font-medium mb-2 dark:text-white">Note</label>
				<input
					type="text"
					required={false}
					autofocus={true}
					bind:value={activityNote}
					class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:placeholder-neutral-500 dark:text-neutral-400"
					placeholder="Clean washing machine, Watered garden, Math homework, ..."
				/>
			</div>
			<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t dark:border-neutral-700">
				<button
					disabled={addingXp}
					type="submit"
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
				>
					Submit
				</button>
			</div>
		</form>
	</div>
</div>
