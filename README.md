## Darwinia Migration Helper

This tool assists users in unstaking their RINGs and deposits and migrate their deposits pallet data to deposits contract data.

### Run

#### Frontend

The frontend for users to interact with the tool.

```sh
cd packages/web
yarn install
yarn start
```

#### Backend

The backend facilitates interaction between the frontend and PolkadotJS, as the migration process can only be initiated through PolkadotJS, which is not user-friendly for EVM (Metamask) users. The delegator will call the migrate function for the user account.

```sh
cd packages/delegator
export SEED=<PRE_FUNDED_SEED>
yarn install
yarn start
```
