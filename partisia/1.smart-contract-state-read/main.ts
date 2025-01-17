import {PartisiaBlockchainService} from "@unleashed-business/ts-web3-commons/dist/pbc/pbc.service.js";
import {PBCChain} from "@unleashed-business/ts-web3-commons/dist/pbc/pbc.chains.js";
import {ForkRegistryAbi} from "@crypto-factor-labs/interchain-ts-abi";

(async function (): Promise<void> {
    /**
     * First we need to create an instance of the partisia blockchain service.
     * Because we are only using it as a readonly instance to access state from the blockchain we are not required to provide
     * a wallet/private key connection.
     */
    const partisiaConnection = new PartisiaBlockchainService(undefined);

    /**
     * To execute a state read from a smart contract on Partisia we use the .call() method of the
     * created service. We will have to register a callback that receives the state, and we can then query for
     * parameters from it.
     */
    const [activeMempoolAddress, activeForkIndex] = await partisiaConnection.call(
        /**
         * The first parameter here is an object defining the connection to the PBC RPC.
         * The PBCChain static class has predefined connection definition for testnet and mainnet, but these might as well be
         * defined with custom rpc url and other settings. For the example we are using PBC testnet.
         */
        PBCChain.TESTNET,
        /**
         * The second parameter is the ABI definition of the PBC smart contract as a constant containing the BASE64 encoded
         * abi content. This content is obtained during compilation of the smart contract or downloaded from the pbc explorer.
         * For this example we will use the Interchain testnet fork registry ABI from the public abi repository of CF Labs
         */
        ForkRegistryAbi,
        /**
         * The third parameter is a contract address of the target smart contract on the PBC chain used. For this example it is testnet
         * so we have to provide an address of the Interchain devnet fork registry. We will use one of the versions currently used on
         * testnet but that address might change with time while not changing the example.
         */
        "021948b37c0c7942106aac95c0129c059f44016cb3",
        /**
         * The last argument is the async callback used to consume the smart contract state and avl trees. For this example
         * we will take the state and deserialize the active fork index from the state of the registry, as well as the active
         * mempool address and return it as the final result of tha call.
         */
        state => {
            /**
             * Here the state variable is a "map" that contains the non-avl-tree members of the contract state.
             * And the keys of the map are the names of the state members which can be found in the PBC explorer.
             * For the example contract that is: https://browser.testnet.partisiablockchain.com/contracts/021948b37c0c7942106aac95c0129c059f44016cb3?tab=state
             * We can see the parameter active_fork holding a number so we can use the "asNumber" method to deserialize the value
             * as a number.
             */
            const activeForkIndex = state["active_fork"].asNumber();
            /**
             * Here we deserialize a more complex type which is a PBC address. When we deal with struct types we
             * have a list of predefined ones used by PBC, and we can deserialize them to Buffers and encode them to hex
             * if needed similar to the address below.
             */
            const activeMempool = state["mempool_address"].addressValue().value.toString("hex")

            /**
             * The return of this callback is the return of the whole call.
             */
            return [activeMempool, activeForkIndex];
        }
    );

    console.log(`Current active call index from registry: ${activeForkIndex}, Mempool address: ${activeMempoolAddress}`);

})().then(() => console.log("Executed!"));
