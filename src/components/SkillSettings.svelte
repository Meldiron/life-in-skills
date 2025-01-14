<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import { invalidateAll } from '$app/navigation';
	import { databases, functions, type Activity, type Skill } from '$lib/appwrite';
	import { capitalizeFirstLetter } from '$lib/helpers';
	import { toast } from '$lib/toast';
	import { ExecutionMethod, ID } from 'appwrite';

	interface Props {
		skill: Skill | null;
		id: string;
	}

	let { skill, id }: Props = $props();

	let newIsEditing = $state(skill ? true : false);
	let newSkillName = $state(skill ? skill.name : '');
	let newSkillReward = $state(skill ? skill.reward : '');
	let newSkillEmoji = $state(skill ? skill.icon : '');
	let newSkillTargetLevel = $state(skill ? skill.targetLevel : 10);
	let newSkillSmallXpName = $state(skill ? skill.smallXpName : 'Quick win');
	let newSkillMdiumXpName = $state(skill ? skill.mediumXpName : 'Regular');
	let newSkillBigXpName = $state(skill ? skill.bigXpName : 'High effort');

	let creatingSkill = $state(false);
	async function onCreateSkill() {
		if (creatingSkill) {
			return;
		}

		creatingSkill = true;
		try {
			if (skill) {
				await databases.updateDocument<Skill>('main', 'skills', skill.$id, {
					name: newSkillName,
					reward: newSkillReward,
					icon: newSkillEmoji ? newSkillEmoji : '❓',
					targetLevel: newSkillTargetLevel,
					smallXpName: newSkillSmallXpName,
					mediumXpName: newSkillMdiumXpName,
					bigXpName: newSkillBigXpName
				});
				await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
					text: `Updated ${capitalizeFirstLetter(newSkillName)} skill`
				});
				toast.open({
					type: 'log',
					message: 'Skill successfully updated'
				});
			} else {
				await databases.createDocument<Skill>('main', 'skills', ID.unique(), {
					name: newSkillName,
					reward: newSkillReward,
					icon: newSkillEmoji ? newSkillEmoji : '❓',
					targetLevel: newSkillTargetLevel
				});
				await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
					text: `Started ${capitalizeFirstLetter(newSkillName)} skill`
				});
				toast.open({
					type: 'log',
					message: 'Skill successfully created'
				});
			}

			await invalidateAll();

			// @ts-ignore
			window.HSOverlay.getInstance('#' + id, true).element.close();

			// @ts-ignore
			window.HSOverlay.autoInit();

			newSkillName = '';
			newSkillEmoji = '';
			newSkillTargetLevel = 10;
			newSkillReward = '';
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			creatingSkill = false;
		}
	}

	let deleteDropdown = $state(false);
	async function deleteSkill() {
		if (creatingSkill || !skill) {
			return;
		}

		creatingSkill = true;

		try {
			await databases.deleteDocument('main', 'skills', skill.$id);
			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `Deleted ${capitalizeFirstLetter(newSkillName)} skill`
			});

			// @ts-ignore
			window.HSOverlay.getInstance('#' + id, true).element.close();

			await invalidateAll();
			toast.open({
				type: 'log',
				message: 'Skill successfully created'
			});
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			creatingSkill = false;
		}
	}

	let usedEmojis: any = {};
	let generatingEmoji = $state(false);
	async function generateEmoji() {
		if (generatingEmoji) {
			return;
		}

		generatingEmoji = true;

		try {
			const execution = await functions.createExecution(
				'api',
				JSON.stringify({
					skillName: newSkillName,
					usedEmojis: usedEmojis[newSkillName] ?? []
				}),
				false,
				'/v1/ai/emoji',
				ExecutionMethod.POST,
				{}
			);

			if (execution.responseStatusCode !== 200) {
				throw new Error(execution.responseBody);
			}

			newSkillEmoji = execution.responseBody;

			if (!usedEmojis[newSkillName]) {
				usedEmojis[newSkillName] = [];
			}
			usedEmojis[newSkillName].push(newSkillEmoji);
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			generatingEmoji = false;
		}
	}

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

	function decreaseTargetLevel() {
		const keys = Object.keys(targetLevelData);

		const current = getTargetLevelData(newSkillTargetLevel);

		if (current.level === targetLevelData[keys[0]].level) {
			return;
		}

		let lastValue = 10;
		for (const dataKey in targetLevelData) {
			const data = targetLevelData[dataKey];

			if (data.level === current.level) {
				newSkillTargetLevel = lastValue;
				break;
			}

			lastValue = data.level;
		}
	}

	function increaseTargetLevel() {
		const keys = Object.keys(targetLevelData);

		const current = getTargetLevelData(newSkillTargetLevel);

		if (current.level === targetLevelData[keys[keys.length - 1]].level) {
			return;
		}

		let isNext = false;
		for (const dataKey in targetLevelData) {
			const data = targetLevelData[dataKey];

			if (isNext) {
				newSkillTargetLevel = data.level;
				break;
			}

			if (data.level === current.level) {
				isNext = true;
				continue;
			}
		}
	}
</script>

<div
	{id}
	class="hs-overlay hs-overlay-open:translate-x-0 hidden translate-x-full fixed top-0 end-0 transition-all duration-300 transform h-full max-w-sm w-full z-[80] bg-white border-s dark:bg-neutral-800 dark:border-neutral-700"
	role="dialog"
	tabindex="-1"
>
	<div class="flex justify-between items-center py-3 px-4 border-b dark:border-neutral-700">
		<h3 class="font-bold text-gray-800 dark:text-white">
			{newIsEditing ? 'Edit your skill' : 'Start a new skill'}
		</h3>
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
	<form onsubmit={preventDefault(onCreateSkill)} class="p-4 flex flex-col gap-4">
		{#if !newIsEditing}
			<p class="text-gray-800 dark:text-neutral-400">
				Define a new area of your life to track and improve. Achieve short-term or long-term visions
				to improve your life.
			</p>
		{/if}

		<div>
			<div class="flex justify-between items-center">
				<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
					>Skill name</label
				>
			</div>
			<input
				bind:value={newSkillName}
				required={true}
				type="text"
				class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				placeholder="Studying, Cleaning, Agility, Cooking, Hydration"
			/>
		</div>

		<div>
			<div class="flex justify-between items-center">
				<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
					>Icon</label
				>
				<span class="block mb-2 text-sm text-gray-500 dark:text-neutral-500">Emoji recommended</span
				>
			</div>
			<div class="flex items-center space-x-1">
				<input
					disabled={generatingEmoji}
					value={newSkillEmoji}
					oninput={onSkillEmojiChange}
					type="text"
					class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="For example: 🦷 👟 💪 🧹 📚"
				/>

				<button
					aria-label="Generate emoji"
					disabled={generatingEmoji || !newSkillName}
					onclick={generateEmoji}
					type="button"
					class="text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-4 py-3 text-center disabled:opacity-50"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="size-4"
					>
						<path
							fill-rule="evenodd"
							d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</div>

		<div>
			<div class="flex justify-between items-center">
				<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
					>Target level</label
				>

				<span class="block mb-2 text-sm text-gray-500 dark:text-neutral-500">Can be changed</span>
			</div>

			<div
				class="py-2 px-3 bg-white border border-gray-200 rounded-lg dark:bg-neutral-900 dark:border-neutral-700"
				data-hs-input-number=""
			>
				<div class="w-full flex justify-between items-center gap-x-3">
					<div>
						<span class="block font-medium text-sm text-gray-800 dark:text-white">
							{getTargetLevelData(newSkillTargetLevel).title}
						</span>
						<span class="block text-xs text-gray-500 dark:text-neutral-400">
							{getTargetLevelData(newSkillTargetLevel).description}
						</span>
					</div>
					<div class="flex items-center gap-x-1.5">
						<button
							type="button"
							onclick={decreaseTargetLevel}
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
							bind:value={newSkillTargetLevel}
							class="p-0 w-8 bg-transparent border-0 text-gray-800 text-center focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:text-white"
							style="-moz-appearance: textfield;"
							type="number"
							aria-roledescription="Number field"
						/>
						<button
							type="button"
							onclick={increaseTargetLevel}
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
			<div class="flex justify-between items-center">
				<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
					>Reward</label
				>

				<span class="block mb-2 text-sm text-gray-500 dark:text-neutral-500">Motivate yourself</span
				>
			</div>

			<input
				bind:value={newSkillReward}
				type="text"
				class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				placeholder="Buy new shoes, Day off, +1 month of Netflix, ..."
			/>
		</div>

		{#if newIsEditing}
			<div>
				<div class="flex justify-between items-center">
					<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
						>Quick win action (+1XP)</label
					>
					<span class="block mb-2 text-sm text-gray-500 dark:text-neutral-500">1-5 min effort</span>
				</div>
				<input
					bind:value={newSkillSmallXpName}
					type="text"
					class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="Read 1 page, Drink 1 glass of water, Do 10 push-ups, ..."
				/>
			</div>

			<div>
				<div class="flex justify-between items-center">
					<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
						>Regular action (+5XP)</label
					>

					<span class="block mb-2 text-sm text-gray-500 dark:text-neutral-500">Focused session</span
					>
				</div>
				<input
					bind:value={newSkillMdiumXpName}
					type="text"
					class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="Do 50 push-ups, Read a chapter, write 500 words, ..."
				/>
			</div>

			<div>
				<div class="flex justify-between items-center">
					<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
						>High effort action (+10 XP)</label
					>
					<span class="block mb-2 text-sm text-gray-500 dark:text-neutral-500">1+ hours effort</span
					>
				</div>
				<input
					bind:value={newSkillBigXpName}
					type="text"
					class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="Go to gym, Write an article, Release a new feature, ..."
				/>
			</div>
		{/if}

		<div class="flex flex-col sm:flex-row gap-2">
			<button
				disabled={creatingSkill}
				type="submit"
				class="justify-center py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#e18f49] text-white hover:bg-opacity-75 disabled:opacity-50 disabled:pointer-events-none"
			>
				{newIsEditing ? 'Save changes' : 'Create skill'}
			</button>

			{#if newIsEditing}
				<div class="relative">
					<button
						onclick={() => (deleteDropdown = !deleteDropdown)}
						aria-haspopup="menu"
						aria-expanded="false"
						aria-label="Dropdown"
						disabled={creatingSkill}
						type="button"
						class="justify-center py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:bg-red-600 disabled:opacity-50 disabled:pointer-events-none"
					>
						Delete skill
					</button>
					<div
						class={`${deleteDropdown ? 'opacity-100' : 'opacity-0 hidden'} hs-dropdown-menu transition-[opacity,margin] duration shrink-0 min-w-[max-content] bg-white shadow-md rounded-lg p-1 space-y-0.5 mt-2 divide-y divide-gray-200 dark:bg-neutral-800 dark:border dark:border-neutral-700 dark:divide-neutral-700 absolute left-0 top-full`}
						role="menu"
						aria-orientation="vertical"
						aria-labelledby="hs-dropdown-with-title"
					>
						<div class="py-2 first:pt-0 last:pb-0">
							<span
								class="shrink-0 block py-2 px-3 text-xs font-medium uppercase text-gray-400 dark:text-neutral-500"
							>
								Confirmation
							</span>
							<button
								disabled={creatingSkill}
								class="shrink-0 flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700"
								onclick={deleteSkill}
							>
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
										d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
									/>
								</svg>

								<p class="shrink-0">Click to delete</p>
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</form>
</div>
