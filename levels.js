let output = `[\n`;

let total = 0;
let previousNeeded = 5;
for (let level = 1; level <= 120; level++) {
	let addition = 0;
	if (level < 20) {
		addition = 1;
	} else if (level < 50) {
		addition = 2;
	} else if (level < 80) {
		addition = 3;
	} else if (level < 92) {
		addition = 5;
	} else if (level < 99) {
		addition = 15;
	} else {
		addition = 25;
	}

	const needed = previousNeeded + addition;
	total += needed;

	output += `${total},`;

	if (level % 10 === 0) output += ` // ${level}\n`;

	// console.log(`Level ${level}, +${addition}XP, needed ${needed}XP total ${total}XP`);

	previousNeeded = needed;
}

output += `\n]`;

console.log(output);
