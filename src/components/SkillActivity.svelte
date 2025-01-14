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

	let { amount, skill, id, effortName }: Props = $props();

	let activityNote = $state('');

	let bonusXp = storeUser.value.prefs?.dailyBonus ?? 3;

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
				note: activityNote
			});

			const previousLevel = getLevel(oldXp);
			const nextLevel = getLevel(skill.xp);

			if (previousLevel !== nextLevel) {
				await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
					text: `${capitalizeFirstLetter(skill.name)} leveled up to ${nextLevel}`
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
				if (amount === 1) {
					// @ts-ignore
					celebrateSmall();
				} else if (amount === 5) {
					// @ts-ignore
					celebrateMedium();
				} else if (amount === 10) {
					// @ts-ignore
					celebrateBig();
				}
			}, 300);
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
				<label for="input-label" class="block text-sm font-medium mb-2 dark:text-white"
					>What were you doing?</label
				>
				<input
					id="skill-activity-note"
					type="text"
					required={true}
					bind:value={activityNote}
					class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:placeholder-neutral-500 dark:text-neutral-400"
					placeholder="Clean washing machine, Watered garden, Math homework, ..."
				/>
			</div>
			<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t dark:border-neutral-700">
				<button
					disabled={addingXp}
					onclick={addXpFinish}
					type="button"
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
					data-hs-overlay="#hs-focus-management-modal"
				>
					Skip
				</button>
				<button
					disabled={addingXp}
					type="submit"
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
				>
					Save details
				</button>
			</div>
		</form>
	</div>
</div>
