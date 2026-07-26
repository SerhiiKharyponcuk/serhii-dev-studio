export interface PaymentProvider {
  readonly method: string;
  readonly supportsWebhooks: boolean;
}

export const manualBankTransferProvider: PaymentProvider = {
  method: "MANUAL_BANK_TRANSFER",
  supportsWebhooks: false
};
