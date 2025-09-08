<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { databases, type Combat, type CombatAction, type Activity } from '$lib/appwrite';
	import { capitalizeFirstLetter } from '$lib/helpers';
	import { toast } from '$lib/toast';
	import { ID } from 'appwrite';
	import { preventDefault } from 'svelte/legacy';

	interface Props {
		combat: Combat;
		combatActions: CombatAction[];
		admin: boolean;
	}

	let { combat, combatActions = [], admin = false }: Props = $props();

	let editMode = $state(false);
	let deletingAction = $state(false);
	let doingAction = $state(false);
	let creatingAction = $state(false);
	let newName = $state('');
	let newPower = $state(3);

	// Initialize HSOverlay for modal functionality
	$effect(() => {
		// @ts-ignore
		window.HSOverlay.autoInit();
	});

	function getCravings(actions: CombatAction[]) {
		return actions.filter((a) => a.type === 'craving');
	}

	function getPotions(actions: CombatAction[]) {
		return actions.filter((a) => a.type === 'potion');
	}

	async function deleteAction(action: CombatAction) {
		if (deletingAction) {
			return;
		}

		deletingAction = true;

		try {
			await databases.deleteDocument('main', 'combatActions', action.$id);
			
			const actionType = action.type === 'craving' ? 'craving' : 'potion';
			const icon = action.type === 'craving' ? '⛔' : '❇️';
			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `${icon} Deleted ${capitalizeFirstLetter(action.name)} ${actionType}`
			});

			await invalidateAll();

			toast.open({
				type: 'success',
				message: `${capitalizeFirstLetter(actionType)} successfully deleted`
			});
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			deletingAction = false;
		}
	}

	async function doAction(action: CombatAction) {
		if (doingAction) {
			return;
		}

		doingAction = true;

		try {
			let died = false;
			let newHp = combat.hp + (action.type === 'craving' ? -action.power : action.power);
			if (newHp <= 0) {
				newHp = 12;
				died = true;
			}
			
			if(newHp > 12) {
				newHp = 12;
			}

			await databases.updateDocument('main', 'combat', combat.$id, {
				hp: newHp,
				deaths: died ? combat.deaths + 1 : combat.deaths
			});

			const prefix = action.type === 'craving' ? 'Craved' : 'Healed with';
			const icon = action.type === 'craving' ? '⛔' : '❇️';
			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `${icon} ${prefix} ${capitalizeFirstLetter(action.name)}`
			});

			if (died) {
				await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
					text: `You died in a combat`
				});
			}

			await invalidateAll();

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
			const icon = type === 'craving' ? '⛔' : '❇️';
			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `${icon} Added ${capitalizeFirstLetter(newName)} ${type}`
			});
			await invalidateAll();
			// @ts-ignore
			window.HSOverlay.close(document.getElementById('new-' + type));
			toast.open({
				type: 'success',
				message: `${capitalizeFirstLetter(type)} successfully created`
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
</script>

<!-- Combat Health Component -->
<div
	class={`border rounded-xl shadow-sm p-4 dark:bg-neutral-800 dark:border-neutral-700 ${admin ? 'rounded-b-none' : ''}`}
>
	<!-- Health Points Section -->
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
					{admin ? 'Deaths stay forever on your profile!' : "Hero's status when fighting cravings"}
				</p>
			</div>
		</div>
		<div class="inline-flex items-center gap-x-2">
			{#if combat.deaths === 0}
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
						<p>{combat.deaths} {combat.deaths === 1 ? 'death' : 'deaths'}</p>
					</span>
				</span>
			{/if}
		</div>
	</div>

	<!-- Progress Bar -->
	<div class="sm:pl-10 flex items-center gap-x-3 whitespace-nowrap">
		<div class="text-center">
			<span class="text-gray-800 dark:text-white text-xl font-semibold tracking-wider"
				>{combat.hp}<span class="text-neutral-500 text-sm font-light"
					><span class="mx-1">/</span>12</span
				></span
			>
		</div>

		<div
			class="transform translate-y-0.5 flex w-full h-3 bg-gray-200 rounded-full overflow-hidden dark:bg-neutral-700"
			role="progressbar"
		>
			<div
				class={`${combat.hp <= 6 ? 'bg-red-500' : 'bg-green-500'} flex flex-col justify-center rounded-full overflow-hidden text-xs text-white text-center whitespace-nowrap transition duration-500`}
				style={`width: ${Math.ceil((combat.hp / 12) * 100)}%`}
			></div>
		</div>
	</div>
</div>

<!-- Cravings and Potions Section -->
{#if admin}
	<div class="border border-t-0 rounded-b-xl shadow-sm p-4 dark:bg-neutral-800 dark:border-neutral-700">
		<!-- Edit Mode Toggle -->
		<div class="mb-4 flex justify-between items-center">
			<h3 class="text-sm font-medium text-gray-800 dark:text-white">Combat Actions</h3>
			<button
				onclick={() => (editMode = !editMode)}
				type="button"
				class="py-1.5 px-3 inline-flex items-center gap-x-2 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
			>
				{#if editMode}
					<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
					Exit Edit
				{:else}
					<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
					</svg>
					Edit
				{/if}
			</button>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<!-- Cravings Section -->
			<div class="border rounded-lg p-3 dark:bg-red-500/5 dark:border-red-700/25">
				<h4 class="text-sm font-medium text-red-600 dark:text-red-400 mb-3 text-center">Cravings</h4>
				<div class="max-w-xs flex flex-col rounded-lg shadow-sm">
					{#each getCravings(combatActions) as craving}
						<div class="relative">
							<button
								disabled={doingAction}
								onclick={() => doAction(craving)}
								type="button"
								class="w-full py-3 px-4 inline-flex items-start gap-x-2 first:rounded-t-md text-sm font-medium focus:z-10 border-gray-200 border-b-0 border bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
							>
								<div>
									<span class="min-w-[max-content] inline-flex items-center gap-x-1 py-1 px-2 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-500">
										-{craving.power} HP
									</span>
								</div>
								<span class="text-left transform translate-y-0.5">{craving.name}</span>
							</button>
							{#if editMode}
								<button
									onclick={() => deleteAction(craving)}
									disabled={deletingAction}
									type="button"
									class="absolute right-2 top-1/2 -translate-y-1/2 size-6 inline-flex justify-center items-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:bg-red-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-red-800/30 dark:text-red-400 dark:hover:bg-red-800/50"
									aria-label="Delete {craving.name} craving"
								>
									<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
									</svg>
								</button>
							{/if}
						</div>
					{/each}

					<button
						data-hs-overlay="#new-craving"
						type="button"
						class={`py-3 px-4 inline-flex items-center justify-center gap-x-2 ${getCravings(combatActions).length == 0 ? 'rounded-t-md' : ''} rounded-b-md text-sm font-medium focus:z-10 border border-gray-200 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 text-neutral-500 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800`}
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

			<!-- Potions Section -->
			<div class="border rounded-lg p-3 dark:bg-green-500/5 dark:border-green-700/25">
				<h4 class="text-sm font-medium text-green-600 dark:text-green-400 mb-3 text-center">Potions</h4>
				<div class="max-w-xs flex flex-col rounded-lg shadow-sm">
					{#each getPotions(combatActions) as potion}
						<div class="relative">
							<button
								disabled={doingAction}
								onclick={() => doAction(potion)}
								type="button"
								class="w-full p-3 inline-flex items-start gap-x-2 first:rounded-t-md text-sm font-medium focus:z-10 border-gray-200 border-b-0 border bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
							>
								<div>
									<span class="min-w-[max-content] inline-flex items-center gap-x-1 py-1 px-2 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500">
										+{potion.power} HP
									</span>
								</div>
								<span class="text-left transform translate-y-0.5">{potion.name}</span>
							</button>
							{#if editMode}
								<button
									onclick={() => deleteAction(potion)}
									disabled={deletingAction}
									type="button"
									class="absolute right-2 top-1/2 -translate-y-1/2 size-6 inline-flex justify-center items-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:bg-red-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-red-800/30 dark:text-red-400 dark:hover:bg-red-800/50"
									aria-label="Delete {potion.name} potion"
								>
									<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
									</svg>
								</button>
							{/if}
						</div>
					{/each}

					<button
						data-hs-overlay="#new-potion"
						type="button"
						class={`py-3 px-4 inline-flex items-center justify-center gap-x-2 ${getPotions(combatActions).length == 0 ? 'rounded-t-md' : ''} rounded-b-md text-sm font-medium focus:z-10 border border-gray-200 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 text-neutral-500 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800`}
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
{/if}

<!-- Modal Forms -->
{#if admin}
	<!-- New Craving Modal -->
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
		<form onsubmit={preventDefault(() => onCreateAction('craving'))} class="p-4 flex flex-col gap-4">
			<p class="text-gray-800 dark:text-neutral-400">
				Define a bad habit you want to quit. You lose health points every time you fail to resist the
				craving.
			</p>

			<div>
				<div class="flex justify-between items-center">
					<label for="craving-name" class="block text-sm font-medium mb-2 dark:text-white"
						>Craving name</label
					>
				</div>
				<input
					id="craving-name"
					bind:value={newName}
					type="text"
					class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="Smoking, Junk food, Nail-biting, oversleeping"
				/>
			</div>

			<div>
				<div class="flex justify-between items-center">
					<label for="craving-power" class="block text-sm font-medium mb-2 dark:text-white"
						>Craving power</label
					>
				</div>
				<select
					id="craving-power"
					bind:value={newPower}
					class="py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				>
					<option value={1}>-1 HP</option>
					<option value={3}>-3 HP</option>
					<option value={6}>-6 HP</option>
				</select>
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

	<!-- New Potion Modal -->
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
		<form onsubmit={preventDefault(() => onCreateAction('potion'))} class="p-4 flex flex-col gap-4">
			<p class="text-gray-800 dark:text-neutral-400">
				Define a consequence for your temptations. You gain health points by taking a potion.
			</p>

			<div>
				<div class="flex justify-between items-center">
					<label for="potion-name" class="block text-sm font-medium mb-2 dark:text-white"
						>Potion name</label
					>
				</div>
				<input
					id="potion-name"
					bind:value={newName}
					type="text"
					class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
					placeholder="30 push-ups, Cold shower, Charity donation"
				/>
			</div>

			<div>
				<div class="flex justify-between items-center">
					<label for="potion-power" class="block text-sm font-medium mb-2 dark:text-white"
						>Potion power</label
					>
				</div>
				<select
					id="potion-power"
					bind:value={newPower}
					class="py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
				>
					<option value={1}>+1 HP</option>
					<option value={3}>+3 HP</option>
					<option value={6}>+6 HP</option>
				</select>
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
{/if}