<!-- <h2 class="text-2xl font-bold md:text-4xl md:leading-tight dark:text-white flex items-center gap-3">
	<div class="bg-neutral-800 p-3 rounded-2xl">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			class="size-6 text-[#e18f49]"
		>
			<path
				fill-rule="evenodd"
				d="M10.5 3.798v5.02a3 3 0 0 1-.879 2.121l-2.377 2.377a9.845 9.845 0 0 1 5.091 1.013 8.315 8.315 0 0 0 5.713.636l.285-.071-3.954-3.955a3 3 0 0 1-.879-2.121v-5.02a23.614 23.614 0 0 0-3 0Zm4.5.138a.75.75 0 0 0 .093-1.495A24.837 24.837 0 0 0 12 2.25a25.048 25.048 0 0 0-3.093.191A.75.75 0 0 0 9 3.936v4.882a1.5 1.5 0 0 1-.44 1.06l-6.293 6.294c-1.62 1.621-.903 4.475 1.471 4.88 2.686.46 5.447.698 8.262.698 2.816 0 5.576-.239 8.262-.697 2.373-.406 3.092-3.26 1.47-4.881L15.44 9.879A1.5 1.5 0 0 1 15 8.818V3.936Z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>

	<span>Curses</span>
</h2> -->

<div>
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
					<p class="text-sm font-medium text-gray-800 dark:text-white">Life points</p>
					<p class="text-xs text-gray-500 dark:text-neutral-500">
						Deaths stay forever on your profile!
					</p>
				</div>
			</div>
			<div class="inline-flex items-center gap-x-2">
				<span class="relative">
					<span
						class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-500"
					>
						<p>No deaths yet</p>
					</span>
				</span>
				<span class="relative">
					<span
						class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500"
					>
						<p>1 death</p>
					</span>
				</span>
			</div>
		</div>
		<!-- End Uploading File Content -->

		<!-- Progress Bar -->
		<div class="sm:pl-10 flex items-center gap-x-3 whitespace-nowrap">
			<div class="text-center">
				<span class="text-gray-800 dark:text-white text-xl font-semibold tracking-wider"
					>6<span class="text-neutral-500 text-sm font-light"><span class="mx-1">/</span>12</span
					></span
				>
			</div>

			<div
				class="transform translate-y-0.5 flex w-full h-3 bg-gray-200 rounded-full overflow-hidden dark:bg-neutral-700"
				role="progressbar"
			>
				<div
					class="flex flex-col justify-center rounded-full overflow-hidden bg-green-500 text-xs text-white text-center whitespace-nowrap transition duration-500"
					style="width: 50%"
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
			<h3 class="text-center text-md font-semibold tracking-wide text-red-500">Curses</h3>

			<div class="max-w-xs flex flex-col rounded-lg shadow-sm mt-3">
				<button
					type="button"
					class="py-3 px-4 inline-flex items-start gap-x-2 first:rounded-t-md text-sm font-medium focus:z-10 border-gray-200 border-b-0 border bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
				>
					<div>
						<span
							class="shrink-0 whitespace-nowrap inline-flex items-center gap-x-1.5 py-1 px-3 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-500"
							>-3 LP</span
						>
					</div>

					<p class="text-left transform translate-y-0.5">Junk food</p>
				</button>

				<button
					type="button"
					class="py-3 px-4 inline-flex items-center justify-center gap-x-2 rounded-b-md text-sm font-medium focus:z-10 border border-gray-200 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 text-neutral-500 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
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

					<p>Add curse</p>
				</button>
			</div>
		</div>
		<div
			class="col-span-6 border sm:rounded-br-xl shadow-sm p-4 dark:bg-green-500/10 dark:border-green-700/25"
		>
			<h3 class="text-center text-md font-semibold tracking-wide text-green-500">Potions</h3>

			<div class="max-w-xs flex flex-col rounded-lg shadow-sm mt-3">
				<button
					type="button"
					class="p-3 inline-flex items-start gap-x-2 first:rounded-t-md text-sm font-medium focus:z-10 border-gray-200 border-b-0 border bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
				>
					<div>
						<span
							class="shrink-0 whitespace-nowrap inline-flex items-center gap-x-1.5 py-1 px-3 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500"
							>+3 LP</span
						>
					</div>

					<p class="text-left transform translate-y-0.5">30 Squads on single leg</p>
				</button>

				<button
					type="button"
					class="p-3 inline-flex items-center justify-center gap-x-2 rounded-b-md text-sm font-medium focus:z-10 border border-gray-200 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 text-neutral-500 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
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
