<script lang="ts">
	import * as Overlay from '@preline/overlay';
	import { afterNavigate } from '$app/navigation';
	import '../app.css';
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	interface Props {
		data: PageData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	const links = [
		{
			url: '/app/skills',
			name: 'Skills'
		},
		{
			url: '/app/combat',
			name: 'Combat'
		},
		{
			url: '/app/journey',
			name: 'Journey'
		}
	];

	$effect(() => {
		// @ts-ignore
		window.HSCollapse.autoInit();
	});
</script>

<div class="px-3 sm:p-0 max-w-[30rem] flex flex-col mx-auto size-full">
	<header class="mb-auto flex flex-wrap sm:justify-start sm:flex-nowrap z-50 w-full text-sm py-4">
		<nav class="w-full sm:flex sm:items-center sm:justify-between sm:px-0 lg:px-0">
			<div class="flex items-center justify-between">
				<a href="/" class="shrink-0">
					<img src="/logo.svg" alt="Logo" class="size-6 mr-3" />
				</a>
				<a
					class="text-[#e18f49] flex-none text-xl font-semibold focus:outline-none focus:opacity-80"
					href="/">Life <span class="text-neutral-200">in</span> Skills</a
				>
				{#if data.user}
					<div class="sm:hidden">
						<button
							type="button"
							class="hs-collapse-toggle relative size-9 flex justify-center items-center border border-white/10 font-medium text-sm text-gray-200 rounded-lg hover:bg-white/10 focus:outline-none focus:bg-white/10"
							id="hs-navbar-cover-page-collapse"
							aria-expanded="false"
							aria-controls="hs-navbar-cover-page"
							aria-label="Toggle navigation"
							data-hs-collapse="#hs-navbar-cover-page"
						>
							<svg
								class="hs-collapse-open:hidden shrink-0 size-4"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line
									x1="3"
									x2="21"
									y1="18"
									y2="18"
								/></svg
							>
							<svg
								class="hs-collapse-open:block hidden shrink-0 size-4"
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
							>
							<span class="sr-only">Toggle navigation</span>
						</button>
					</div>
				{/if}
			</div>
			<div
				id="hs-navbar-cover-page"
				class="hs-collapse hidden overflow-hidden transition-all duration-300 basis-full grow sm:block"
				aria-labelledby="hs-navbar-cover-page-collapse"
			>
				<div
					class="flex flex-col gap-5 mt-5 sm:flex-row sm:items-center sm:justify-end sm:mt-0 sm:ps-5"
				>
					{#if data.user}
						{#each links as link}
							<a
								class={`font-medium ${$page.url.pathname === link.url ? 'text-white focus:outline-none' : 'text-white/70 hover:text-white focus:outline-none focus:text-white'}`}
								href={link.url}>{link.name}</a
							>
						{/each}

						<a
							aria-label="Settings"
							class="w-[fit-content] font-medium bg-neutral-800 rounded-full p-1.5 text-white/70 hover:text-white focus:outline-none focus:text-white"
							href="/app/settings"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="size-4"
							>
								<path
									fill-rule="evenodd"
									d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
									clip-rule="evenodd"
								/>
							</svg>
						</a>
					{/if}
				</div>
			</div>
		</nav>
	</header>

	<hr class="border-neutral-800 border-[1px]" />

	<main id="content">
		<div class="pt-6">
			{@render children?.()}
		</div>
	</main>
</div>
