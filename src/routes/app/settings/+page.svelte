<script lang="ts">
	import { run, preventDefault } from 'svelte/legacy';

	import { ID } from 'appwrite';
	import type { PageData } from './$types';
	import { type PublicProfile, account, databases } from '$lib/appwrite';
	import { toast } from '$lib/toast';
	import { goto, invalidateAll } from '$app/navigation';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	$effect(() => {
		const sortable = document.querySelector('#sortable-skills');

		// @ts-ignore
		new Sortable(sortable, {
			animation: 250,
			dragClass: '!rounded-none',
			onEnd: function (event: any) {
				const { oldIndex, newIndex } = event;

				if (oldIndex !== newIndex) {
					madeSkillSortChanges = true;

					const newSkills = [];

					let previous = false;
					for (let i = 0; i < skills.length; i++) {
						if (i === newIndex) {
							if (previous) {
								newSkills.push(skills[i]);
								newSkills.push(skills[oldIndex]);
							} else {
								newSkills.push(skills[oldIndex]);
								newSkills.push(skills[i]);
							}
						} else if (i === oldIndex) {
							previous = true;
							continue;
						} else {
							newSkills.push(skills[i]);
						}
					}

					skills = newSkills;
				}
			}
		});
	});

	// Public profile
	let hasProfileOnInit = $derived(data.user?.prefs?.isPublic && data.user?.prefs?.publicPath);

	const uniqueId = ID.unique();

	let isPublic2 = $derived(data.user?.prefs?.isPublic ?? false);
	let isPublic = $state(isPublic2);

	let publicPath2 = $derived(data.user?.prefs?.publicPath ?? uniqueId);
	let publicPath = $state(publicPath2);

	let publicNickname2 = $derived(data.user?.prefs?.publicNickname ?? '');
	let publicNickname = $state(publicNickname2);

	let originalIsPublic = $derived(data.user?.prefs?.isPublic ?? false);
	let originalPublicPath = $derived(data.user?.prefs?.publicPath ?? uniqueId);
	let originalNickname = $derived(data.user?.prefs?.publicNickname ?? '');

	let madeProfileChanges = $derived(
		isPublic !== originalIsPublic ||
			publicPath !== originalPublicPath ||
			publicNickname !== originalNickname
	);

	let isUpdatingPublicProfile = $state(false);
	async function updatePublicProfile() {
		if (isUpdatingPublicProfile) {
			return;
		}

		isUpdatingPublicProfile = true;

		try {
			let needsCreation = true;
			try {
				const doc = await databases.getDocument<PublicProfile>(
					'main',
					'publicProfiles',
					publicPath
				);
				if (doc && doc.userId === data.user?.$id) {
					needsCreation = false;
				}
			} catch (err) {}

			if (isPublic && needsCreation) {
				await databases.createDocument<PublicProfile>('main', 'publicProfiles', publicPath, {
					userId: data.user?.$id
				});
			}

			const originalPrefs = await account.getPrefs();
			await account.updatePrefs({
				...originalPrefs,
				isPublic,
				publicPath,
				publicNickname
			});

			await invalidateAll();

			toast.open({
				type: 'success',
				message: 'Public profile updated.'
			});
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			isUpdatingPublicProfile = false;
		}
	}

	// Daily bonus
	let dailyBonus2 = $derived(data.user?.prefs?.dailyBonus ?? 3);
	let dailyBonus = $state(dailyBonus2);

	let originalDailyBonus = $derived(data.user?.prefs?.dailyBonus ?? 3);
	let madeDailyBonusChanges = $derived(dailyBonus !== originalDailyBonus);

	let isUpdatingDailyBonus = $state(false);
	async function updateDailyBonus() {
		if (isUpdatingDailyBonus) {
			return;
		}

		isUpdatingDailyBonus = true;

		try {
			const originalPrefs = await account.getPrefs();
			await account.updatePrefs({
				...originalPrefs,
				dailyBonus
			});

			await invalidateAll();

			toast.open({
				type: 'success',
				message: 'Daily bonus updated.'
			});
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			isUpdatingDailyBonus = false;
		}
	}

	// Account management
	let isLoggingOut = $state(false);

	async function logOut() {
		if (isLoggingOut) {
			return;
		}

		isLoggingOut = true;

		try {
			await account.deleteSession('current');

			toast.open({
				type: 'success',
				message: 'Successfully signed out.'
			});

			await invalidateAll();
			await goto('/');
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			isLoggingOut = false;
		}
	}

	let deleteDropdown = $state(false);
	let isDeleting = $state(false);

	async function deleteAccount() {
		if (isDeleting) {
			return;
		}

		isDeleting = true;

		try {
			await account.updateStatus();

			toast.open({
				type: 'success',
				message: 'Account successfully deleted.'
			});

			await invalidateAll();
			await goto('/');
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			isDeleting = false;
		}
	}

	let skills = [...data.skills];
	let madeSkillSortChanges = $state(false);
	let isUpdatingSkillSort = $state(false);
	async function updateSkillSort() {
		isUpdatingSkillSort = true;

		try {
			if (skills.length > 5) {
				toast.open({
					type: 'log',
					message: 'This may take a moment...'
				});
			}

			for (const skill of skills) {
				await databases.updateDocument('main', 'skills', skill.$id, {
					position: skills.indexOf(skill)
				});
			}

			await invalidateAll();

			toast.open({
				type: 'success',
				message: 'Skill sorting updated.'
			});
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			isUpdatingSkillSort = false;
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
					fill-rule="evenodd"
					d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>

		<span>Settings</span>
	</div>
</h2>

<div class="mt-6 flex flex-col gap-y-4">
	<form
		onsubmit={preventDefault(updatePublicProfile)}
		class="border rounded-xl shadow-sm p-4 dark:bg-neutral-800 dark:border-neutral-700"
	>
		<!-- Uploading File Content -->
		<div
			class="mb-4 flex flex-col-reverse item-start sm:flex-row gap-3 justify-between sm:items-center"
		>
			<div class="flex items-start sm:items-center gap-x-3">
				<span
					class="size-8 shrink-0 flex justify-center items-center border border-gray-200 text-gray-500 rounded-lg dark:border-neutral-700 dark:text-neutral-500"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="size-5 text-neutral-400 shrink-0"
					>
						<path
							fill-rule="evenodd"
							d="M19.902 4.098a3.75 3.75 0 0 0-5.304 0l-4.5 4.5a3.75 3.75 0 0 0 1.035 6.037.75.75 0 0 1-.646 1.353 5.25 5.25 0 0 1-1.449-8.45l4.5-4.5a5.25 5.25 0 1 1 7.424 7.424l-1.757 1.757a.75.75 0 1 1-1.06-1.06l1.757-1.757a3.75 3.75 0 0 0 0-5.304Zm-7.389 4.267a.75.75 0 0 1 1-.353 5.25 5.25 0 0 1 1.449 8.45l-4.5 4.5a5.25 5.25 0 1 1-7.424-7.424l1.757-1.757a.75.75 0 1 1 1.06 1.06l-1.757 1.757a3.75 3.75 0 1 0 5.304 5.304l4.5-4.5a3.75 3.75 0 0 0-1.035-6.037.75.75 0 0 1-.354-1Z"
							clip-rule="evenodd"
						/>
					</svg>
				</span>
				<div>
					<p class="text-sm font-medium text-gray-800 dark:text-white">Public profile</p>
					<p class="text-xs text-gray-500 dark:text-neutral-500">
						Share your hero with friends, or anyone.
					</p>
				</div>
			</div>

			{#if hasProfileOnInit}
				<div class="inline-flex items-center gap-x-2">
					<a href={`${window.location.origin}/hero/${publicPath}`} target="_blank" class="relative">
						<span
							class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full hover:bg-blue-700 bg-blue-600 text-white"
						>
							Visit profile
						</span>
					</a>
				</div>
			{/if}
		</div>
		<!-- End Uploading File Content -->

		<!-- Switch/Toggle -->
		<div class="relative inline-block w-full">
			<input
				type="checkbox"
				id="hs-small-switch-soft"
				class="peer relative w-11 h-6 p-px bg-gray-100 border border-gray-200 text-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:ring-blue-600 disabled:opacity-50 disabled:pointer-events-none checked:bg-none checked:text-blue-100 checked:border-blue-200 focus:checked:border-blue-200 dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-800/30 dark:checked:border-blue-800 dark:focus:ring-offset-gray-600
  
	before:inline-block before:size-5 before:bg-white checked:before:bg-blue-600 before:translate-x-0 checked:before:translate-x-full before:rounded-full before:transform before:ring-0 before:transition before:ease-in-out before:duration-200 dark:before:bg-neutral-400 dark:checked:before:bg-blue-500"
				bind:checked={isPublic}
			/>
			<label for="hs-basic-with-description-unchecked" class="text-sm ms-1 dark:text-neutral-100"
				>{isPublic ? 'Enabled' : 'Disabled'}</label
			>

			{#if isPublic}
				<div class="mt-3 w-full">
					<!-- Floating Input -->
					<div class="relative w-full">
						<input
							required={true}
							type="text"
							id="hs-floating-input-email-value"
							class="peer p-4 block w-full border-gray-200 rounded-lg text-sm placeholder:text-transparent focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:focus:ring-neutral-600
    focus:pt-8
    focus:pb-2
    [&:not(:placeholder-shown)]:pt-8
    [&:not(:placeholder-shown)]:pb-2
    autofill:pt-8
    autofill:pb-2"
							placeholder="your-nickname"
							bind:value={publicPath}
						/>
						<label
							for="hs-floating-input-email-value"
							class="absolute top-0 start-0 p-4 h-full text-sm truncate pointer-events-none transition ease-in-out duration-100 border border-transparent origin-[0_0] dark:text-white peer-disabled:opacity-50 peer-disabled:pointer-events-none
      peer-focus:scale-90
      peer-focus:translate-x-0.5
      peer-focus:-translate-y-1.5
      peer-focus:text-gray-500 dark:peer-focus:text-neutral-500
      peer-[:not(:placeholder-shown)]:scale-90
      peer-[:not(:placeholder-shown)]:translate-x-0.5
      peer-[:not(:placeholder-shown)]:-translate-y-1.5
      peer-[:not(:placeholder-shown)]:text-gray-500 dark:peer-[:not(:placeholder-shown)]:text-neutral-500 dark:text-neutral-500"
							>https://life-in-skills.almostapps.eu/hero/</label
						>
					</div>
					<!-- End Floating Input -->
				</div>

				<div
					class="mt-2 py-2 px-3 bg-white border border-gray-200 rounded-lg dark:bg-neutral-900 dark:border-neutral-700"
				>
					<div class="w-full flex justify-between items-center gap-x-5">
						<div class="grow">
							<span class="block text-xs text-gray-500 dark:text-neutral-400"> Nickname </span>
							<input
								required={true}
								class="w-full p-0 bg-transparent border-0 text-gray-800 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:text-white"
								style="-moz-appearance: textfield;"
								type="text"
								bind:value={publicNickname}
							/>
						</div>
					</div>
				</div>
			{/if}
		</div>
		<!-- End Switch/Toggle -->
		<div class="flex justify-end mt-3">
			<button
				type="submit"
				disabled={!madeProfileChanges || isUpdatingPublicProfile}
				class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
			>
				Update
			</button>
		</div>
	</form>

	<form
		onsubmit={preventDefault(updateDailyBonus)}
		class="border rounded-xl shadow-sm p-4 dark:bg-neutral-800 dark:border-neutral-700"
	>
		<!-- Uploading File Content -->
		<div
			class="mb-4 flex flex-col-reverse item-start sm:flex-row gap-3 justify-between sm:items-center"
		>
			<div class="flex items-start sm:items-center gap-x-3">
				<span
					class="size-8 shrink-0 flex justify-center items-center border border-gray-200 text-gray-500 rounded-lg dark:border-neutral-700 dark:text-neutral-500"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="size-5 text-neutral-400 shrink-0"
					>
						<path
							fill-rule="evenodd"
							d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
							clip-rule="evenodd"
						/>
					</svg>
				</span>
				<div>
					<p class="text-sm font-medium text-gray-800 dark:text-white">Daily bonus</p>
					<p class="text-xs text-gray-500 dark:text-neutral-500">
						Gain extra XP for first skill activity of a day.
					</p>
				</div>
			</div>
		</div>
		<!-- End Uploading File Content -->

		<!-- Input Number -->
		<div
			class="py-2 px-3 bg-white border border-gray-200 rounded-lg dark:bg-neutral-900 dark:border-neutral-700"
			data-hs-input-number=""
		>
			<div class="w-full flex justify-between items-center gap-x-5">
				<div class="grow">
					<span class="block text-xs text-gray-500 dark:text-neutral-400"> Bonus XP </span>
					<input
						required={true}
						class="w-full p-0 bg-transparent border-0 text-gray-800 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:text-white"
						style="-moz-appearance: textfield;"
						type="number"
						aria-roledescription="Number field"
						bind:value={dailyBonus}
						data-hs-input-number-input=""
					/>
				</div>
				<div class="flex justify-end items-center gap-x-1.5">
					<button
						type="button"
						onclick={() => dailyBonus--}
						class="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
						tabindex="-1"
						aria-label="Decrease"
						data-hs-input-number-decrement=""
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
					<button
						type="button"
						onclick={() => dailyBonus++}
						class="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
						tabindex="-1"
						aria-label="Increase"
						data-hs-input-number-increment=""
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

		<div class="flex justify-end mt-3">
			<button
				type="submit"
				disabled={!madeDailyBonusChanges || isUpdatingDailyBonus}
				class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
			>
				Update
			</button>
		</div>
	</form>

	<form
		onsubmit={preventDefault(updateSkillSort)}
		class="border rounded-xl shadow-sm p-4 dark:bg-neutral-800 dark:border-neutral-700"
	>
		<div
			class="mb-4 flex flex-col-reverse item-start sm:flex-row gap-3 justify-between sm:items-center"
		>
			<div class="flex items-start sm:items-center gap-x-3">
				<span
					class="size-8 shrink-0 flex justify-center items-center border border-gray-200 text-gray-500 rounded-lg dark:border-neutral-700 dark:text-neutral-500"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="size-5 text-neutral-400 shrink-0"
					>
						<path
							fill-rule="evenodd"
							d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z"
							clip-rule="evenodd"
						/>
					</svg>
				</span>
				<div>
					<p class="text-sm font-medium text-gray-800 dark:text-white">Skill sorting</p>
					<p class="text-xs text-gray-500 dark:text-neutral-500">Re-order skills to your liking.</p>
				</div>
			</div>
		</div>
		<!-- End Uploading File Content -->

		<ul id="sortable-skills" class="w-full flex flex-col">
			{#each skills as skill}
				<li
					class="inline-flex items-center gap-x-3 py-3 px-4 cursor-grab text-sm font-medium bg-neutral-900 border border-neutral-700 text-neutral-400 -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg"
				>
					{skill.icon} &nbsp; {skill.name}
					<svg
						class="shrink-0 size-4 ms-auto text-gray-400 dark:text-neutral-500"
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
						<circle cx="9" cy="12" r="1"></circle>
						<circle cx="9" cy="5" r="1"></circle>
						<circle cx="9" cy="19" r="1"></circle>
						<circle cx="15" cy="12" r="1"></circle>
						<circle cx="15" cy="5" r="1"></circle>
						<circle cx="15" cy="19" r="1"></circle>
					</svg>
				</li>
			{/each}
		</ul>

		<div class="flex justify-end mt-3">
			<button
				type="submit"
				disabled={!madeSkillSortChanges || isUpdatingSkillSort}
				class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
			>
				Update
			</button>
		</div>
	</form>

	<div class="border rounded-xl shadow-sm p-4 dark:bg-neutral-800 dark:border-neutral-700">
		<!-- Uploading File Content -->
		<div
			class="mb-4 flex flex-col-reverse item-start sm:flex-row gap-3 justify-between sm:items-center"
		>
			<div class="flex items-start sm:items-center gap-x-3">
				<span
					class="size-8 shrink-0 flex justify-center items-center border border-gray-200 text-gray-500 rounded-lg dark:border-neutral-700 dark:text-neutral-500"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="size-5 text-neutral-400 shrink-0"
					>
						<path
							fill-rule="evenodd"
							d="M11.828 2.25c-.916 0-1.699.663-1.85 1.567l-.091.549a.798.798 0 0 1-.517.608 7.45 7.45 0 0 0-.478.198.798.798 0 0 1-.796-.064l-.453-.324a1.875 1.875 0 0 0-2.416.2l-.243.243a1.875 1.875 0 0 0-.2 2.416l.324.453a.798.798 0 0 1 .064.796 7.448 7.448 0 0 0-.198.478.798.798 0 0 1-.608.517l-.55.092a1.875 1.875 0 0 0-1.566 1.849v.344c0 .916.663 1.699 1.567 1.85l.549.091c.281.047.508.25.608.517.06.162.127.321.198.478a.798.798 0 0 1-.064.796l-.324.453a1.875 1.875 0 0 0 .2 2.416l.243.243c.648.648 1.67.733 2.416.2l.453-.324a.798.798 0 0 1 .796-.064c.157.071.316.137.478.198.267.1.47.327.517.608l.092.55c.15.903.932 1.566 1.849 1.566h.344c.916 0 1.699-.663 1.85-1.567l.091-.549a.798.798 0 0 1 .517-.608 7.52 7.52 0 0 0 .478-.198.798.798 0 0 1 .796.064l.453.324a1.875 1.875 0 0 0 2.416-.2l.243-.243c.648-.648.733-1.67.2-2.416l-.324-.453a.798.798 0 0 1-.064-.796c.071-.157.137-.316.198-.478.1-.267.327-.47.608-.517l.55-.091a1.875 1.875 0 0 0 1.566-1.85v-.344c0-.916-.663-1.699-1.567-1.85l-.549-.091a.798.798 0 0 1-.608-.517 7.507 7.507 0 0 0-.198-.478.798.798 0 0 1 .064-.796l.324-.453a1.875 1.875 0 0 0-.2-2.416l-.243-.243a1.875 1.875 0 0 0-2.416-.2l-.453.324a.798.798 0 0 1-.796.064 7.462 7.462 0 0 0-.478-.198.798.798 0 0 1-.517-.608l-.091-.55a1.875 1.875 0 0 0-1.85-1.566h-.344ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
							clip-rule="evenodd"
						/>
					</svg>
				</span>
				<div>
					<p class="text-sm font-medium text-gray-800 dark:text-white">Your account</p>
					<p class="text-xs text-gray-500 dark:text-neutral-500">
						Manage your account and sessions.
					</p>
				</div>
			</div>
		</div>
		<!-- End Uploading File Content -->

		<div class="flex flex-col sm:flex-row justify-start mt-3 gap-2">
			<a
				href="https://auth.life-in-skills.almostapps.eu/"
				class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
			>
				Manage account
			</a>

			<button
				onclick={logOut}
				disabled={isLoggingOut}
				type="button"
				class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-yellow-500 text-yellow-500 hover:border-yellow-400 focus:outline-none focus:border-yellow-400 focus:text-yellow-400 disabled:opacity-50 disabled:pointer-events-none"
			>
				Logout
			</button>

			<div class="relative">
				<button
					disabled={isDeleting}
					onclick={() => (deleteDropdown = !deleteDropdown)}
					type="button"
					class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent text-red-500 hover:bg-red-100 focus:outline-none focus:bg-red-100 hover:text-red-800 disabled:opacity-50 disabled:pointer-events-none dark:hover:bg-red-800/30 dark:hover:text-red-400 dark:focus:bg-red-800/30 dark:focus:text-red-400"
				>
					Delete account
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
							disabled={isDeleting}
							class="shrink-0 flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700"
							onclick={deleteAccount}
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
		</div>
	</div>
</div>
