/**
 * Message protocol for communication between Vault UI and the generator worker.
 * Defines all message types and payloads for worker-based NFT generation.
 * Supports animated GIF output when traits contain GIF files.
 */

export interface LayerData {
  id: string;
  name: string;
  traits: TraitData[];
  opacity: number;
  blendMode: string;
}

export interface TraitData {
  id: string;
  name: string;
  weight: number;
  imageData: string;
}

export interface RuleData {
  type: 'exclude' | 'force';
  primaryTrait: {
    layerId: string;
    traitId: string;
  };
  incompatibleTraits: Array<{
    layerId: string;
    traitId: string;
  }>;
}

export interface ForgedTokenData {
  id: string;
  imageData: string;
}

// UI -> Worker messages
export interface StartGenerationMessage {
  type: 'start';
  payload: {
    layers: LayerData[];
    rules: RuleData[];
    forgedTokens: ForgedTokenData[];
    collectionSize: number;
    projectName: string;
    blockchain: string;
    symbol: string;
    pixelArtMode: boolean;
    batchSize: number;
    outputFormat?: string; // 'png' | 'gif' | 'same-as-assets'
  };
}

export interface CancelGenerationMessage {
  type: 'cancel';
}

export type WorkerInputMessage = StartGenerationMessage | CancelGenerationMessage;

// Worker -> UI messages
export interface ProgressMessage {
  type: 'progress';
  payload: {
    generatedCount: number;
    totalCount: number;
    percentage: number;
  };
}

export interface GeneratedNFTData {
  id: number;
  dna: string;
  imageData?: string; // Optional - may be missing if worker can't composite images
  metadata: any;
  isForged: boolean;
  forgedTokenId?: string;
  selectedTraits?: Record<string, string>; // For fallback compositing
  outputFormat?: string; // 'png' | 'gif'
}

export interface BatchResultMessage {
  type: 'batch';
  payload: {
    nfts: GeneratedNFTData[];
    supportsImageCompositing: boolean;
  };
}

export interface CompleteMessage {
  type: 'complete';
  payload: {
    totalGenerated: number;
  };
}

export interface CancelAckMessage {
  type: 'cancelAck';
}

export interface ErrorMessage {
  type: 'error';
  payload: {
    message: string;
    details?: string;
  };
}

export interface CapabilityMessage {
  type: 'capability';
  payload: {
    supportsImageCompositing: boolean;
  };
}

export type WorkerOutputMessage =
  | ProgressMessage
  | BatchResultMessage
  | CompleteMessage
  | CancelAckMessage
  | ErrorMessage
  | CapabilityMessage;

// Type guards
export function isProgressMessage(msg: WorkerOutputMessage): msg is ProgressMessage {
  return msg.type === 'progress';
}

export function isBatchResultMessage(msg: WorkerOutputMessage): msg is BatchResultMessage {
  return msg.type === 'batch';
}

export function isCompleteMessage(msg: WorkerOutputMessage): msg is CompleteMessage {
  return msg.type === 'complete';
}

export function isCancelAckMessage(msg: WorkerOutputMessage): msg is CancelAckMessage {
  return msg.type === 'cancelAck';
}

export function isErrorMessage(msg: WorkerOutputMessage): msg is ErrorMessage {
  return msg.type === 'error';
}

export function isCapabilityMessage(msg: WorkerOutputMessage): msg is CapabilityMessage {
  return msg.type === 'capability';
}
