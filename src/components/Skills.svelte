<script lang="ts">
	import type { Skill } from '$lib/appwrite';
	import { getGraphProgress, getLevel } from '$lib/levels';
	import SkillSettings from './SkillSettings.svelte';
	import { tick } from 'svelte';
	import SkillDetail from './SkillDetail.svelte';
	import { hasBonus } from '$lib/skills';

	interface Props {
		skills: Skill[];
	}

	let { skills }: Props = $props();

	$effect(() => {
		// @ts-ignore
		window.HSStaticMethods.autoInit();
	});

	function openNewSkill() {
		// @ts-ignore
		window.HSOverlay.getInstance('#skill-edit-new', true).element.open();
	}

	function getTotalLevel(skills: Skill[]) {
		let totalLevel = 0;

		for (const skill of skills) {
			totalLevel += getLevel(skill.xp);
		}

		return totalLevel;
	}

	function activateSkill(skill: Skill) {
		// @ts-ignore
		window.HSOverlay.getInstance('#skill-detail-' + skill.$id, true).element.open();
	}
</script>

<div class="mt-6 grid grid-cols-8 sm:grid-cols-12 gap-3">
	<div
		class={`col-span-4 flex flex-col items-center gap-0 justify-center border shadow-sm rounded-lg p-4 md:p-5 bg-neutral-950 to-black border-neutral-700 text-neutral-400`}
	>
		<p>Total level</p>
		<h2 class="font-bold text-white text-xl">{getTotalLevel(skills)}</h2>
	</div>

	{#each skills as skill}
		<button
			onclick={() => activateSkill(skill)}
			class={`${getLevel(skill.xp) >= skill.targetLevel ? 'border-yellow-600' : !hasBonus(skill) ? 'border-neutral-700' : 'border-neutral-400'} col-span-4 flex flex-row justify-between items-center border shadow-sm rounded-lg p-4 md:p-5 bg-gradient-to-br ${!hasBonus(skill) ? 'from-neutral-900 via-neutral-900 to-neutral-950' : 'from-neutral-800 via-neutral-800 to-neutral-900'} text-neutral-400`}
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
		onclick={openNewSkill}
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

<SkillSettings id="skill-edit-new" skill={null} />

{#each skills as skill}
	<SkillDetail id={`skill-detail-${skill.$id}`} {skill} />
{/each}
