import { IIIFDiscoveryService } from './iiifDiscovery';
import { CanvasProcessor } from './canvasProcessor';
import { ProgressTracker } from '../utils/progressTracker';
import { ErrorLogger } from '../utils/errorLogger';
import { Manifest } from '../types';

const BATCH_SIZE = 100;

export class ManifestProcessor {
  constructor(
    private iiifService: IIIFDiscoveryService,
    private canvasProcessor: CanvasProcessor,
    private progressTracker: ProgressTracker,
    private errorLogger: ErrorLogger
  ) {}

  async processManifests(): Promise<void> {
    try {
      const manifestUrls = await this.iiifService.getManifestUrls();
      const progress = await this.progressTracker.getProgress();

      // Only process the first manifest for testing
      const firstManifest = manifestUrls[0];
      if (!firstManifest) {
        throw new Error('No manifests found');
      }

      try {
        const manifest = await this.iiifService.fetchManifest(firstManifest);
        await this.processManifest(manifest);
        await this.progressTracker.updateLastProcessedManifest(firstManifest);
      } catch (error) {
        await this.errorLogger.logError({
          manifestId: firstManifest,
          canvasId: '',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to process manifests:', error);
      throw error;
    }
  }

  private async processManifest(manifest: Manifest): Promise<void> {
    const progress = await this.progressTracker.getProgress();
    const processedCanvasIds = new Set(progress.processedCanvases);
    
    // Filter out already processed canvases
    const remainingCanvases = manifest.items.filter(canvas => !processedCanvasIds.has(canvas.id));
    
    // Get the next batch of canvases to process
    const canvasesToProcess = remainingCanvases.slice(0, BATCH_SIZE);
    
    console.log(`Processing next ${canvasesToProcess.length} canvases out of ${remainingCanvases.length} remaining canvases`);
    console.log(`Total canvases in manifest: ${manifest.items.length}`);

    for (const canvas of canvasesToProcess) {
      await this.canvasProcessor.processCanvas(manifest.id, canvas);
    }

    // If we've processed all canvases, log completion
    if (remainingCanvases.length <= BATCH_SIZE) {
      console.log('All canvases in manifest have been processed');
    } else {
      const remaining = remainingCanvases.length - BATCH_SIZE;
      console.log(`${remaining} canvases remaining to be processed`);
    }
  }
}