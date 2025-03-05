export interface IIIFOrderedCollection {
  type: string;
  totalItems: number;
  first: {
    id: string;
    type: string;
  };
  totalPages?: number;
}

export interface IIIFOrderedCollectionPage {
  type: string;
  orderedItems: Array<{
    type: string;
    object: {
      id: string;
    };
  }>;
  next?: {
    id: string;
    type: string;
  };
}

export interface ManifestCanvas {
  id: string;
  type: string;
  items: Array<{
    id: string;
    type: string;
    items: Array<{
      id: string;
      type: string;
      motivation: string;
      target: string;
      body: {
        id: string;
        type: string;
      };
    }>;
  }>;
  seeAlso?: Array<{
    id: string;
    type: string;
  }>;
}

export interface Manifest {
  id: string;
  items: ManifestCanvas[];
}

export interface Canvas extends ManifestCanvas {}

export interface CanvasData {
  canvasId: string;
  manifestId: string;
  originalCanvasId: string;
  originalManifestId: string;
  dataset: unknown;
}

export interface ErrorLog {
  manifestId: string;
  canvasId: string;
  error: string;
  timestamp: string;
}

export interface EmptyModelLog {
  manifestId: string;
  canvasId: string;
  modelId: string;
  projectId: number;
  reason: string;
  timestamp: string;
}

export interface Progress {
  lastProcessedManifest: string | null;
  processedCanvases: string[];
  timestamp: string;
}

export interface Model {
  id: string;
  projectId: number;
  derivedFrom: string;
  [key: string]: any;
}

export interface ProcessedModels {
  validModels: Model[];
  emptyModels: Model[];
}