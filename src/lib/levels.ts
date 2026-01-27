import type { Skill } from './appwrite';

const maxLevel = 120;

const levelsXp = [
	83,
	174,
	276,
	388,
	512,
	650,
	801,
	969,
	1154, // 10
	1358,
	1584,
	1833,
	2107,
	2411,
	2746,
	3115,
	3523,
	3973,
	4470, // 20
	5018,
	5624,
	6291,
	7028,
	7842,
	8740,
	9730,
	10824,
	12031,
	13363, // 30
	14833,
	16456,
	18247,
	20224,
	22406,
	24815,
	27473,
	30408,
	33648,
	37224, // 40
	41171,
	45529,
	50339,
	55649,
	61512,
	67983,
	75127,
	83014,
	91721,
	101333, // 50
	111945,
	123660,
	136594,
	150872,
	166636,
	184040,
	203254,
	224466,
	247886,
	273742, // 60
	302288,
	333804,
	368599,
	407015,
	449428,
	496254,
	547953,
	605032,
	668051,
	737627, // 70
	814445,
	899257,
	992895,
	1096278,
	1210421,
	1336443,
	1475581,
	1629200,
	1798808,
	1986068, // 80
	2192818,
	2421087,
	2673114,
	2951373,
	3258594,
	3597792,
	3972294,
	4385776,
	4842295,
	5346332, // 90
	5902831,
	6517253,
	7195629,
	7944614,
	8771558,
	9684577,
	10692629,
	11805606,
	13034431,
	14391160, // 100
	15889109,
	17542976,
	19368992,
	21385073,
	23611006,
	26068632,
	28782069,
	31777943,
	35085654,
	38737661, // 110
	42769801,
	47221641,
	52136869,
	57563718,
	63555443,
	70170840,
	77474828,
	85539082,
	94442737,
	104273167 // 120
];

export function getXp(level: number) {
	return levelsXp[level - 1];
}

export function getLevel(xp: number) {
	let i = 1;
	for (const levelXp of levelsXp) {
		if (xp < levelXp) {
			return i;
		}

		i++;
	}

	return maxLevel;
}

export function getGraphProgress(skill: Skill | null | undefined, max = 75) {
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
