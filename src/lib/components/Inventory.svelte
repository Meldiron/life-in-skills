<script lang="ts">
	import type { InventoryItem, Activity } from '$lib/appwrite';
	import { databases, functions } from '$lib/appwrite';
	import { ID, ExecutionMethod } from 'appwrite';
	import { invalidateAll } from '$app/navigation';
	import { preventDefault } from 'svelte/legacy';
	import { toast } from '$lib/toast';
	import { storeUser } from '$lib/store.svelte';

	interface Props {
		inventoryItems: InventoryItem[];
		admin: boolean;
	}

	let { inventoryItems, admin }: Props = $props();

	let editMode = $state(false);
	let deletingItem: string | null = $state(null);
	let newName = $state('');
	let newIcon = $state('📦');
	let newCount = $state(1);
	let usedEmojis: { [key: string]: string[] } = {};
	let generatingEmoji = $state(false);
	let quickActionAmount: number | 'all' = $state(1);
	let actionMode: 'deposit' | 'withdraw' = $state('deposit');

	// Initialize HSOverlay for modal functionality
	$effect(() => {
		// @ts-ignore
		window.HSOverlay.autoInit();
	});

	function openCreateModal() {
		// @ts-ignore
		window.HSOverlay.getInstance('#create-item-modal', true).element.open();
	}

	async function createItem() {
		if (!newName.trim()) {
			toast.open({
				type: 'error',
				message: 'Please enter an item name'
			});
			return;
		}

		try {
			const itemName = newName.trim();
			const itemIcon = newIcon;
			const itemCount = Math.max(0, newCount);

			await databases.createDocument('main', 'inventory', ID.unique(), {
				name: itemName,
				count: itemCount,
				icon: itemIcon,
				userId: storeUser?.value?.$id ?? ''
			});

			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `Added ${itemName} to inventory (${itemCount}x)`,
				icon: itemIcon
			});

			toast.open({
				type: 'success',
				message: `${itemName} has been added to your inventory`
			});

			newName = '';
			newIcon = '📦';
			newCount = 1;

			// @ts-ignore
			window.HSOverlay.getInstance('#create-item-modal', true).element.close();

			await invalidateAll();
		} catch (error) {
			console.error(error);
			toast.open({
				type: 'error',
				message: 'An error occurred while creating the item'
			});
		}
	}

	async function deleteItem(item: InventoryItem) {
		deletingItem = item.$id;
		try {
			await databases.deleteDocument('main', 'inventory', item.$id);

			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `Removed ${item.name} from inventory`,
				icon: item.icon
			});

			toast.open({
				type: 'success',
				message: `${item.name} has been removed from your inventory`
			});

			await invalidateAll();
		} catch (error) {
			console.error(error);
			toast.open({
				type: 'error',
				message: 'An error occurred while deleting the item'
			});
		} finally {
			deletingItem = null;
		}
	}

	async function updateCount(item: InventoryItem) {
		// Handle "all" in withdraw mode - set count to 0
		let newCount: number;
		let actualChange: number;

		if (actionMode === 'withdraw' && quickActionAmount === 'all') {
			newCount = 0;
			actualChange = -item.count;
		} else {
			const amount =
				actionMode === 'deposit' ? (quickActionAmount as number) : -(quickActionAmount as number);
			newCount = Math.max(0, item.count + amount);
			actualChange = newCount - item.count;
		}

		try {
			await databases.updateDocument('main', 'inventory', item.$id, {
				count: newCount
			});

			const action = actualChange > 0 ? 'Added' : 'Removed';
			const changeAmount = Math.abs(actualChange);
			await databases.createDocument<Activity>('main', 'activity', ID.unique(), {
				text: `${action} ${changeAmount}x ${item.name}`,
				icon: item.icon
			});

			toast.open({
				type: 'success',
				message: `${action} ${changeAmount}x ${item.name}`
			});

			await invalidateAll();
		} catch (error) {
			console.error(error);
			toast.open({
				type: 'error',
				message: 'An error occurred while updating the item count'
			});
		}
	}

	function setQuickAmount(amount: number | 'all', item?: InventoryItem) {
		if (amount === 'all') {
			quickActionAmount = 'all';
		} else if (typeof amount === 'number') {
			quickActionAmount = amount;
		}
	}

	async function generateEmoji() {
		if (generatingEmoji) {
			return;
		}

		generatingEmoji = true;

		try {
			const execution = await functions.createExecution(
				'api',
				JSON.stringify({
					skillName: newName,
					usedEmojis: usedEmojis[newName] ?? []
				}),
				false,
				'/v1/ai/emoji',
				ExecutionMethod.POST,
				{}
			);

			if (execution.responseStatusCode !== 200) {
				throw new Error(execution.responseBody);
			}

			newIcon = execution.responseBody;

			if (!usedEmojis[newName]) {
				usedEmojis[newName] = [];
			}
			usedEmojis[newName].push(newIcon);
		} catch (err: any) {
			toast.open({
				type: 'error',
				message: err.message ? err.message : err.toString()
			});
		} finally {
			generatingEmoji = false;
		}
	}

	function onIconChange(event: any) {
		const newValue = event.target.value.replace(new RegExp(`^${newIcon}`), '');
		newIcon = newValue;
	}
</script>

<div class="border rounded-xl shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
	<!-- Header -->
	<div
		class="border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:border-neutral-700 flex justify-between items-center"
	>
		<h3 class="text-lg font-bold text-gray-800 dark:text-white">
			{admin ? 'Your Inventory' : 'Inventory'}
		</h3>
		{#if admin}
			<div class="flex gap-2">
				<button
					onclick={() => (editMode = !editMode)}
					type="button"
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-neutral-700 text-white hover:bg-neutral-600 focus:outline-none focus:bg-neutral-600 disabled:opacity-50 disabled:pointer-events-none"
				>
					{#if editMode}
						<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
						Cancel
					{:else}
						<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							></path>
						</svg>
						Edit
					{/if}
				</button>
				<button
					onclick={openCreateModal}
					type="button"
					class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-[#e18f49] text-white hover:bg-[#d17f39] focus:outline-none focus:bg-[#d17f39] disabled:opacity-50 disabled:pointer-events-none"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="size-4"
					>
						<path
							fill-rule="evenodd"
							d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
							clip-rule="evenodd"
						/>
					</svg>
					Add Item
				</button>
			</div>
		{/if}
	</div>

	<!-- Quick Action Configuration -->
	{#if admin && inventoryItems.length > 0}
		<div class="border-b p-4 md:px-5 md:py-4 dark:border-neutral-700 bg-neutral-900/50">
			<div class="flex flex-col gap-4">
				<!-- Mode Toggle -->
				<div class="flex flex-col sm:flex-row sm:items-center gap-3">
					<label class="text-sm font-medium text-gray-800 dark:text-white whitespace-nowrap">
						Action
					</label>
					<div class="flex items-center gap-2">
						<button
							onclick={() => (actionMode = 'deposit')}
							type="button"
							class={`py-2 px-4 text-sm font-medium rounded-lg border transition-colors ${actionMode === 'deposit' ? 'border-green-600 bg-green-600 text-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
						>
							<div class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									class="size-4"
								>
									<path
										fill-rule="evenodd"
										d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
										clip-rule="evenodd"
									/>
								</svg>
								Deposit
							</div>
						</button>
						<button
							onclick={() => (actionMode = 'withdraw')}
							type="button"
							class={`py-2 px-4 text-sm font-medium rounded-lg border transition-colors ${actionMode === 'withdraw' ? 'border-red-600 bg-red-600 text-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
						>
							<div class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									class="size-4"
								>
									<path
										fill-rule="evenodd"
										d="M4.25 12a.75.75 0 0 1 .75-.75h14a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Z"
										clip-rule="evenodd"
									/>
								</svg>
								Withdraw
							</div>
						</button>
					</div>
				</div>

				<!-- Amount Configuration -->
				<div class="flex flex-col sm:flex-row sm:items-center gap-3">
					<label class="text-sm font-medium text-gray-800 dark:text-white whitespace-nowrap">
						Quantity:
					</label>
					<div class="flex items-center gap-2 flex-wrap">
						<input
							value={quickActionAmount === 'all' ? '' : quickActionAmount}
							onchange={(e) => {
								const val = parseInt(e.currentTarget.value);
								if (!isNaN(val) && val > 0) {
									quickActionAmount = val;
								}
							}}
							type="number"
							min="1"
							disabled={quickActionAmount === 'all'}
							class="py-2 px-3 w-24 border-gray-200 rounded-lg text-sm focus:border-[#e18f49] focus:ring-[#e18f49] dark:bg-neutral-800 dark:border-neutral-700 dark:text-white disabled:opacity-50 disabled:pointer-events-none"
						/>
						<button
							onclick={() => setQuickAmount(1)}
							type="button"
							class={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${quickActionAmount === 1 ? 'border-[#e18f49] bg-[#e18f49] text-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
						>
							1
						</button>
						<button
							onclick={() => setQuickAmount(5)}
							type="button"
							class={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${quickActionAmount === 5 ? 'border-[#e18f49] bg-[#e18f49] text-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
						>
							5
						</button>
						<button
							onclick={() => setQuickAmount(10)}
							type="button"
							class={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${quickActionAmount === 10 ? 'border-[#e18f49] bg-[#e18f49] text-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
						>
							10
						</button>
						<button
							onclick={() => setQuickAmount(14)}
							type="button"
							class={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${quickActionAmount === 14 ? 'border-[#e18f49] bg-[#e18f49] text-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
						>
							14
						</button>
						<button
							onclick={() => setQuickAmount(28)}
							type="button"
							class={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${quickActionAmount === 28 ? 'border-[#e18f49] bg-[#e18f49] text-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
						>
							28
						</button>
						{#if actionMode === 'withdraw'}
							<button
								onclick={() => setQuickAmount('all')}
								type="button"
								class={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${quickActionAmount === 'all' ? 'border-red-600 bg-red-600 text-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
							>
								All
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Content -->
	<div class="p-4 md:p-5">
		{#if inventoryItems.length === 0}
			<div class="text-center py-8">
				<div class="text-6xl mb-4">📦</div>
				<p class="text-gray-500 dark:text-neutral-400">
					{admin ? 'Your inventory' : 'Inventory'} is empty
				</p>
				{#if admin}
					<p class="text-sm text-gray-400 dark:text-neutral-500 mt-2">
						Click "Add Item" to start collecting items
					</p>
				{/if}
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{#each inventoryItems as item (item.$id)}
					<div
						class="relative border rounded-lg p-4 dark:bg-neutral-900 dark:border-neutral-700 hover:border-neutral-600 transition-colors"
					>
						<div class="flex items-center justify-between gap-3">
							<div class="flex items-center gap-3 flex-1 min-w-0">
								<div class="text-3xl shrink-0">{item.icon}</div>
								<div class="flex-1 min-w-0">
									<h4 class="font-medium text-gray-800 dark:text-white truncate">
										{item.name}
									</h4>
									<p class="text-sm text-gray-500 dark:text-neutral-400">
										Count: <span class="font-semibold text-[#e18f49]">{item.count}</span>
									</p>
								</div>
							</div>
							{#if editMode}
								<button
									onclick={() => deleteItem(item)}
									disabled={deletingItem === item.$id}
									type="button"
									aria-label="Delete {item.name}"
									class="shrink-0 py-1 px-2 text-sm font-medium rounded-lg border border-transparent text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 focus:outline-none focus:bg-red-100 dark:focus:bg-red-900/20 disabled:opacity-50 disabled:pointer-events-none"
								>
									<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										></path>
									</svg>
								</button>
							{:else if admin}
								<button
									onclick={() => updateCount(item)}
									disabled={actionMode === 'withdraw' &&
										(item.count === 0 ||
											(quickActionAmount !== 'all' && quickActionAmount > item.count))}
									type="button"
									aria-label="{actionMode === 'deposit'
										? 'Deposit'
										: 'Withdraw'} {quickActionAmount}"
									class={`size-8 inline-flex justify-center items-center rounded-lg border transition-colors disabled:opacity-50 disabled:pointer-events-none ${actionMode === 'deposit' ? 'border-green-600 bg-green-600 text-white hover:bg-green-700' : 'border-red-600 bg-red-600 text-white hover:bg-red-700'}`}
								>
									{#if actionMode === 'deposit'}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											class="size-4"
										>
											<path
												fill-rule="evenodd"
												d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
												clip-rule="evenodd"
											/>
										</svg>
									{:else}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											class="size-4"
										>
											<path
												fill-rule="evenodd"
												d="M4.25 12a.75.75 0 0 1 .75-.75h14a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Z"
												clip-rule="evenodd"
											/>
										</svg>
									{/if}
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Create Item Modal -->
{#if admin}
	<div
		id="create-item-modal"
		class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
		role="dialog"
		tabindex="-1"
		aria-labelledby="create-item-modal-label"
	>
		<div
			class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)] flex items-center"
		>
			<div
				class="w-full flex flex-col bg-white border shadow-sm rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70"
			>
				<div class="flex justify-between items-center py-3 px-4 border-b dark:border-neutral-700">
					<h3 class="font-bold text-gray-800 dark:text-white" id="create-item-modal-label">
						Add New Item
					</h3>
					<button
						type="button"
						class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
						aria-label="Close"
						data-hs-overlay="#create-item-modal"
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
				<form onsubmit={preventDefault(createItem)} class="p-4 flex flex-col gap-4">
					<div>
						<label for="item-name" class="block text-sm font-medium mb-2 dark:text-white">
							Item Name
						</label>
						<input
							bind:value={newName}
							type="text"
							id="item-name"
							class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-[#e18f49] focus:ring-[#e18f49] disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							placeholder="Enter item name"
							required
						/>
					</div>

					<div>
						<label for="item-count" class="block text-sm font-medium mb-2 dark:text-white">
							Initial Quantity
						</label>
						<input
							bind:value={newCount}
							type="number"
							id="item-count"
							min="0"
							class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-[#e18f49] focus:ring-[#e18f49] disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
							placeholder="1"
						/>
					</div>

					<div>
						<div class="flex justify-between items-center">
							<label class="block text-sm font-medium mb-2 dark:text-white">Icon</label>
							<span class="block mb-2 text-sm text-gray-500 dark:text-neutral-500"
								>Emoji recommended</span
							>
						</div>
						<div class="flex items-center space-x-1 mb-3">
							<input
								disabled={generatingEmoji}
								value={newIcon}
								oninput={onIconChange}
								type="text"
								class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-[#e18f49] focus:ring-[#e18f49] disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
								placeholder="Enter or select emoji"
							/>

							<button
								aria-label="Generate emoji with AI"
								disabled={generatingEmoji || !newName}
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

					<div class="flex justify-end gap-2 mt-2">
						<button
							type="button"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
							data-hs-overlay="#create-item-modal"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-[#e18f49] text-white hover:bg-[#d17f39] focus:outline-none focus:bg-[#d17f39] disabled:opacity-50 disabled:pointer-events-none"
						>
							Create Item
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
