import {PartisiaBlockchainService} from "@unleashed-business/ts-web3-commons/dist/pbc/pbc.service.js";
import {PBCChain} from "@unleashed-business/ts-web3-commons/dist/pbc/pbc.chains.js";
import {ForkRegistryAbi, MasterChainAbi, MasterChainMempoolAbi} from "@crypto-factor-labs/interchain-ts-abi";
import {
    HashTypeSpec,
    U32TypeSpec,
    U64TypeSpec
} from "@unleashed-business/ts-web3-commons/dist/pbc/spec/commons.tspec.js";

(async function (): Promise<void> {
    /**
     * First we need to create an instance of the partisia blockchain service.
     * Because we are only using it as a readonly instance to access state from the blockchain we are not required to provide
     * a wallet/private key connection.
     */
    const partisiaConnection = new PartisiaBlockchainService(undefined);

    // We introduce the block hash of devnet height 183: 039f56e19e67aad21b9c0d2b8b2edc03b55c8d9c556d308ffeaaeaf4188d2a01
    const targetBlockHash = "039f56e19e67aad21b9c0d2b8b2edc03b55c8d9c556d308ffeaaeaf4188d2a01";

    /**
     * To execute a state read from a smart contract on Partisia we use the .call() method of the
     * created service. We will have to register a callback that receives the state, and we can then query for
     * parameters from it.
     */
    const blockHeight = await partisiaConnection.call(
        /**
         * The first parameter here is an object defining the connection to the PBC RPC.
         * The PBCChain static class has predefined connection definition for testnet and mainnet, but these might as well be
         * defined with custom rpc url and other settings. For the example we are using PBC testnet.
         */
        PBCChain.TESTNET,
        /**
         * The second parameter is the ABI definition of the PBC smart contract as a constant containing the BASE64 encoded
         * abi content. This content is obtained during compilation of the smart contract or downloaded from the pbc explorer.
         * For this example we will use the Interchain testnet partisia fork master chain ABI from the public abi repository of CF Labs
         */
        MasterChainAbi,
        /**
         * The third parameter is a contract address of the target smart contract on the PBC chain used. For this example it is testnet
         * so we have to provide an address of the Interchain testnet partisia fork master chain. We will use one of the versions currently used on
         * testnet but that address might change with time while not changing the example.
         */
        "026a2ed097009a83301d88eef1305b69c5cb89bdf2",
        /**
         * The last argument is the async callback used to consume the smart contract state and avl trees. For this example
         * we will query a block by its hash from the avl tree and return the value of the height from the block struct.
         */
        (state, trees, namedTypes) => {
            /**
             * Here the trees variable is a "map" that contains "builders" for  avl-trees selected by the 5-th parameter of the call function
             * We can access a previously selected tree by the same number found in the state of PBC testnet explorer.
             * In our case the block tree has a treeId of "0", so we use that for our builder.
             * To execute the builder we need to provide three parameters:
             * 1. A type for the tree key as a type spec, which are predefined in CFR and PBC libraries, used in tha Avl-tree. For this example we provide hash type spec as the type
             * used in the tree is hash.
             * 2. A type for the tree value as a type spec, which are predefined in CFR and PBC libraries or comes from the named types map, used in tha Avl-tree.
             * For this example we are using a custom struct for which we have to access namedTypesParam.
             * Our struct is called "PbcMasterBlock" and we can access the type spec from namedTypes using this name as key.
             * 3. Boolean flag indicating if we provided a named type for the value spec of the map or a simple type.
             * For this example we provide true as we are using namedType.
             * For the example contract that is: https://browser.testnet.partisiablockchain.com/contracts/026a2ed097009a83301d88eef1305b69c5cb89bdf2?tab=state
             * Once we call the builder we have an instance of the tree which we can query and deserialize.
             */
            const blockTree= trees[0](HashTypeSpec, namedTypes["PbcMasterChainBlock"], true);
            /**
             * Here we query the tree through typescript filter method and we compare the key of the value to the expected key.
             * This is only good for small to medium trees (<1m items). For larger trees we can use the http client to deserialize specific keys.
             * The large tree example is out of the scope of this one.
             * Once we find out element by key we perform a pop() to get the value or undefined if not found.
             */
            const targetBlock = blockTree.filter(x => x.key.hashValue().value.toString("hex") === targetBlockHash).pop();
            /**
             * Once we have the value fond by key we can deserialize it as a struct and get the target fiels as any other struct
             * deserialization as a deserializable object we know it is a u64 value which is considered
             * bignumber so we get it as a BN and turn it into hex for easier handling.
             */
            return targetBlock.value.structValue().getFieldValue("height")!.asBN().toString("hex");
        },
        // Here we provide a list of tree ids to be deserialized and available in our callback
        // We need the finalized epoch tree from our contract which has a treeId = 2
        [0]
    );

    console.log(`Block height for ${targetBlockHash}: ${blockHeight}`);

})().then(() => console.log("Executed!"));
