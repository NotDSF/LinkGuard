let randomNumber = (max) => Math.floor(Math.random() * max + 1);
let Depth = 0;

function Recursion(Settings) {
	if (Settings.recursion > Depth) {
		Depth++;
		return true;
	}

	return randomNumber(2) > 1;
}

async function AMG(int, Settings, Recursive) {
	if (!Recursive && Depth > 0) {
		Depth = 0;
	}

	return new Promise(async (resolve) => {
		let [Enum, New, rightHand] = [randomNumber(2), int, randomNumber(99999)];

		switch (Enum) {
			case 1: { // Addition 
				resolve(`(${New+rightHand}-${rightHand})`);
			}
			case 2: { // Subtraction
				resolve(`(${New-rightHand}+${rightHand})`);
			}
		}
	});
}

module.exports = AMG;