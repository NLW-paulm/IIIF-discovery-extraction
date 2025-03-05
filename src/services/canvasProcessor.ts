import pLimit from 'p-limit';
import { Canvas, CanvasData, Model } from '../types';
import { FileSystem } from '../utils/fileSystem';
import { ErrorLogger } from '../utils/errorLogger';
import { EmptyModelLogger } from '../utils/emptyModelLogger';
import { ProgressTracker } from '../utils/progressTracker';
import { ModelProcessor } from '../utils/modelProcessor';
import { extractOriginalIds } from '../utils/urlUtils';

const CONCURRENT_LIMIT = 3;
const limit = pLimit(CONCURRENT_LIMIT);

export class CanvasProcessor {
  private modelProcessor: ModelProcessor;

  constructor(
    private fileSystem: FileSystem,
    private errorLogger: ErrorLogger,
    private emptyModelLogger: EmptyModelLogger,
    private progressTracker: ProgressTracker,
    private targetProjectId?: number
  ) {
    this.modelProcessor = new ModelProcessor(targetProjectId);
  }

  async processCanvas(manifestId: string, canvas: Canvas): Promise<void> {
    const progress = await this.progressTracker.getProgress();
    
    if (progress.processedCanvases.includes(canvas.id)) {
      return;
    }

    try {
      // Extract original IDs
      const { originalCanvasId, originalManifestId } = extractOriginalIds(canvas);

      if (!canvas.seeAlso?.length) {
        throw new Error('No seeAlso dataset link found');
      }

      const datasetUrl = this.constructDatasetUrl(canvas.seeAlso[0].id);
      const dataset = await this.fetchDataset(datasetUrl);

      // Process models
      const { models } = dataset as { models: Model[] };
      const { validModels, emptyModels } = this.modelProcessor.processModels(models);

      // Log empty models
      for (const model of emptyModels) {
        await this.emptyModelLogger.logEmptyModel({
          manifestId,
          canvasId: canvas.id,
          modelId: model.id,
          projectId: model.projectId,
          reason: this.determineEmptyReason(model),
          timestamp: new Date().toISOString()
        });
      }

      // Only create canvas file if there are valid models
      if (validModels.length > 0) {
        const { manifestId: extractedManifestId, canvasId } = this.extractIds(canvas.id);

        const canvasData: CanvasData = {
          canvasId: canvas.id,
          manifestId,
          originalCanvasId,
          originalManifestId,
          dataset: {
            ...dataset,
            models: validModels
          }
        };

        // Use the target project ID instead of extracting from URL
        await this.fileSystem.saveCanvasData(
          this.targetProjectId || 21, // Default to 21 if not specified
          extractedManifestId,
          canvasId,
          canvasData
        );
      }

      await this.progressTracker.addProcessedCanvas(canvas.id);
    } catch (error) {
      await this.errorLogger.logError({
        manifestId,
        canvasId: canvas.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  private determineEmptyReason(model: Model): string {
    const { id, projectId, derivedFrom, ...fields } = model;
    
    // Check for boolean fields
    const booleanFields = Object.entries(fields)
      .filter(([_, value]) => typeof value === 'boolean');
    
    if (booleanFields.length > 0) {
      return 'Contains only boolean fields';
    }

    // Check for empty arrays or objects
    const hasEmptyArrays = Object.values(fields).some(value => 
      Array.isArray(value) && value.length === 0
    );
    
    if (hasEmptyArrays) {
      return 'Contains empty arrays';
    }

    return 'All fields empty or contain no substantive content';
  }

  private extractIds(url: string): { manifestId: string; canvasId: string } {
    // Example URL: https://madoc.nlw.digtest.co.uk/s/tours-in-wales/madoc/api/manifests/14263/export/3.0/c14289
    const matches = url.match(/\/manifests\/(\d+)\/.*?\/([c]\d+)$/);
    
    if (!matches) {
      throw new Error(`Unable to extract IDs from URL: ${url}`);
    }

    return {
      manifestId: matches[1],
      canvasId: matches[2]
    };
  }

  private constructDatasetUrl(baseUrl: string): string {
    const url = new URL(baseUrl);
    url.searchParams.set('format', 'json');
    url.searchParams.set('version', '3.0');
    return url.toString();
  }

  private async fetchDataset(url: string): Promise<unknown> {
    return limit(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Dataset fetch failed for ${url}:`, {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`Failed to fetch dataset: ${response.status}`);
      }
      return response.json();
    });
  }
}