import { Hono } from "hono";
import { GOVERNANCE_PROGRAM_ID } from "./constants";
import { updateAllTVL } from "./tvl_calculator";

const app = new Hono();

app.get("/tvl", (context) => {
	return context.text("Hello Hono!");
});

// should change to post (will update when finishing)
// app.post("tvl", async (context) => {
app.get("/update-tvl", async (context) => {
	await updateAllTVL(GOVERNANCE_PROGRAM_ID);
	return context.text("TODO")
});

export default app;
