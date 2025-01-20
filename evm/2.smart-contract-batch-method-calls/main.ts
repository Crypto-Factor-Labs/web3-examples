import {
    PartialChainRegistryAbi,
    PartialChainRegistryAbiFunctional
} from "@crypto-factor-labs/interchain-ts-abi";
import {
    blockchainIndex, bn_wrap, NumericResult,
    Web3Contract
} from "@unleashed-business/ts-web3-commons";
import {buildContractToolkit} from "./toolkit.js";
import {BatchRequest} from "@unleashed-business/ts-web3-commons/dist/contract/utils/batch-request.js";

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
     * To create a batch we first create a web3 connection to the target blockchain using the toolkit web3connection.
     */
    const connection = contractToolkit.web3Connection.getWeb3ReadOnly(blockchainDefinition);
    /**
     * With the created connection we create a batch request for all of our parallel requests.
     */
    const batch = new BatchRequest(connection);
    const results: any = {};

    /**
     * The promise we create here will not wait for the execution of the calls because they are added to the batch and
     * will only be executed when the batch is executed later. The promise here is to build the requests in parallel - a microoptimization.
     * When we want to add a call to a batch, we provide the batch as a second argument and because the call than becomes async we
     * need to provide a callback as a third argument to process the response. In our example we will add two calls to the batch - one
     * for the height of the chain and one for the chain id. We will add the results of both to a temporary object to transport.
     */
    await Promise.all([
        registryContractReadonly.tipHeight<NumericResult>({}, batch, x => results.height = bn_wrap(x as NumericResult)),
        registryContractReadonly.chainId<NumericResult>({}, batch, x => results.chainId = bn_wrap(x as NumericResult).toNumber()),
    ]);

    /**
     * When we add all of our calls to the batch we can execute the batch to actually send the queued calls to the rpc.
     * We can console.log the results object before the batch to confirm that it is empty but after the await for the batch
     * all callback would have been executed and the results object would be full.
     */
    await batch.execute({timeout: 20_000});

    console.log(`Block height ${results.height.toFixed()} for chain ${results.chainId}`);

})().then(() => console.log("Executed!"));
