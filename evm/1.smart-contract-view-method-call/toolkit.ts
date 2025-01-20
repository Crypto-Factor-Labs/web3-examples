import {
    ContractToolkitService, NotificationService,
    ReadOnlyWeb3ConnectionService,
    TransactionRunningHelperService
} from "@unleashed-business/ts-web3-commons";

export function buildContractToolkit(): ContractToolkitService {
    return  new ContractToolkitService(
        new ReadOnlyWeb3ConnectionService(),
        new TransactionRunningHelperService(
            new NotificationService()
        ),
        {
            blockMintingTolerance: 5,
            blockMintingToleranceIntervalMilliseconds: 1000,
            estimateGasMultiplier: 1.25,
            executionConfirmation: 10,
            executionReceiptTimeout: 300
        }
    );
}