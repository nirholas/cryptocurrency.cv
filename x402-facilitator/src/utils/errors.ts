export class FacilitatorError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = 'FacilitatorError';
    this.code = code;
    this.status = status;
  }
}

export class ValidationError extends FacilitatorError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class UnsupportedChainError extends FacilitatorError {
  constructor(chainId: number) {
    super(`Unsupported chain: ${chainId}`, 'UNSUPPORTED_CHAIN', 400);
    this.name = 'UnsupportedChainError';
  }
}

export class SettlementError extends FacilitatorError {
  constructor(message: string) {
    super(message, 'SETTLEMENT_FAILED', 502);
    this.name = 'SettlementError';
  }
}
