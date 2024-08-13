import { Connection, LAMPORTS_PER_SOL, PublicKey, StakeProgram, type GetProgramAccountsFilter } from "@solana/web3.js";
import type { ParsedStakeAccount, DAOWithTVL, Treasury, Token, DAO } from "./types";
import { getAllGovernances, getNativeTreasuryAddress, getRealms, TOKEN_PROGRAM_ID } from "@solana/spl-governance";
import { Effect, pipe } from "effect";
import BigNumber from "bignumber.js";
import { SOL_MINT_ADDRESS } from "./constants";
import jup from "./lib/jup_api";

function updateTVL(goveranceProgramIds: PublicKey[]): Effect.Effect<DAOWithTVL[][], never, never> {
	return Effect.forEach(
		goveranceProgramIds,
		(governanceProgramId) => {
			return pipe(
				updateTVLInGovernanceProgram(governanceProgramId),
				Effect.tap(daoWithTVLs => {
					for (const daoWithTVL of daoWithTVLs) {
						console.log(`DAO: ${daoWithTVL.name}, TVL: ${daoWithTVL.tvl}`);
					}
				}),
			);
		},
		{ concurrency: 1 }
	);
}

function updateTVLInGovernanceProgram(goveranceProgramId: PublicKey): Effect.Effect<DAOWithTVL[], never, never> {
	const connection = new Connection(Bun.env.RPC_URL);
	return pipe(
		Effect.promise(() => getRealms(connection, goveranceProgramId)),
		Effect.andThen(realmProgramAccounts => {
			return Effect.forEach(
				realmProgramAccounts,
				(realmProgramAccount) => {
					console.log(`working on realm.name: ${realmProgramAccount.account.name}`);
					return calculateTVLForRealm(
						connection,
						realmProgramAccount.pubkey,
						realmProgramAccount.account.name,
						goveranceProgramId
					);
				},
				{ concurrency: 2 }
			)
		}),
	);
}

function calculateTVLForRealm(
	connection: Connection,
	realmAddress: PublicKey,
	realmName: string,
	governanceProgramId: PublicKey,
): Effect.Effect<DAOWithTVL, never, never> {
	return Effect.gen(function*() {
		const governancePublicKeys = yield* fetchGovernancesInRealm(connection, realmAddress, governanceProgramId);
		const treasuries = yield* fetchTresuriesForDAO(connection, governancePublicKeys, governanceProgramId);
		const concatTokens = treasuries.reduce((accum, treasury) => accum.concat(treasury.relavantTokens), [] as Token[]);
		const mappedTokens = concatTokens.reduce((accum, token) => {
			const key = token.mint.toBase58();
			if (accum[key]) {
				accum[key].amount = accum[key].amount.plus(token.amount);
			} else {
				accum[key] = token;
			}
			return accum;
		}, {} as Record<string, Token>)

		const dao: DAO = {
			name: realmName,
			governanceProgramId,
			realmPubKey: realmAddress,
			lamports: treasuries.reduce((accum, treasury) => accum.plus(treasury.lamports), new BigNumber(0)),
			relavantTokens: Object.values(mappedTokens),
			updatedTimestamp: Date.now(),
		};

		return yield* calculateDAOValuesInUSDC(dao)
	});
}

function calculateDAOValuesInUSDC(dao: DAO): Effect.Effect<DAOWithTVL, never, never> {
	return Effect.gen(function*() {
		const mintAddresses = [
			new PublicKey(SOL_MINT_ADDRESS),
			...dao.relavantTokens.map(token => token.mint),
		];

		const prices = yield* Effect.promise(() => jup.priceApi(mintAddresses));

		const solInUSDC = dao.lamports
			.dividedBy(LAMPORTS_PER_SOL)
			.multipliedBy(prices.data[SOL_MINT_ADDRESS].price);

		const tokenInUSDC = dao.relavantTokens.reduce((accum, token) => {
			const tokenPrice = prices.data[token.mint.toBase58()]?.price ?? 0;
			return accum.plus(token.amount.dividedBy(10 ** token.decimals).multipliedBy(tokenPrice));
		}, new BigNumber(0));

		return {
			...dao,
			tvl: solInUSDC.plus(tokenInUSDC),
		} as DAOWithTVL;
	});
}

function fetchGovernancesInRealm(
	connection: Connection,
	realmAddress: PublicKey,
	governanceProgramId: PublicKey
): Effect.Effect<PublicKey[], never, never> {
	const governanceProgramAccounts = Effect.promise(
		() => getAllGovernances(
			connection,
			governanceProgramId,
			realmAddress
		)
	);

	return pipe(
		governanceProgramAccounts,
		Effect.map(governances => governances.map(gov => gov.pubkey)),
	);
}

function fetchTresuriesForDAO(
	connection: Connection,
	governancePublicKeys: PublicKey[],
	governanceProgramId: PublicKey
): Effect.Effect<Treasury[], never, never> {
	return Effect.forEach(
		governancePublicKeys,
		(govPubKey) => {
			return Effect.gen(function*() {
				// fetch sol lamports
				const solWalletPublicKey = yield* Effect.promise(() => getNativeTreasuryAddress(governanceProgramId, govPubKey))
				const [govLamports, treasuryLamports] = [
					yield* fetchSol(connection, govPubKey),
					yield* fetchSol(connection, solWalletPublicKey),
				];

				const solLamports = govLamports.plus(treasuryLamports);

				// fetch stake sol lamports
				const stakeSolLamports = yield* fetchStakeSol(connection, solWalletPublicKey);

				// calculate final lamports
				const finalLamports = solLamports.plus(stakeSolLamports);

				// fetch tokens
				const [govTokens, treasuryTokens] = [
					yield* fetchTokens(connection, govPubKey),
					yield* fetchTokens(connection, solWalletPublicKey),
				]

				const relavantTokens = govTokens.concat(treasuryTokens);

				return {
					treasuryPubKey: solWalletPublicKey,
					governancePubKey: govPubKey,
					governanceProgramId: governanceProgramId,
					lamports: finalLamports,
					relavantTokens: relavantTokens,
				} as Treasury;
			});
		},
		{ concurrency: 2 },
	);
}

function fetchSol(
	connection: Connection,
	owner: PublicKey
): Effect.Effect<BigNumber, never, never> {
	const solAccountInfo = (solWalletPublicKey: PublicKey) => Effect.promise(
		() => connection.getAccountInfo(solWalletPublicKey)
	);

	return pipe(
		Effect.succeed(owner),
		Effect.andThen(solWalletPublicKey => solAccountInfo(solWalletPublicKey)),
		Effect.map(solAccount => new BigNumber(solAccount?.lamports ?? 0)),
	);
}

function fetchStakeSol(
	connection: Connection,
	staker: PublicKey,
): Effect.Effect<BigNumber, never, never> {
	const META_AUTHORIZED_STAKER_OFFSET = 12;
	const filters: GetProgramAccountsFilter[] = [{
		memcmp: {
			offset: META_AUTHORIZED_STAKER_OFFSET,
			bytes: staker.toBase58(),
		}
	}];

	return pipe(
		Effect.promise<ParsedStakeAccount[]>(
			() => connection.getParsedProgramAccounts(StakeProgram.programId, { filters })
		),
		Effect.map(parsedStakeAccounts => {
			return parsedStakeAccounts.reduce((accum, stakeAccount) => {
				return accum.plus(stakeAccount.account.lamports)
			}, new BigNumber(0));
		}),
	)
}

function fetchTokens(
	connection: Connection,
	owner: PublicKey,
): Effect.Effect<Token[], never, never> {
	return pipe(
		Effect.promise(() =>
			connection.getParsedTokenAccountsByOwner(
				owner,
				{ programId: TOKEN_PROGRAM_ID }
			)
		),
		Effect.map(response => response.value),
		Effect.map(tokenAccounts => {
			return tokenAccounts.map(tokenAccount => {
				return {
					mint: new PublicKey(tokenAccount.account.data.parsed.info.mint),
					decimals: tokenAccount.account.data.parsed.info.tokenAmount.decimals as number,
					amount: new BigNumber(tokenAccount.account.data.parsed.info.tokenAmount.amount),
				} as Token;
			});
		}),
	);
}

export {
	updateTVL,
}
