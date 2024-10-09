import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { Chain } from 'wagmi/chains';

const darwinia: Chain = {
	name: 'Darwinia',
	id: 46,
	testnet: false,
	nativeCurrency: {
		name: 'Darwinia Network Native Token',
		symbol: 'RING',
		decimals: 18,
	},
	rpcUrls: {
		default: { http: ['https://rpc.darwinia.network'] }
	},
	blockExplorers: {
		default: {
			name: 'Darwinia Explorer',
			url: 'https://explorer.darwinia.network'
		}
	},
}

const crab: Chain = {
	name: 'Crab',
	id: 44,
	testnet: false,
	nativeCurrency: {
		name: 'Crab Network Native Token',
		symbol: 'CRAB',
		decimals: 18,
	},
	rpcUrls: {
		default: { http: ['https://crab-rpc.darwinia.network'] }
	},
	blockExplorers: {
		default: {
			name: 'Crab Explorer',
			url: 'https://crab-scan.darwinia.network'
		}
	},
}

const koi: Chain = {
	name: 'Koi',
	id: 701,
	testnet: true,
	nativeCurrency: {
		name: 'Koi Network Native Token',
		symbol: 'KRING',
		decimals: 18,
	},
	rpcUrls: {
		default: { http: ['https://koi-rpc.darwinia.network'] }
	},
	blockExplorers: {
		default: {
			name: 'Koi Explorer',
			url: 'https://koi-scan.darwinia.network'
		}
	},
}

export const config = getDefaultConfig({
	appName: 'Darwinia Migration Helper',
	projectId: '2f094d8039dafb4f3fd537931f739604',
	chains: [crab, koi],
	// chains: [darwinia, crab, koi],
	ssr: true,
});
