<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import { invalidateAll } from '$app/navigation';
	import { databases, type Activity, type Skill, account } from '$lib/appwrite';
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

	let { amount = $bindable(1), skill, id, effortName = $bindable('') }: Props = $props();

	let activityNote = $state('');

	let experienceShowCustom = $state(false);

	let isExactPreset = $state(false);

	$effect(() => {
		if (amount >= 10 && !experienceShowCustom) {
			experienceShowCustom = true;
		}
	});

	let size = $state(amount === 1 ? 'small' : amount === 5 ? 'medium' : 'big');

	let bonusXp = storeUser.value?.prefs?.dailyBonus ?? 3;

	let presets = $derived([
		{
			amount: 1,
			effortName: 'Custom',
			note: ''
		},
		...(JSON.parse(storeUser.value?.prefs?.presets ?? '{}')[skill.$id] ?? [])
	]);

	let activePreset = $state('Custom');

	function activatePreset(preset: any) {
		amount = preset.amount;
		effortName = preset.effortName === 'Custom' ? '' : preset.effortName;
		activityNote = preset.note;

		activePreset = preset.effortName;

		isExactPreset = preset.effortName === 'Custom' ? false : true;
	}

	$effect(() => {
		if (effortName !== activePreset) {
			isExactPreset = false;
		}
	});

	$effect(() => {
		const presetEffortName =
			presets.find((preset) => preset.effortName === activePreset)?.effortName ?? '';
		console.log(presetEffortName);
		if (presetEffortName !== effortName) {
			activePreset = 'Custom';
			isExactPreset = false;
		}
	});

	let addingXp = $state(false);
	async function addXpFinish() {
		if (!skill || addingXp || !amount) {
			return;
		}

		let bonusXpToAdd = 0;
		if (hasBonus(skill) && bonusXp > 0) {
			bonusXpToAdd = bonusXp;
		}

		addingXp = true;

		try {
			const oldXp = skill.xp;
			skill.xp = skill.xp + amount + bonusXpToAdd;
			skill.lastActivityAt = new Date().toISOString();

			await databases.updateDocument<Skill>('main', 'skills', skill.$id, {
				xp: skill.xp,
				lastActivityAt: skill.lastActivityAt
			});

			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `+${amount + bonusXpToAdd} XP in ${skill.name} for ${effortName}`,
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
			effortName = '';
			activePreset = 'Custom';
			isExactPreset = false;
			amount = 1;
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			addingXp = false;
		}
	}

	let addingPreset = $state(false);
	async function addPreset() {
		if (!skill || addingPreset) {
			return;
		}

		addingPreset = true;

		try {
			const originalPrefs = await account.getPrefs();
			const presets = JSON.parse(originalPrefs.presets ?? '{}');
			if (!presets[skill.$id]) {
				presets[skill.$id] = [];
			}

			presets[skill.$id].push({
				amount,
				effortName,
				note: activityNote
			});

			await account.updatePrefs({
				...originalPrefs,
				presets: JSON.stringify(presets)
			});

			await invalidateAll();

			toast.open({
				type: 'success',
				message: `Activity preset saved.`
			});

			activePreset = effortName;
			isExactPreset = true;
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			addingPreset = false;
		}
	}

	let deletingPreset = $state(false);
	async function deletePreset() {
		if (!skill || deletingPreset) {
			return;
		}

		deletingPreset = true;

		try {
			const originalPrefs = await account.getPrefs();
			const presets = JSON.parse(originalPrefs.presets ?? '{}');
			if (!presets[skill.$id]) {
				presets[skill.$id] = [];
			}

			const newPresets = presets[skill.$id].filter(
				(preset: any) => preset.effortName !== effortName
			);

			await account.updatePrefs({
				...originalPrefs,
				presets: JSON.stringify({
					...presets,
					[skill.$id]: newPresets
				})
			});

			await invalidateAll();

			toast.open({
				type: 'success',
				message: `Activity preset deleted.`
			});

			effortName = '';
			activityNote = '';
			amount = 1;
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			deletingPreset = false;
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
				<h3 class="font-bold text-gray-800 dark:text-white">Add Experience</h3>
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

			{#if presets.length > 1}
				<div class="p-4 pb-0 overflow-y-auto">
					<div class="flex overflow-x-auto">
						<div
							class="flex bg-gray-100 hover:bg-gray-200 rounded-lg transition p-1 dark:bg-neutral-700 dark:hover:bg-neutral-600"
						>
							{#each presets as preset}
								<nav
									class="flex gap-x-1"
									aria-label="Tabs"
									role="tablist"
									aria-orientation="horizontal"
								>
									<button
										onclick={() => activatePreset(preset)}
										type="button"
										class={`py-1.5 px-2 inline-flex items-center gap-x-2 bg-transparent text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 font-medium rounded-lg hover:hover:text-blue-600 disabled:opacity-50 disabled:pointer-events-none dark:text-neutral-400 dark:hover:text-white dark:focus:text-white active ${preset.effortName === activePreset ? 'bg-white text-gray-700 dark:bg-neutral-800 text-neutral-400 bg-gray-800' : ''}`}
										aria-selected={true}
										role="tab"
									>
										{preset.effortName.length > 10
											? preset.effortName.substring(0, 10) + '...'
											: preset.effortName}
									</button>
								</nav>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<div class="p-4 overflow-y-auto">
				<label for="input-label" class="block text-sm font-medium mb-2 dark:text-white"
					>Activity <span class="text-neutral-400 text-xs">(optional)</span></label
				>
				<input
					type="text"
					required={false}
					autofocus={true}
					bind:value={effortName}
					class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:placeholder-neutral-500 dark:text-neutral-400"
					placeholder="Clean washing machine, Watered garden, Math homework, ..."
				/>
			</div>

			<div class="p-4 overflow-y-auto">
				<label for="input-label" class="block text-sm font-medium mb-2 dark:text-white"
					>Note <span class="text-neutral-400 text-xs">(optional)</span></label
				>
				<input
					type="text"
					required={false}
					bind:value={activityNote}
					class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:placeholder-neutral-500 dark:text-neutral-400"
					placeholder="Clean washing machine, Watered garden, Math homework, ..."
				/>
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

			<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t dark:border-neutral-700">
				{#if isExactPreset}
					<button
						disabled={deletingPreset}
						onclick={deletePreset}
						type="button"
						class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-red-500 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
					>
						Delete preset
					</button>
				{:else}
					<button
						disabled={addingPreset || !effortName}
						onclick={addPreset}
						type="button"
						class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
					>
						Save as preset
					</button>
				{/if}
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
