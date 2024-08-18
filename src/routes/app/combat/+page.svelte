<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { databases, type Activity, type CombatAction } from '$lib/appwrite';
	import { capitalizeFirstLetter } from '$lib/helpers';
	import { toast } from '$lib/toast';
	import { ID } from 'appwrite';
	import type { PageData } from './$types';

	export let data: PageData;

	function getCravings(actions: CombatAction[]) {
		return actions.filter((a) => a.type === 'craving');
	}

	function getPotions(actions: CombatAction[]) {
		return actions.filter((a) => a.type === 'potion');
	}

	let newName = '';
	let newPower = 3;
	let creatingAction = false;

	async function onCreateAction(type: 'craving' | 'potion') {
		if (creatingAction) {
			return;
		}

		creatingAction = true;

		try {
			await databases.createDocument<CombatAction>('main', 'combatActions', ID.unique(), {
				name: newName,
				type,
				power: newPower
			});
			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `Added ${capitalizeFirstLetter(newName)} craving`
			});
			await invalidate('combat:all');
			// @ts-ignore
			window.HSOverlay.close(document.getElementById('new-' + type));
			toast.open({
				type: 'log',
				message: 'Craving successfully created'
			});
			newName = '';
			newPower = 3;
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			creatingAction = false;
		}
	}

	let doingAction = false;
	async function doAction(action: CombatAction) {
		if (doingAction) {
			return;
		}

		doingAction = true;

		try {
			let died = false;
			let newHp = data.combat.hp + (action.type === 'craving' ? -action.power : action.power);
			if (newHp <= 0) {
				newHp = 12;
				died = true;
			}

			await databases.updateDocument('main', 'combat', data.combat.$id, {
				hp: newHp,
				deaths: died ? data.combat.deaths + 1 : data.combat.deaths
			});

			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `Craved ${capitalizeFirstLetter(action.name)}`
			});

			if (died) {
				await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
					text: `You died in a combat`
				});
			}

			await invalidate('combat:all');

			if (died) {
				toast.open({
					type: 'log',
					message: 'Death added to your profile'
				});
			}

			if (action.type === 'craving') {
				// @ts-ignore
				celebrateCraving();
			} else if (action.type === 'potion') {
				// @ts-ignore
				celebratePotion();
			}
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			doingAction = false;
		}
	}
</script>

<h2 class="text-2xl font-bold md:text-4xl md:leading-tight dark:text-white flex items-center gap-3">
	<div class="bg-neutral-800 p-3 rounded-2xl">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			class="size-6 text-[#e18f49]"
		>
			<path
				fill-rule="evenodd"
				d="M8.478 1.6a.75.75 0 0 1 .273 1.026 3.72 3.72 0 0 0-.425 1.121c.058.058.118.114.18.168A4.491 4.491 0 0 1 12 2.25c1.413 0 2.673.651 3.497 1.668.06-.054.12-.11.178-.167a3.717 3.717 0 0 0-.426-1.125.75.75 0 1 1 1.298-.752 5.22 5.22 0 0 1 .671 2.046.75.75 0 0 1-.187.582c-.241.27-.505.52-.787.749a4.494 4.494 0 0 1 .216 2.1c-.106.792-.753 1.295-1.417 1.403-.182.03-.364.057-.547.081.152.227.273.476.359.742a23.122 23.122 0 0 0 3.832-.803 23.241 23.241 0 0 0-.345-2.634.75.75 0 0 1 1.474-.28c.21 1.115.348 2.256.404 3.418a.75.75 0 0 1-.516.75c-1.527.499-3.119.854-4.76 1.049-.074.38-.22.735-.423 1.05 2.066.209 4.058.672 5.943 1.358a.75.75 0 0 1 .492.75 24.665 24.665 0 0 1-1.189 6.25.75.75 0 0 1-1.425-.47 23.14 23.14 0 0 0 1.077-5.306c-.5-.169-1.009-.32-1.524-.455.068.234.104.484.104.746 0 3.956-2.521 7.5-6 7.5-3.478 0-6-3.544-6-7.5 0-.262.037-.511.104-.746-.514.135-1.022.286-1.522.455.154 1.838.52 3.616 1.077 5.307a.75.75 0 1 1-1.425.468 24.662 24.662 0 0 1-1.19-6.25.75.75 0 0 1 .493-.749 24.586 24.586 0 0 1 4.964-1.24h.01c.321-.046.644-.085.969-.118a2.983 2.983 0 0 1-.424-1.05 24.614 24.614 0 0 1-4.76-1.05.75.75 0 0 1-.516-.75c.057-1.16.194-2.302.405-3.417a.75.75 0 0 1 1.474.28c-.164.862-.28 1.74-.345 2.634 1.237.371 2.517.642 3.832.803.085-.266.207-.515.359-.742a18.698 18.698 0 0 1-.547-.08c-.664-.11-1.311-.612-1.417-1.404a4.535 4.535 0 0 1 .217-2.103 6.788 6.788 0 0 1-.788-.751.75.75 0 0 1-.187-.583 5.22 5.22 0 0 1 .67-2.04.75.75 0 0 1 1.026-.273Z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>

	<span>Combat</span>
</h2>

<div class="mt-6">
	<!-- File Uploading Progress Form -->
	<div
		class="border rounded-xl rounded-b-none shadow-sm p-4 dark:bg-neutral-800 dark:border-neutral-700"
	>
		<!-- Uploading File Content -->
		<div
			class="mb-2 flex flex-col-reverse item-start sm:flex-row gap-3 justify-between sm:items-center"
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
							d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"
						/>
					</svg>
				</span>
				<div>
					<p class="text-sm font-medium text-gray-800 dark:text-white">Health points</p>
					<p class="text-xs text-gray-500 dark:text-neutral-500">
						Deaths stay forever on your profile!
					</p>
				</div>
			</div>
			<div class="inline-flex items-center gap-x-2">
				{#if data.combat.deaths === 0}
					<span class="relative">
						<span
							class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-500"
						>
							<p>No deaths yet</p>
						</span>
					</span>
				{:else}
					<span class="relative">
						<span
							class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500"
						>
							<p>{data.combat.deaths} {data.combat.deaths === 1 ? 'death' : 'deaths'}</p>
						</span>
					</span>
				{/if}
			</div>
		</div>
		<!-- End Uploading File Content -->

		<!-- Progress Bar -->
		<div class="sm:pl-10 flex items-center gap-x-3 whitespace-nowrap">
			<div class="text-center">
				<span class="text-gray-800 dark:text-white text-xl font-semibold tracking-wider"
					>{data.combat.hp}<span class="text-neutral-500 text-sm font-light"
						><span class="mx-1">/</span>12</span
					></span
				>
			</div>

			<div
				class="transform translate-y-0.5 flex w-full h-3 bg-gray-200 rounded-full overflow-hidden dark:bg-neutral-700"
				role="progressbar"
			>
				<div
					class="flex flex-col justify-center rounded-full overflow-hidden bg-green-500 text-xs text-white text-center whitespace-nowrap transition duration-500"
					style={`width: ${Math.ceil((data.combat.hp / 12) * 100)}%`}
				></div>
			</div>
		</div>
		<!-- End Progress Bar -->
	</div>
	<!-- End File Uploading Progress Form -->

	<div class="mt-1.5 grid grid-cols-6 gap-1.5 sm:grid-cols-12">
		<div
			class="col-span-6 border sm:rounded-bl-xl shadow-sm p-4 dark:bg-red-500/10 dark:border-red-700/25"
		>
			<h3 class="text-center text-md font-semibold tracking-wide text-red-500">Cravings</h3>

			<div class="max-w-xs flex flex-col rounded-lg shadow-sm mt-3">
				{#each getCravings(data.combatActions) as craving}
					<button
						disabled={doingAction}
						on:click={() => doAction(craving)}
						type="button"
						class="py-3 px-4 inline-flex items-start gap-x-2 first:rounded-t-md text-sm font-medium focus:z-10 border-gray-200 border-b-0 border bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
					>
						<div>
							<span
								class="shrink-0 whitespace-nowrap inline-flex items-center gap-x-1.5 py-1 px-3 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-500"
								>-{craving.power} HP</span
							>
						</div>

						<p class="text-left transform translate-y-0.5">{craving.name}</p>
					</button>
				{/each}

				<button
					data-hs-overlay="#new-craving"
					type="button"
					class={`py-3 px-4 inline-flex items-center justify-center gap-x-2 ${getCravings(data.combatActions).length == 0 ? 'rounded-t-md' : ''} rounded-b-md text-sm font-medium focus:z-10 border border-gray-200 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 text-neutral-500 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>

					<p>Add craving</p>
				</button>
			</div>
		</div>
		<div
			class="col-span-6 border sm:rounded-br-xl shadow-sm p-4 dark:bg-green-500/10 dark:border-green-700/25"
		>
			<h3 class="text-center text-md font-semibold tracking-wide text-green-500">Potions</h3>

			<div class="max-w-xs flex flex-col rounded-lg shadow-sm mt-3">
				{#each getPotions(data.combatActions) as potion}
					<button
						disabled={doingAction}
						on:click={() => doAction(potion)}
						type="button"
						class="p-3 inline-flex items-start gap-x-2 first:rounded-t-md text-sm font-medium focus:z-10 border-gray-200 border-b-0 border bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
					>
						<div>
							<span
								class="shrink-0 whitespace-nowrap inline-flex items-center gap-x-1.5 py-1 px-3 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500"
								>+{potion.power} HP</span
							>
						</div>

						<p class="text-left transform translate-y-0.5">{potion.name}</p>
					</button>
				{/each}

				<button
					data-hs-overlay="#new-potion"
					type="button"
					class={`py-3 px-4 inline-flex items-center justify-center gap-x-2 ${getPotions(data.combatActions).length == 0 ? 'rounded-t-md' : ''} rounded-b-md text-sm font-medium focus:z-10 border border-gray-200 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 text-neutral-500 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>

					<p>Add potion</p>
				</button>
			</div>
		</div>
	</div>
</div>

<div
	id="new-craving"
	class="hs-overlay hs-overlay-open:translate-x-0 hidden translate-x-full fixed top-0 end-0 transition-all duration-300 transform h-full max-w-sm w-full z-[80] bg-white border-s dark:bg-neutral-800 dark:border-neutral-700"
	role="dialog"
	tabindex="-1"
>
	<div class="flex justify-between items-center py-3 px-4 border-b dark:border-neutral-700">
		<h3 class="font-bold text-gray-800 dark:text-white">Add a new craving</h3>
		<button
			type="button"
			class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
			aria-label="Close"
			data-hs-overlay="#new-craving"
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
	<form on:submit|preventDefault={() => onCreateAction('craving')} class="p-4 flex flex-col gap-4">
		<p class="text-gray-800 dark:text-neutral-400">
			Define a bad habit you want to quit. You lose health points every time you fail to resist the
			craving.
		</p>

		<div>
			<div class="flex justify-between items-center">
				<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
					>Craving name</label
				>
			</div>
			<input
				bind:value={newName}
				type="text"
				class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				placeholder="Smoking, Junk food, Nail-biting, oversleeping"
			/>
		</div>

		<div>
			<div class="flex justify-between items-center">
				<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
					>Craving power</label
				>
			</div>
			<!-- Floating Select -->
			<select
				bind:value={newPower}
				class="py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
			>
				<option value={1}>-1 HP</option>
				<option value={3}>-3 HP</option>
				<option value={6}>-6 HP</option>
			</select>
			<div class="relative"></div>
			<!-- End Floating Select -->
		</div>

		<div>
			<button
				disabled={creatingAction}
				type="submit"
				class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#e18f49] text-white hover:bg-opacity-75 disabled:opacity-50 disabled:pointer-events-none"
			>
				Create craving
			</button>
		</div>
	</form>
</div>

<div
	id="new-potion"
	class="hs-overlay hs-overlay-open:translate-x-0 hidden translate-x-full fixed top-0 end-0 transition-all duration-300 transform h-full max-w-sm w-full z-[80] bg-white border-s dark:bg-neutral-800 dark:border-neutral-700"
	role="dialog"
	tabindex="-1"
>
	<div class="flex justify-between items-center py-3 px-4 border-b dark:border-neutral-700">
		<h3 class="font-bold text-gray-800 dark:text-white">Add a new potion</h3>
		<button
			type="button"
			class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
			aria-label="Close"
			data-hs-overlay="#new-potion"
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
	<form on:submit|preventDefault={() => onCreateAction('potion')} class="p-4 flex flex-col gap-4">
		<p class="text-gray-800 dark:text-neutral-400">
			Define a consequence for your temptations. You gain health points by taking a potion.
		</p>

		<div>
			<div class="flex justify-between items-center">
				<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
					>Potion name</label
				>
			</div>
			<input
				bind:value={newName}
				type="text"
				class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				placeholder="30 push-ups, Cold shower, Charity donation"
			/>
		</div>

		<div>
			<div class="flex justify-between items-center">
				<label for="with-corner-hint" class="block text-sm font-medium mb-2 dark:text-white"
					>Potion power</label
				>
			</div>
			<!-- Floating Select -->
			<select
				bind:value={newPower}
				class="py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
			>
				<option value={1}>+1 HP</option>
				<option value={3}>+3 HP</option>
				<option value={6}>+6 HP</option>
			</select>
			<div class="relative"></div>
			<!-- End Floating Select -->
		</div>

		<div>
			<button
				disabled={creatingAction}
				type="submit"
				class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#e18f49] text-white hover:bg-opacity-75 disabled:opacity-50 disabled:pointer-events-none"
			>
				Create potion
			</button>
		</div>
	</form>
</div>
