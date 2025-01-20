import {PartisiaBlockchainService} from "@unleashed-business/ts-web3-commons/dist/pbc/pbc.service.js";
import {PBCChain} from "@unleashed-business/ts-web3-commons/dist/pbc/pbc.chains.js";
import {MasterChainAbi} from "@crypto-factor-labs/interchain-ts-abi";
import {StructTypeSpec} from "@partisiablockchain/abi-client/target/main/types/StructTypeSpec.js";

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
     * To execute a large avl tree read from a smart contract on Partisia we use the .fetchAVLTreeValueByKey() method of the
     * created service. We will have to register a callback that receives the state value reader, and we can then query for
     * parameters from it.
     */
    const blockHeight = await partisiaConnection.fetchAVLTreeValueByKey<string>(
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
         * The forth parameter is the tree of the target avl tree and here we are providing 0 - the tree id of the blocks
         * map from the Interchain testnet partisia fork master chain.
         */
        0,
        /**
         * The fifth parameter is the key for the value we are interested from the target avl tree and here we are providing
         * the hash of a block from the Interchain testnet partisia fork master chain.
         */
        Buffer.from(targetBlockHash, "hex"),
        /**
         * The last argument is the async callback used to consume the avl tree value from a reader. For this example
         * we made a query for block by its hash from the avl tree and we will return the value of the height from the block struct.
         */
        (value, namedTypes) => {
            /**
             * For this example we are using a custom struct for which we have to access namedTypesParam.
             * Our struct is called "PbcMasterBlock" and we can access the type spec from namedTypes using this name as key.
             */
            const targetBlock = value.readStruct(namedTypes["PbcMasterChainBlock"] as StructTypeSpec);
            /**
             * Once we have the value fond by key we can deserialize it as a struct and get the target fiels as any other struct
             * deserialization as a deserializable object we know it is a u64 value which is considered
             * bignumber so we get it as a BN and turn it into hex for easier handling.
             */
            return targetBlock.getFieldValue("height")!.asBN().toString("hex");
        }
    );

    console.log(`Block height from AVL Tree for ${targetBlockHash}: ${blockHeight}`);

})().then(() => console.log("Executed!"));
