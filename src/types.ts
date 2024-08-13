import type { PublicKey } from "@solana/web3.js"
import type BigNumber from "bignumber.js";

type Token = {
	mint: PublicKey;
	decimals: number;
	amount: BigNumber;
}

type DAO = {
	name: string;
	governanceProgramId: PublicKey;
	realmPubKey: PublicKey;
	lamports: BigNumber;
	relavantTokens: Token[];
	updatedTimestamp: number;
}

type DAOWithTVL = DAO & { tvl: BigNumber }

type TVLFile = {
	updatedTimestamp: number;
	tvls: DAOWithTVL[];
}

type Treasury = {
	treasuryPubKey: PublicKey;
	governancePubKey: PublicKey;
	governanceProgramId: PublicKey;
	lamports: BigNumber;
	relavantTokens: Token[];
}

type ParsedStakeAccount = {
	pubkey: PublicKey;
	account: {
		lamports: number;
	};
}

export type {
	DAO,
	DAOWithTVL,
	TVLFile,
	Treasury,
	Token,
	ParsedStakeAccount,
}
