<script lang="ts">
	import { getLevel } from '$lib/levels';
	import { type Skill } from '$lib/appwrite';

	interface Props {
		skills: Skill[];
	}

	let { skills }: Props = $props();

	function getTotalLevel(skills: Skill[]) {
		let totalLevel = 0;

		for (const skill of skills) {
			totalLevel += getLevel(skill.xp);
		}

		return totalLevel;
	}
</script>

<div
	class={`col-span-4 flex flex-col items-center gap-0 justify-center border shadow-sm rounded-lg p-4 md:p-5 bg-neutral-950 to-black border-neutral-700 text-neutral-400`}
>
	<p>Total level</p>
	<h2 class="font-bold text-white text-xl">{getTotalLevel(skills)}</h2>
</div>
