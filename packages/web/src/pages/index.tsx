import { useEffect, useState } from 'react';

import type { NextPage } from 'next';
import Head from 'next/head';

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import styles from '../styles/Home.module.css';
import { apiPromise, getDeposits, Deposit, disconnectAllApis } from '../polkadot';
import { abi } from '../abi';
import { formatValue } from '../util';

const Home: NextPage = () => {
	const { address, chain, isConnected } = useAccount();
	const [ring, setRing] = useState<bigint>(0n);
	const [deposits, setDeposits] = useState<Deposit[]>([]);
	const [fetching, setFetching] = useState<boolean>(false);
	const [fetchErr, setFetchErr] = useState<string | null>(null);
	const [currPage, setCurrPage] = useState<number>(1);
	const {
		data: unstakeHash,
		error: unstakeErr,
		isPending: isUnstakePending,
		writeContract: writeUnstakeContract
	} = useWriteContract();
	const { isLoading: confirming, isSuccess: confirmed } =
		useWaitForTransactionReceipt({ hash: unstakeHash });
	const [migrating, setMigrating] = useState<boolean>(false);
	const [migrationMsg, setMigrationMsg] = useState<string>('');
	const [migrationErr, setMigrationErr] = useState<string | null>(null);
	const token: { [key: number]: string } = {
		46: 'RING',
		44: 'CRAB',
		701: 'KRING',
	};

	useEffect(() => {
		const fetch = async () => {
			if (!address) {
				return;
			}

			setFetching(true);
			setFetchErr(null);

			try {
				if (chain?.id) {
					const api = await apiPromise(chain.id);
					const ledger = (await api.query.darwiniaStaking.ledgers(address)).toJSON();
					const ring = ledger && typeof ledger === 'object' && 'ring' in ledger ? BigInt((ledger as any).ring) : 0n;
					const deposits = await getDeposits(api, chain.id, address);

					setRing(ring);
					setDeposits(deposits);
				} else {
					setFetchErr('chain id is undefined');
				}
			} catch (e) {
				console.error(e);

				setFetchErr('failed to fetch data from chain');
			} finally {
				setFetching(false);
			}
		};

		if (isConnected && address) {
			fetch();
		}
	}, [isConnected, address, chain, confirmed]);

	useEffect(() => {
		setMigrating(false);
		setMigrationMsg('');
		setMigrationErr(null);
	}, [address, chain]);

	useEffect(() => {
		return () => {
			disconnectAllApis();
		};
	}, []);

	const depositsPerPage = 10;
	const indexOfLastDeposit = currPage * depositsPerPage;
	const indexOfFirstDeposit = indexOfLastDeposit - depositsPerPage;
	const currentDeposits = deposits.slice(indexOfFirstDeposit, indexOfLastDeposit);
	const totalPages = Math.ceil(deposits.length / depositsPerPage);

	const handleNextPage = () => {
		if (currPage < totalPages) {
			setCurrPage(prev => prev + 1);
		}
	};
	const handlePrevPage = () => {
		if (currPage > 1) {
			setCurrPage(prev => prev - 1);
		}
	};

	const handleUnstake = () => {
		const inUseIds = deposits.filter(deposit => deposit.inUse).map(deposit => deposit.id);

		writeUnstakeContract({
			abi,
			address: '0x0000000000000000000000000000000000000601',
			functionName: 'unstake',
			args: [ring, inUseIds],
		});
	};

	const handleMigration = async () => {
		setMigrating(true);
		setMigrationErr(null);
		setMigrationMsg(`Migration in progress; this may take between 6 to 300 seconds. Please check back later.`);

		try {
			const response = await fetch('https://migration-helper.darwinia.network/api/migrate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-DMH': 'DMH'
				},
				body: JSON.stringify({ chainId: chain?.id, who: address }),
			});

			if (!response.ok) {
				throw new Error(`migration failed with status ${response.status}`);
			}
		} catch (e: any) {
			console.error(e);

			setMigrating(false);
			setMigrationErr(e.message.toLowerCase() || 'migration failed');
		}
	};

	return (
		<div className={styles.container}>
			<Head>
				<title>Darwinia Migration Helper</title>
				<meta
					content="Darwinia Migration Helper"
					name="Darwinia Migration Helper"
				/>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
			</Head>

			<main className={styles.main}>
				<div className={styles.connectButtonWrapper}>
					<ConnectButton />
				</div>

				<h1 className={styles.title}>
					Darwinia Migration Helper
				</h1>

				<div className={styles.tip}>
					<code className={styles.code}>
						{fetching && !fetchErr && 'Fetching data from chain...'}
						{fetchErr && `error: ${fetchErr}`}
						{!fetching && !fetchErr && isConnected &&
							<>
								{ring !== 0n || deposits.some(deposit => deposit.inUse) ? (
									<>
										There are "{formatValue(ring)}" {chain?.id ? token[chain.id] : 'token'}(s) and "{deposits.filter(deposit => deposit.inUse).length}" deposit(s) in staking; you need to unstake them first.

										<button
											className={styles.actButton}
											onClick={handleUnstake}
											disabled={isUnstakePending || confirming}
										>
											{isUnstakePending ? 'Unstaking...' : 'Unstake All'}
										</button>
										{unstakeHash && (
											<div className={styles.result}>
												Transaction Hash: <a className={styles.link} href={`${chain?.blockExplorers?.default?.url}/tx/${unstakeHash}`} target="_blank" rel="noopener noreferrer">{unstakeHash}</a> ({isUnstakePending ? 'Pending' : confirming ? 'Confirming' : 'Unknown'})
											</div>
										)}
										{unstakeErr && (
											console.error(unstakeErr),
											<div className={styles.error}>error: {(unstakeErr as any).shortMessage?.toLowerCase().replace(/\.$/, '')}</div>
										)}
									</>
								) : (
									<>
										There are "{deposits.length}" deposit(s) waiting for you to migrate.

										{deposits.length > 0 &&
											<>
												<button
													className={styles.actButton}
													onClick={handleMigration}
													disabled={migrating}
												>
													{migrating ? 'Migrating...' : 'Migrate All'}
												</button>
												{migrating &&
													<div className={styles.result}>
														{migrationMsg}
													</div>
												}
												{migrationErr &&
													<div className={styles.error}>
														error: {migrationErr}
													</div>
												}
											</>
										}
									</>
								)}
								{deposits.length > 0 &&
									<div className={styles.depositList}>
										<table className={styles.table}>
											<thead>
												<tr>
													<th>ID</th>
													<th>Value</th>
													<th>Start Time</th>
													<th>Expired Time</th>
													<th>In Use</th>
												</tr>
											</thead>
											<tbody>
												{currentDeposits.map(deposit => (
													<tr key={deposit.id}>
														<td>{deposit.id}</td>
														<td>{deposit.value}</td>
														<td>{deposit.startTime}</td>
														<td>{deposit.expiredTime}</td>
														<td>{deposit.inUse ? 'Yes' : 'No'}</td>
													</tr>
												))}
											</tbody>
										</table>

										<div className={styles.pagination}>
											<button
												onClick={handlePrevPage}
												disabled={currPage === 1}
											>
												◀
											</button>
											<span>{currPage} / {totalPages}</span>
											<button
												onClick={handleNextPage}
												disabled={currPage === totalPages}
											>
												▶
											</button>
										</div>
									</div>
								}
							</>
						}
					</code>
				</div>
			</main>

			<footer className={styles.footer}>
				Made with ❤️ by <a href="https://github.com/AurevoirXavier">@AurevoirXavier</a> at <a href="https://github.com/ringecosystem">RingDAO</a>
			</footer>
		</div>
	);
};

export default Home;
