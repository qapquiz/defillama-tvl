import { Hono } from "hono";
import { GOVERNANCE_PROGRAM_ID, TVL_FILE_NAME } from "./constants";
import { Effect } from "effect";
import { updateTVL } from "./tvl_calculator";
import { PublicKey } from "@solana/web3.js";
import type { DAOWithTVL, TVLFile } from "./types";

const app = new Hono();

app.get("/tvl", async (context) => {
	const path = `./${TVL_FILE_NAME}`;
	const file = Bun.file(path);

	try {
		const tvlJson: TVLFile = await file.json();
		const thirtyDaysInSeconds = 60 * 60 * 24 * 30; // second * minute * hours_in_day * days_in_month
		const isDataAlreadyExceedThirtyDays = (tvlJson.updatedTimestamp + thirtyDaysInSeconds) < Date.now();

		return isDataAlreadyExceedThirtyDays ?
			context.json({
				"warning": "This data has already exceed 30 days. Please call API /tvl with POST method.",
				...tvlJson,
			}) :
			context.json(tvlJson);
	} catch (e) {
		return context.text("We do not have tvl data yet. Please call API /tvl with POST method to update the TVL.")
	}
});

app.post("/tvl", async (context) => {
	const governanceProgramId = GOVERNANCE_PROGRAM_ID.map(programId => new PublicKey(programId));
	const daoWithTVLs: DAOWithTVL[][] = await Effect.runPromise(updateTVL([governanceProgramId[1]]));
	const daoWithTVLsFlatten = daoWithTVLs.flat();
	const tvlFileContent: TVLFile = {
		updatedTimestamp: Date.now(),
		tvls: daoWithTVLsFlatten,
	}

	await Bun.write(`./${TVL_FILE_NAME}`, JSON.stringify(tvlFileContent, null, 2));
	return context.text("Update TVL completed.")
});

export default app;
