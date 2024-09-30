import { ApiPromise, WsProvider } from '@polkadot/api';

import { formatValue } from './util';

const uris: { [key: number]: string } = {
	46: 'wss://rpc.darwinia.network',
	44: 'wss://crab-rpc.darwinia.network',
	701: 'wss://koi-rpc.darwinia.network',
};
const apiCache: { [chainId: number]: ApiPromise } = {};

export interface Deposit {
	id: number,
	value: string
	startTime: string,
	expiredTime: string,
	inUse: boolean,
}

export async function apiPromise(chainId: number): Promise<ApiPromise> {
	let api = apiCache[chainId];

	if (!api) {
		api = await ApiPromise.create({ provider: new WsProvider(uris[chainId], 3_000) });
		apiCache[chainId] = api;
	}

	return api;
}

export async function getDeposits(api: ApiPromise, chainId: number, who: string): Promise<Deposit[]> {
	try {
		const deposits = (await api.query.deposit.deposits(who)).toJSON();

		if (Array.isArray(deposits)) {
			const formattedDeposits: Deposit[] = deposits.map((d: any) => {
				return {
					id: Number(d.id),
					value: formatValue(BigInt(d.value)),
					startTime: new Date(Number(d.startTime)).toLocaleString(),
					expiredTime: new Date(Number(d.expiredTime)).toLocaleString(),
					inUse: Boolean(d.inUse),
				};
			});

			return formattedDeposits;
		} else if (deposits === null) {
			return [];
		}
		else {
			throw new Error('unexpected deposits format');
		}
	} catch (e) {
		console.error(e);

		throw new Error('failed to fetch deposits');
	}
}

export function disconnectAllApis() {
	Object.values(apiCache).forEach(api => api.disconnect());
}
