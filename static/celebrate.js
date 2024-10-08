function celebrateCraving() {
	var defaults = {
		flat: true,
		spread: 360,
		ticks: 50,
		gravity: 0,
		scalar: 2,
		decay: 0.95,
		startVelocity: 30,
		shapes: [
			confetti.shapeFromText({ text: '❌', scalar: 6 }),
			confetti.shapeFromText({ text: '😡', scalar: 6 }),
			confetti.shapeFromText({ text: '🚨', scalar: 6 }),
			confetti.shapeFromText({ text: '❗', scalar: 6 }),
			confetti.shapeFromText({ text: '🔴', scalar: 6 })
		]
	};

	function shoot() {
		confetti({
			...defaults,
			particleCount: 40
		});

		confetti({
			...defaults,
			particleCount: 10
		});
	}

	setTimeout(shoot, 0);
	setTimeout(shoot, 200);
	setTimeout(shoot, 300);
	setTimeout(shoot, 600);
}

function celebratePotion() {
	var defaults = {
		flat: true,
		spread: 360,
		ticks: 50,
		gravity: 0,
		scalar: 2,
		decay: 0.95,
		startVelocity: 30,
		shapes: [
			confetti.shapeFromText({ text: '🌱', scalar: 6 }),
			confetti.shapeFromText({ text: '💚', scalar: 6 }),
			confetti.shapeFromText({ text: '🍏', scalar: 6 }),
			confetti.shapeFromText({ text: '✅', scalar: 6 }),
			confetti.shapeFromText({ text: '🟢', scalar: 6 })
		]
	};

	function shoot() {
		confetti({
			...defaults,
			particleCount: 40
		});

		confetti({
			...defaults,
			particleCount: 10
		});
	}

	setTimeout(shoot, 0);
	setTimeout(shoot, 200);
	setTimeout(shoot, 300);
	setTimeout(shoot, 600);
}

function celebrateLevel() {
	const duration = 5 * 1000,
		animationEnd = Date.now() + duration,
		defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

	function randomInRange(min, max) {
		return Math.random() * (max - min) + min;
	}

	const interval = setInterval(function () {
		const timeLeft = animationEnd - Date.now();

		if (timeLeft <= 0) {
			return clearInterval(interval);
		}

		const particleCount = 50 * (timeLeft / duration);

		// since particles fall down, start a bit higher than random
		confetti(
			Object.assign({}, defaults, {
				particleCount,
				origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
			})
		);
		confetti(
			Object.assign({}, defaults, {
				particleCount,
				origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
			})
		);
	}, 250);
}

function celebrateSmall() {
	const count = 50,
		defaults = {
			origin: { y: 0.9, x: 0.4 }
		};

	function fire(particleRatio, opts) {
		confetti(
			Object.assign({}, defaults, opts, {
				particleCount: Math.floor(count * particleRatio)
			})
		);
	}

	fire(0.25, {
		spread: 26,
		startVelocity: 10
	});

	fire(0.2, {
		spread: 60,
		startVelocity: 35
	});

	fire(0.1, {
		spread: 120,
		startVelocity: 25
	});
}

function celebrateBig() {
	const count = 250,
		defaults = {
			origin: { y: 0.9, x: 0.6 }
		};

	function fire(particleRatio, opts) {
		confetti(
			Object.assign({}, defaults, opts, {
				particleCount: Math.floor(count * particleRatio)
			})
		);
	}

	fire(0.25, {
		spread: 26,
		startVelocity: 55
	});

	fire(0.2, {
		spread: 60
	});

	fire(0.35, {
		spread: 100,
		decay: 0.91,
		scalar: 0.8
	});

	fire(0.1, {
		spread: 120,
		startVelocity: 25,
		decay: 0.92,
		scalar: 1.2
	});

	fire(0.1, {
		spread: 120,
		startVelocity: 45
	});
}

function celebrateMedium() {
	const count = 150,
		defaults = {
			origin: { y: 0.9 }
		};

	function fire(particleRatio, opts) {
		confetti(
			Object.assign({}, defaults, opts, {
				particleCount: Math.floor(count * particleRatio)
			})
		);
	}

	fire(0.25, {
		spread: 26,
		startVelocity: 55
	});

	fire(0.2, {
		spread: 60
	});

	fire(0.35, {
		spread: 100,
		decay: 0.91,
		scalar: 0.8
	});

	fire(0.1, {
		spread: 120,
		startVelocity: 45
	});
}
