<script lang="ts">
	import { databases, type Activity, type Skill } from '$lib/appwrite';
	import { getLevel, getXp } from '$lib/levels';
	import { ID } from 'appwrite';
	import type { PageData } from './$types';
	import { invalidate } from '$app/navigation';
	import { toast } from '$lib/toast';
	import { capitalizeFirstLetter } from '$lib/helpers';

	export let data: PageData;

	let activeSkill: Skill | null = null;

	let addingXp = false;
	async function addXp(amount: number) {
		if (!activeSkill || addingXp) {
			return;
		}

		addingXp = true;

		try {
			await databases.updateDocument<Skill>('main', 'skills', activeSkill.$id, {
				xp: activeSkill.xp + amount
			});
			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `+${amount} XP in ${activeSkill.name}`
			});

			const previousLevel = getLevel(activeSkill.xp);
			const nextLevel = getLevel(activeSkill.xp + amount);

			if (previousLevel !== nextLevel) {
				await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
					text: `${capitalizeFirstLetter(activeSkill.name)} leveled up to ${nextLevel}`
				});
				await invalidate('skills:all');

				// @ts-ignore
				celebrateLevel();

				toast.open({
					type: 'success',
					message: `<b>${capitalizeFirstLetter(activeSkill.name)}</b> leveled up to <b>${nextLevel}</b>`
				});
			} else {
				await invalidate('skills:all');
			}

			activeSkill.xp += amount;

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
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			addingXp = false;
		}
	}

	function getGraphProgress(skill: Skill | null | undefined, max = 75) {
		if (!skill) {
			return 0;
		}

		const level = getLevel(skill.xp);
		const lastLevel = level - 1;

		const xp = getXp(level);
		const lastXp = lastLevel === 0 ? 0 : getXp(lastLevel);

		const progress = skill.xp - lastXp;
		const progressMax = xp - lastXp;

		return Math.ceil((progress / progressMax) * max);
	}

	function getTotalLevel(skills: Skill[]) {
		let totalLevel = 0;

		for (const skill of skills) {
			totalLevel += getLevel(skill.xp);
		}

		return totalLevel;
	}

	let skillName = '';

	let newSkillEmoji = '';
	function onSkillEmojiChange(event: any) {
		const newValue = event.target.value.replace(new RegExp(`^${newSkillEmoji}`), '');
		newSkillEmoji = newValue;
	}

	let targetLevelData: any = {
		'10': {
			level: 10,
			title: 'Build a new habit',
			description: 'approx. 2 weeks to complete'
		},
		'40': {
			level: 40,
			title: 'Reinforced a habbit',
			description: 'approx. 4 to 6 months to complete'
		},
		'50': {
			level: 50,
			title: 'Train a skill',
			description: 'approx. 1 year to complete'
		},
		'80': {
			level: 80,
			title: 'Become professional',
			description: 'approx. 2 to 3 years to complete'
		},
		'99': {
			level: 99,
			title: 'Mastered a skill',
			description: 'approx. 4 to 5 years to complete'
		},
		'120': {
			level: 120,
			title: 'Achieve life goal',
			description: 'approx. 7 to 10 years to complete'
		}
	};
	function getTargetLevelData(level: number) {
		for (const key in targetLevelData) {
			if (targetLevelData[key].level === level) {
				return targetLevelData[key];
			}
		}

		return {
			level: level,
			title: 'Custom plan',
			description: 'Define your own goals and milestones'
		};
	}
	let targetLevel = 10;
	function decreaseTargetLevel() {
		const keys = Object.keys(targetLevelData);

		const current = getTargetLevelData(targetLevel);

		if (current.level === targetLevelData[keys[0]].level) {
			return;
		}

		let lastValue = 10;
		for (const dataKey in targetLevelData) {
			const data = targetLevelData[dataKey];

			if (data.level === current.level) {
				targetLevel = lastValue;
				break;
			}

			lastValue = data.level;
		}
	}

	function increaseTargetLevel() {
		const keys = Object.keys(targetLevelData);

		const current = getTargetLevelData(targetLevel);

		if (current.level === targetLevelData[keys[keys.length - 1]].level) {
			return;
		}

		let isNext = false;
		for (const dataKey in targetLevelData) {
			const data = targetLevelData[dataKey];

			if (isNext) {
				targetLevel = data.level;
				break;
			}

			if (data.level === current.level) {
				isNext = true;
				continue;
			}
		}
	}

	let creatingSkill = false;
	async function onCreateSkill() {
		if (creatingSkill) {
			return;
		}

		creatingSkill = true;
		try {
			await databases.createDocument<Skill>('main', 'skills', ID.unique(), {
				name: skillName,
				icon: newSkillEmoji,
				targetLevel: targetLevel
			});
			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `Started ${capitalizeFirstLetter(skillName)} skill`
			});
			await invalidate('skills:all');
			// @ts-ignore
			window.HSOverlay.close(document.getElementById('new-skill'));
			toast.open({
				type: 'log',
				message: 'Skill successfully created'
			});
			// @ts-ignore
			window.HSStaticMethods.autoInit();

			skillName = '';
			newSkillEmoji = '';
			targetLevel = 10;
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			creatingSkill = false;
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
					d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z"
				/>
			</svg>
		</div>

		<span>Skills</span>
	</div>
</h2>

<div class="mt-6 grid grid-cols-8 sm:grid-cols-12 gap-3">
	<div
		class="col-span-4 flex flex-col items-center gap-0 justify-center border shadow-sm rounded-lg p-4 md:p-5 bg-neutral-950 to-black border-neutral-700 text-neutral-400"
	>
		<p>Total level</p>
		<h2 class="font-bold text-white text-xl">{getTotalLevel(data.skills)}</h2>
	</div>

	{#each data.skills as skill}
		<button
			on:click={() => (activeSkill = skill)}
			data-hs-overlay="#active-skill"
			class="col-span-4 flex flex-row justify-between items-center border shadow-sm rounded-lg p-4 md:p-5 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-neutral-700 text-neutral-400"
		>
			<div>
				<span class="text-3xl skill transform -translate-x-1">{skill.icon}</span>
				<div
					class="mt-2 flex w-full h-1 bg-gray-200 rounded-full overflow-hidden dark:bg-neutral-700"
					role="progressbar"
				>
					<div
						class="flex flex-col justify-center rounded-full overflow-hidden text-xs text-white text-center whitespace-nowrap transition duration-500 bg-[#e18f49]"
						style={`width: ${getGraphProgress(skill, 100)}%`}
					></div>
				</div>
			</div>
			<div class="relative h-full flex justify-end items-end">
				<p class="absolute right-[calc(100%+16px)] -top-2 font-bold text-lg text-white">
					{getLevel(skill.xp)}
				</p>
				<div
					class="absolute h-[calc(100%+32px)] -left-2 -top-4 w-[2px] bg-neutral-800 rotate-45"
				></div>
				<p class="transform translate-y-2 font-bold text-lg">{skill.targetLevel}</p>
			</div>
		</button>
	{/each}

	<button
		data-hs-overlay="#new-skill"
		class="col-span-4 flex items-center gap-2 justify-center border shadow-sm rounded-lg p-4 md:p-5 bg-trasparent border-transparent text-neutral-400"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="hidden sm:block size-6"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
		</svg>

		<p>Add skill</p>
	</button>
</div>

<div
	id="new-skill"
	class="hs-overlay hs-overlay-open:translate-x-0 hidden translate-x-full fixed top-0 end-0 transition-all duration-300 transform h-full max-w-sm w-full z-[80] bg-white border-s dark:bg-neutral-800 dark:border-neutral-700"
	role="dialog"
	tabindex="-1"
>
	<div class="flex justify-between items-center py-3 px-4 border-b dark:border-neutral-700">
		<h3 class="font-bold text-gray-800 dark:text-white">Start a new skill</h3>
		<button
			type="button"
			class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
			aria-label="Close"
			data-hs-overlay="#new-skill"
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
	<form on:submit|preventDefault={onCreateSkill} class="p-4 flex flex-col gap-4">
		<p class="text-gray-800 dark:text-neutral-400">
			Define a new area of your life to track and improve. Achieve short-term or long-term visions
			to improve your life.
		</p>

		<div>
			<div class="flex justify-between items-center">
				<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
					>Icon</label
				>
				<span class="block mb-2 text-sm text-gray-500 dark:text-neutral-500">Emoji recommended</span
				>
			</div>
			<input
				value={newSkillEmoji}
				on:input={onSkillEmojiChange}
				type="text"
				class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				placeholder="For example: 🦷 👟 💪 🧹 📚"
			/>
		</div>

		<div>
			<div class="flex justify-between items-center">
				<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
					>Skill name</label
				>
			</div>
			<input
				bind:value={skillName}
				type="text"
				class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				placeholder="Studying, Cleaning, Agility, Cooking, Hydration"
			/>
		</div>

		<div>
			<div class="flex justify-between items-center">
				<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
					>Target level</label
				>

				<span class="block mb-2 text-sm text-gray-500 dark:text-neutral-500">Can change later</span>
			</div>

			<div
				class="py-2 px-3 bg-white border border-gray-200 rounded-lg dark:bg-neutral-900 dark:border-neutral-700"
				data-hs-input-number=""
			>
				<div class="w-full flex justify-between items-center gap-x-3">
					<div>
						<span class="block font-medium text-sm text-gray-800 dark:text-white">
							{getTargetLevelData(targetLevel).title}
						</span>
						<span class="block text-xs text-gray-500 dark:text-neutral-400">
							{getTargetLevelData(targetLevel).description}
						</span>
					</div>
					<div class="flex items-center gap-x-1.5">
						<button
							type="button"
							on:click={decreaseTargetLevel}
							class="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
							tabindex="-1"
							aria-label="Decrease"
						>
							<svg
								class="shrink-0 size-3.5"
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
								<path d="M5 12h14"></path>
							</svg>
						</button>
						<input
							bind:value={targetLevel}
							class="p-0 w-8 bg-transparent border-0 text-gray-800 text-center focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:text-white"
							style="-moz-appearance: textfield;"
							type="number"
							aria-roledescription="Number field"
						/>
						<button
							type="button"
							on:click={increaseTargetLevel}
							class="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-md border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
							tabindex="-1"
							aria-label="Increase"
						>
							<svg
								class="shrink-0 size-3.5"
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
								<path d="M5 12h14"></path>
								<path d="M12 5v14"></path>
							</svg>
						</button>
					</div>
				</div>
			</div>
			<!-- End Input Number -->
		</div>

		<div>
			<button
				disabled={creatingSkill}
				type="submit"
				class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#e18f49] text-white hover:bg-opacity-75 disabled:opacity-50 disabled:pointer-events-none"
			>
				Create skill
			</button>
		</div>
	</form>
</div>

<div
	id="active-skill"
	class="overflow-y-auto mx-auto max-w-[30rem] p-4 rounded-t-xl hs-overlay hs-overlay-open:translate-y-0 translate-y-full fixed bottom-0 inset-x-0 transition-all duration-300 transform max-h-[90%] h-[fit-content] size-full z-[80] bg-neutral-950"
	role="dialog"
	tabindex="-1"
>
	<div class="flex justify-between items-center py-2 px-4">
		<div class="flex gap-2">
			<div class="bg-neutral-800 py-2 px-3 text-sm rounded-2xl">
				<span>{activeSkill?.icon ?? ''}</span>
			</div>
			<h3 id="hs-offcanvas-bottom-label" class="font-bold text-gray-800 text-2xl dark:text-white">
				{activeSkill?.name ?? ''}
			</h3>
		</div>

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
							stroke-dasharray={`${getGraphProgress(activeSkill)} 100`}
							stroke-linecap="round"
						></circle>
					</svg>

					<!-- Value Text -->
					<div
						class="absolute top-1/2 start-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
					>
						<span class="text-3xl font-bold text-[#e18f49]"
							>{getXp(getLevel(activeSkill?.xp ?? 0)) - (activeSkill?.xp ?? 0)}
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
						class="flex items-center gap-x-2 p-3 py-2 text-sm bg-white border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-lg dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-200"
					>
						<div class="w-full flex justify-between truncate items-center">
							<span class="me-3 flex-1 w-0 truncate text-neutral-400"> Current level </span>
							<button type="button" class="flex items-center text-lg gap-x-2 font-semibold">
								{getLevel(activeSkill?.xp ?? 0)}
							</button>
						</div>
					</li>
					<li
						class="flex items-center gap-x-2 p-3 py-2 text-sm bg-white border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-lg dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-200"
					>
						<div class="w-full flex justify-between truncate items-center">
							<span class="me-3 flex-1 w-0 truncate text-neutral-400"> Target level </span>
							<button type="button" class="flex items-center text-lg gap-x-2 font-semibold">
								{activeSkill?.targetLevel ?? 0}
							</button>
						</div>
					</li>
					<li
						class="flex items-center gap-x-2 p-3 py-1.5 text-xs bg-white border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-md dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-200"
					>
						<div class="w-full flex justify-between truncate items-center">
							<span class="me-3 flex-1 w-0 truncate text-neutral-400"> Total XP </span>
							<button type="button" class="flex items-center gap-x-2">
								{activeSkill?.xp ?? 0}
							</button>
						</div>
					</li>
					<li
						class="flex items-center gap-x-2 p-3 py-1.5 text-xs bg-white border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-md dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-200"
					>
						<div class="w-full flex justify-between truncate items-center">
							<span class="me-3 flex-1 w-0 truncate text-neutral-400"> Remaining XP </span>
							<button type="button" class="flex items-center gap-x-2">
								{getXp(activeSkill?.targetLevel ?? 0) - (activeSkill?.xp ?? 0)}
							</button>
						</div>
					</li>
				</ul>
				<!-- End List Group -->
			</div>
		</div>

		<hr class="border-neutral-800 my-6 border-[1px]" />

		<div class="grid grid-cols-4 sm:grid-cols-12 gap-3 sm:gap-0 rounded-lg w-full">
			<button
				disabled={addingXp}
				on:click={() => addXp(1)}
				type="button"
				class="rounded-3xl sm:rounded-none py-3 px-4 col-span-4 inline-flex flex flex-col items-center gap-x-2 -ms-px sm:first:rounded-s-lg first:ms-0 sm:last:rounded-e-lg text-sm font-medium focus:z-10 border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 sm:p-5"
			>
				<p class="text-neutral-400">Quick win</p>
				<p class="text-white text-xs"><span class="text-lg">+1</span> XP</p>
			</button>
			<button
				disabled={addingXp}
				on:click={() => addXp(5)}
				type="button"
				class="rounded-3xl sm:rounded-none py-3 px-4 col-span-4 inline-flex flex flex-col items-center gap-x-2 -ms-px sm:first:rounded-s-lg first:ms-0 sm:last:rounded-e-lg text-sm font-medium focus:z-10 border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 sm:p-5"
			>
				<p class="text-neutral-200">Intermediate</p>
				<p class="text-white text-xs"><span class="text-lg">+5</span> XP</p>
			</button>
			<button
				disabled={addingXp}
				on:click={() => addXp(10)}
				type="button"
				class="rounded-3xl sm:rounded-none py-3 px-4 col-span-4 inline-flex flex flex-col items-center gap-x-2 -ms-px sm:first:rounded-s-lg first:ms-0 sm:last:rounded-e-lg text-sm font-medium focus:z-10 border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 sm:p-5"
			>
				<p class="text-[#e18f49]">High effort</p>
				<p class="text-white text-xs"><span class="text-lg">+10</span> XP</p>
			</button>
		</div>
	</div>
</div>
