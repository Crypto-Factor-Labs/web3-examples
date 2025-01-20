import {
    PartialChainRegistryAbi,
    PartialChainRegistryAbiFunctional
} from "@crypto-factor-labs/interchain-ts-abi";
import {
    blockchainIndex, bn_wrap, NumericResult,
    Web3Contract
} from "@unleashed-business/ts-web3-commons";
import {buildContractToolkit} from "./toolkit.js";

(async function (): Promise<void> {
    /**
     * First we need to create an instance the evm contract toolkit. This is special object containing
     * EMV chain connection information and utilities. Usually this is created with dependency injection and
     * because of that here we use a function to mimic that.
     */
    const contractToolkit = buildContractToolkit();
    /**
     * With the smart contract toolkit we are ready to create our smart contract access class which is "Web3Contract".
     * For that we need to provide the ABI definition of the smart contract. For this example we are accessing
     * the Interchain devnet partial chain registry, and we are using the ABI definition from the ts-abi package of
     * interchain libraries to get PartialChainRegistryAbiFunctional and PartialChainRegistryAbi.
     * There two ABI definition might seem the same but are different. The "functional" abi is a type definition used
     * to provide typescript with auto-complete for view and methods of the smart contract, while the "normal abi"
     * is provided as an argument to the constructor and is used to parse the actual function parameters for serialization.
     */
    const smartContract = new Web3Contract<PartialChainRegistryAbiFunctional>(contractToolkit, PartialChainRegistryAbi);

    /**
     * We need to select a blockchain for our connection and for this example we are using the instance of Interchain
     * on DMC testnet and because of this
     */
    const blockchainDefinition = blockchainIndex.DMC_TESTCHAIN;
    /**
     * We also need the address of the contract we are going to make queries to. In this example we are accessing the
     * Interchian partialchain registry on DMC Testnet which has the following address.
     */
    const registryContractAddress = "0x2d8606ccCD62dbF8B70AafE1BE21d4881b536Ea0";

    /**
     * Once we have the required configuration parameters and connection arguments we can create the so called "read-only" instance.
     * This is an object which has the contract address and connection set which makes following calls much smaller and lightweight.
     */
    const registryContractReadonly = smartContract.readOnlyInstance(blockchainDefinition, registryContractAddress);

    /**
     * Our first call to the smart contract here will be for the tip height of the partial chain which is just the block number of the tip.
     * We are using the auto-complete here from the functional abi to select the method and to provide the arguments.
     * The tip height view does not require arguments so we provide an empty object.
     * Because the method returns a number it is required to do some post-processing because that number can be anything
     * from a string, bigint, number, etc. To get all of those to a single and understandable type we mark them as NumericResult
     * and usd bn_wrap to wrap the value to BigNumber which we can use later.
     */
    const height = await registryContractReadonly.tipHeight<NumericResult>({})
        .then(x => bn_wrap(x as NumericResult));

    /**
     * Once we have the block height number we can do a second query to fetch the block behind that height.
     * For that we can again use the auto-complete from the functional abi to pick the "getBlochByNumber"
     * method. This time we have arguments for that call, which is the number for the block.
     * We can provide the number we fetched from previous call after conversion to string with the help of "toFixed()"
     * Here for the return type we provide an inline object with expected field for the blockHash, because the smart contract
     * return a struct with this field and some additional ones.
     */
    const block = await registryContractReadonly.getBlochByNumber<{blockHash: string}>({
        number: height.toFixed()
    }) as {blockHash: string};

    console.log(`Block height ${height} with tip hash ${block.blockHash}`);

})().then(() => console.log("Executed!"));
