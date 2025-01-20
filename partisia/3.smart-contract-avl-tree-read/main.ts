import {PartisiaBlockchainService} from "@unleashed-business/ts-web3-commons/dist/pbc/pbc.service.js";
import {PBCChain} from "@unleashed-business/ts-web3-commons/dist/pbc/pbc.chains.js";
import {MasterChainMempoolAbi} from "@crypto-factor-labs/interchain-ts-abi";
import {U32TypeSpec, U64TypeSpec} from "@unleashed-business/ts-web3-commons/dist/pbc/spec/commons.tspec.js";

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
    const finalizeEpochForPBC = await partisiaConnection.call(
        /**
         * The first parameter here is an object defining the connection to the PBC RPC.
         * The PBCChain static class has predefined connection definition for testnet and mainnet, but these might as well be
         * defined with custom rpc url and other settings. For the example we are using PBC testnet.
         */
        PBCChain.TESTNET,
        /**
         * The second parameter is the ABI definition of the PBC smart contract as a constant containing the BASE64 encoded
         * abi content. This content is obtained during compilation of the smart contract or downloaded from the pbc explorer.
         * For this example we will use the Interchain testnet master mempool ABI from the public abi repository of CF Labs
         */
        MasterChainMempoolAbi,
        /**
         * The third parameter is a contract address of the target smart contract on the PBC chain used. For this example it is testnet
         * so we have to provide an address of the Interchain devnet master mempool. We will use one of the versions currently used on
         * testnet but that address might change with time while not changing the example.
         */
        "02f9a29f8ecef8c727cddcb48efc486ce507b62851",
        /**
         * The last argument is the async callback used to consume the smart contract state and avl trees. For this example
         * we will query the finalize mempool epoch avl tree and return the value for PBC based on chain id as the final result of tha call.
         */
        (state, trees, namedTypes) => {
            // We introduce the PBC chain id for testnet used by CFR infra = 18500
            const targetChain = 18500;
            /**
             * Here the trees variable is a "map" that contains "builders" for  avl-trees selected by the 5-th parameter of the call function
             * Wer can access a previously selected tree by the same number found in the state of PBC testnet explorer.
             * In our case the finalized epoch tree has a treeId of "2", so we use that for our builder.
             * To execute the builder we need to provide three parameters:
             * 1. A type for the tree key as a type spec, which are predefined in CFR and PBC libraries, used in tha Avl-tree. For this example we provude u32 type spec as the type
             * used in the tree is u32.
             * 2. A type for the tree value as a type spec, which are predefined in CFR and PBC libraries or comes from the named types map, used in tha Avl-tree.
             * For this example we provide u64 because the type for the value is u64.
             * 3. Boolean flag indicating if we provided a named type for the value spec of the map or a simple type.
             * For this example we provide false as the type is u64. For an example with named type values check out next example.
             * For the example contract that is: https://browser.testnet.partisiablockchain.com/contracts/026a2ed097009a83301d88eef1305b69c5cb89bdf2?tab=state
             * Once we call the builder we have an instance of the tree which we can query and deserialize.
             */
            const finalizeEpochTree= trees[2](U32TypeSpec, U64TypeSpec, false);
            /**
             * Here we query the tree through typescript filter method and we compare the key of the value to the expected key.
             * This is only good for small to medium trees (<1m items). For larger trees we can use the http client to deserialize specific keys.
             * The large tree example is out of the scope of this one.
             * Once we find out element by key we perform a pop() to get the value or undefined if not found.
             */
            const chainEpoch = finalizeEpochTree.filter(x => x.key.asNumber() === targetChain).pop();
            /**
             * Once we have the value fond by key as a deserializable object we know it is a u64 value which is considered
             * bignumber so we get it as a BN and turn it into hex for easier handling.
             */
            return chainEpoch.value.asBN().toString("hex");
        },
        // Here we provide a list of tree ids to be deserialized and available in our callback
        // We need the finalized epoch tree from our contract which has a treeId = 2
        [2]
    );

    console.log(`Current finalized mempool epoch for PBC: ${finalizeEpochForPBC}`);

})().then(() => console.log("Executed!"));
