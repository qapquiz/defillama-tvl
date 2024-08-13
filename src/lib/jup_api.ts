import type { PublicKey } from "@solana/web3.js";
import { batch } from "./batch";

type JupPriceApiResponse = {
	[name: string]: {
		id: string;
		mintSymbol: string;
		vsToken: string;
		vsTokenSymbol: string;
		price: number;
	};
};

const JUP_PRICE_API_URL = new URL(Bun.env.JUP_PRICE_API_URL);

async function priceApi(mintAddresses: PublicKey[]): Promise<{ "data": JupPriceApiResponse }> {
	let prices = { data: {} };
	const batches = batch(mintAddresses, 100);
	for (const batch of batches) {
		const searchParams = new URLSearchParams();
		const mintAddresses = batch.map(tokenPublicKey => tokenPublicKey.toBase58()).join(",");
		searchParams.append("ids", mintAddresses);

		const apiURL = JUP_PRICE_API_URL;
		apiURL.search = searchParams.toString();

		const response = await fetch(apiURL);
		const priceBatch = (await response.json()).data;

		prices = {
			data: { ...prices.data, ...priceBatch },
		}
	}

	return prices;
}

const jup = {
	priceApi,
}

export default jup;

