type GovernanceProgramId = string;

async function calculateTresuryValue(governanceProgramId: GovernanceProgramId) {
	console.log(governanceProgramId);
}

async function updateAllTVL(governanceProgramIds: GovernanceProgramId[]) {
	return Promise.all(
		governanceProgramIds.map(calculateTresuryValue)
	);
}

export type {
	GovernanceProgramId,
};

export {
	calculateTresuryValue,
	updateAllTVL,
};
