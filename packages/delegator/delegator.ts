import express from 'express';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { hexToU8a } from "@polkadot/util";

const port = 3001;
const app = express();
const uris: { [key: number]: string } = {
	46: 'wss://rpc.darwinia.network',
	44: 'wss://crab-rpc.darwinia.network',
	701: 'wss://koi-rpc.darwinia.network',
};
const apiCache: { [chainId: number]: ApiPromise } = {};
const signer = new Keyring({ type: "ethereum" }).addFromSeed(hexToU8a(process.env.SEED));

var cors = require('cors');

async function apiPromise(chainId: number): Promise<ApiPromise> {
	let api = apiCache[chainId];

	if (!api) {
		api = await ApiPromise.create({ provider: new WsProvider(uris[chainId], 3_000) });
		apiCache[chainId] = api;
	}

	return api;
}

async function migrate(chainId: number, who: string) {
	const api = await apiPromise(chainId);
	const deposits = (await api.query.deposit.deposits(who)).toJSON();

	if (Array.isArray(deposits)) {
		if (deposits.length) {
			for (let i = 0; i < Math.ceil(deposits.length / 10); i++) {
				await new Promise(async (resolve, reject) => {
					const unsub = await api.tx.deposit.migrate(who).signAndSend(signer, (result) => {
						if (result.status.isInBlock) {
							console.log(`in block ${result.status.asInBlock}`);
						} else if (result.status.isFinalized) {
							console.log(`finalized ${result.status.asFinalized}`);

							if (typeof unsub === 'function') {
								unsub();
							}

							resolve(undefined);
						}
					}).catch(reject);
				});
			}
		} else {
			console.log('no deposits');
		}
	}
}

app.use(express.json());
app.use(cors());
app.post('/api/migrate', async (req, res) => {
	const x = req.headers['x-dmh'];

	if (x && x.includes('DMH')) {
		const payload = req.body;
		const { chainId, who } = payload;

		console.log(`received payload ${chainId} ${who}`);

		if (typeof chainId === 'number' && typeof who === 'string') {
			await migrate(chainId, who);
		} else {
			res.status(400).send('invalid payload');

			return;
		}

		res.status(200).send('ok');
	} else {
		res.status(400).send('err');
	}
});
app.listen(port, () => {
	console.log(`server is listening on port ${port}`);
});
