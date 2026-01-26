<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import { invalidateAll } from '$app/navigation';
	import { databases, type Activity, type Skill, account } from '$lib/appwrite';
	import { capitalizeFirstLetter } from '$lib/helpers';
	import { getLevel, getXp } from '$lib/levels';
	import { hasBonus } from '$lib/skills';
	import { toast } from '$lib/toast';
	import { ID } from 'appwrite';
	import { storeUser } from '$lib/store.svelte';

	interface Props {
		id: string;
		skill: Skill;
	}

	let { skill, id }: Props = $props();

	let effortName = $state('');
	let amount = $state(1);
	let activityNote = $state('');
	let experienceShowCustom = $state(false);
	let isExactPreset = $state(false);
	let showExperienceCalculator = $state(false);

	$effect(() => {
		if (amount >= 10 && !experienceShowCustom) {
			experienceShowCustom = true;
		}
	});

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
		document.getElementById(id)?.addEventListener('activatepreset', (event: any) => {
			const detail = event.detail as any;
			amount = detail.amount;
			effortName = detail.effortName;
			activityNote = detail.note;
			activePreset = detail.effortName;
			isExactPreset = true;
		});
	});

	$effect(() => {
		if (effortName !== activePreset) {
			isExactPreset = false;
		}
	});

	$effect(() => {
		const presetEffortName =
			presets.find((preset) => preset.effortName === activePreset)?.effortName ?? '';

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

			if (previousLevel < nextLevel) {
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
				if (amount >= 10) {
					// @ts-ignore
					celebrateBig();
				} else if (amount >= 5) {
					// @ts-ignore
					celebrateMedium();
				} else {
					// @ts-ignore
					celebrateSmall();
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

	// Experience Calculator functionality
	let currentLevel = $derived(getLevel(skill.xp));

	function openExperienceCalculator() {
		showExperienceCalculator = true;
		// Scroll to current level after modal opens
		setTimeout(() => {
			const currentLevelElement = document.getElementById(`level-${currentLevel}`);
			if (currentLevelElement) {
				currentLevelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 100);
	}

	function closeExperienceCalculator() {
		showExperienceCalculator = false;
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
								<nav class="flex gap-x-1" aria-label="Tabs">
									<button
										onclick={() => activatePreset(preset)}
										type="button"
										class={`min-w-[max-content] py-1.5 px-2 inline-flex items-center gap-x-2 bg-transparent text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 font-medium rounded-lg hover:hover:text-blue-600 disabled:opacity-50 disabled:pointer-events-none dark:text-neutral-400 dark:hover:text-white dark:focus:text-white active ${preset.effortName === activePreset ? 'bg-white text-gray-700 dark:bg-neutral-800 text-neutral-400 bg-gray-800' : ''}`}
									>
										{preset.effortName.length > 20
											? preset.effortName.substring(0, 20) + '...'
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
				<label for="input-label" class="block text-sm font-medium mb-2 dark:text-white"
					>Effort <span class="text-red-400 text-xs">(required)</span></label
				>
				<div class="grid grid-cols-10 w-full gap-2">
					{#each [{ amount: [1, 2, 3], class: 'border-blue-500', classActive: '!bg-blue-500' }, { amount: [4, 5, 6], class: 'border-green-500', classActive: '!bg-green-500' }, { amount: [7, 8], class: 'border-orange-500', classActive: '!bg-orange-500' }, { amount: [9, 10], class: 'border-red-500', classActive: '!bg-red-500' }] as range, rangeIndex}
						<div
							class="relative flex w-full gap-1"
							style={`grid-column: span ${range.amount.length} / span ${range.amount.length}; margin-top: ${100 - range.amount[range.amount.length - 1] * 10}px;`}
						>
							{#each range.amount as effort, effortIndex}
								<button
									type="button"
									onclick={() => (amount = effort)}
									aria-label="Effort level"
									style={`margin-top: ${10 * (range.amount.length - 1) - effortIndex * 10}px; height: ${30 + 10 * effort}px;`}
									class={`hover:bg-opacity-20 hover:bg-white w-full bg-neutral-700 border-b-2 ${range.class} border-opacity-75 rounded-3xl rounded-b-none flex justify-center items-end pb-3 ${effortIndex === 0 ? 'rounded-bl-none' : ''} ${effortIndex === range.amount.length - 1 ? 'rounded-br-none' : ''} rounded-t-lg relative rounded-t-lg ${amount === effort ? range.classActive + ' !bg-opacity-100' : ''}`}
								>
									<div
										class={`w-[5px] h-[5px] rounded-full ${amount === effort ? 'bg-white' : 'bg-neutral-500'}`}
									></div>
								</button>
							{/each}
						</div>
					{/each}
				</div>

				<div
					class={`rounded-xl p-2 px-2 bg-neutral-700 text-neutral-100 flex items-center mt-2 gap-1.5`}
				>
					{#if experienceShowCustom}
						<input
							type="number"
							required={true}
							bind:value={amount}
							class="py-1 px-2 block w-20 rounded-lg text-sm bg-neutral-800 border border-neutral-500 placeholder-neutral-500 text-neutral-400"
							placeholder="Amount"
						/>
					{:else}
						<div
							class="rounded-full bg-neutral-800 w-7 font-medium h-7 text-sm flex items-center justify-center"
						>
							{amount}
						</div>
					{/if}
					<p class="text-sm text-neutral-300">Experience</p>
				</div>
			</div>

			{#if experienceShowCustom}
				<div class="px-4 py-3 pt-0">
					<div
						class="mt-2 bg-blue-600 text-sm text-white rounded-lg p-4 dark:bg-blue-500"
						role="alert"
						tabindex="-1"
						aria-labelledby="hs-solid-color-info-label"
					>
						To see how much XP you need to reach any level, check out
						<button type="button" onclick={openExperienceCalculator} class="text-white underline"
							>Experience Calculator</button
						>.
					</div>
				</div>
			{/if}

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

<!-- Experience Calculator Modal -->
{#if showExperienceCalculator}
	<div
		class="fixed inset-0 z-[90] bg-black bg-opacity-50 flex items-center justify-center p-4"
		onclick={closeExperienceCalculator}
		role="dialog"
		tabindex="-1"
	>
		<div
			onclick={(e) => e.stopPropagation()}
			class="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
		>
			<div class="flex justify-between items-center py-3 px-4 border-b dark:border-neutral-700">
				<h3 class="font-bold text-gray-800 dark:text-white">Experience Calculator</h3>
				<button
					type="button"
					onclick={closeExperienceCalculator}
					class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
					aria-label="Close"
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

			<!-- Current Level Info -->
			<div class="px-4 py-4 bg-blue-50 dark:bg-blue-900/30 border-b dark:border-neutral-700">
				<div class="flex flex-col gap-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
							>
								{currentLevel}
							</div>
							<div>
								<div class="font-semibold text-gray-800 dark:text-white text-lg">
									Level {currentLevel}
								</div>
								<div class="text-sm text-blue-600 dark:text-blue-400 font-medium">
									Current Level
								</div>
							</div>
						</div>
						<div class="text-right">
							<div class="font-mono text-xl font-bold text-gray-800 dark:text-white">
								{skill.xp.toLocaleString()}
							</div>
							<div class="text-sm text-gray-600 dark:text-gray-400 font-medium">Total XP</div>
						</div>
					</div>

					{#if currentLevel < 99}
						<div
							class="flex items-center justify-between pt-3 border-t border-white/50 dark:border-white/10"
						>
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300"
								>Next level needs:</span
							>
							<div
								class="flex items-center gap-2 bg-white/70 dark:bg-black/20 px-3 py-1 rounded-full"
							>
								<span class="font-mono font-bold text-blue-600 dark:text-blue-400">
									+{(getXp(currentLevel + 1) - skill.xp).toLocaleString()}
								</span>
								<span class="text-sm text-gray-600 dark:text-gray-400 font-medium">XP</span>
							</div>
						</div>
					{:else}
						<div class="pt-3 border-t border-white/50 dark:border-white/10">
							<div class="text-center">
								<span
									class="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold shadow-lg"
								>
									<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
										<path
											d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
										></path>
									</svg>
									Max Level Reached
								</span>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Level List -->
			<div class="flex-1 overflow-y-auto p-4">
				<div class="space-y-2">
					{#each Array.from({ length: 99 }, (_, i) => i + 1) as level}
						<div
							id="level-{level}"
							class={`flex justify-between items-center p-4 rounded-xl border ${
								level === currentLevel
									? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 shadow-md dark:from-blue-900/40 dark:to-indigo-900/40 dark:border-blue-500'
									: level < currentLevel
										? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-900/20 dark:to-green-900/20 dark:border-emerald-700'
										: 'bg-gray-50 border-gray-200 dark:bg-neutral-700 dark:border-neutral-600'
							}`}
						>
							<div class="flex items-center gap-4">
								{#if level === currentLevel}
									<div
										class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg"
									>
										<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clip-rule="evenodd"
											></path>
										</svg>
									</div>
								{:else if level < currentLevel}
									<div
										class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg"
									>
										<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clip-rule="evenodd"
											></path>
										</svg>
									</div>
								{:else}
									<div
										class="w-8 h-8 bg-gray-300 dark:bg-neutral-600 rounded-full flex items-center justify-center"
									>
										<div class="w-3 h-3 bg-gray-500 dark:bg-neutral-400 rounded-full"></div>
									</div>
								{/if}
								<div>
									<div
										class={`font-semibold text-lg ${
											level === currentLevel
												? 'text-blue-800 dark:text-blue-200'
												: level < currentLevel
													? 'text-emerald-700 dark:text-emerald-300'
													: 'text-gray-800 dark:text-white'
										}`}
									>
										Level {level}
									</div>
									{#if level === currentLevel}
										<div class="text-sm text-blue-600 dark:text-blue-400 font-medium">
											Current Level
										</div>
									{:else if level > currentLevel}
										<div class="text-sm text-gray-600 dark:text-neutral-400 font-medium">
											+{(getXp(level) - skill.xp).toLocaleString()} XP from
										</div>
									{:else}
										<div class="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
											Completed ✓
										</div>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div
									class={`font-mono text-lg font-semibold ${
										level === currentLevel
											? 'text-blue-700 dark:text-blue-300'
											: level < currentLevel
												? 'text-emerald-600 dark:text-emerald-400'
												: 'text-gray-600 dark:text-neutral-400'
									}`}
								>
									{getXp(level).toLocaleString()}
								</div>
								<div class="text-sm text-gray-500 dark:text-neutral-500 font-medium">Total XP</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t dark:border-neutral-700">
				<button
					onclick={closeExperienceCalculator}
					type="button"
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
