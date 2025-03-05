import { Progress } from '../types';
import { FileSystem } from './fileSystem';

export class ProgressTracker {
  constructor(private fileSystem: FileSystem) {}

  async getProgress(): Promise<Progress> {
    return this.fileSystem.loadProgress();
  }

  async updateLastProcessedManifest(manifestId: string): Promise<void> {
    const progress = await this.getProgress();
    progress.lastProcessedManifest = manifestId;
    progress.timestamp = new Date().toISOString();
    await this.fileSystem.saveProgress(progress);
  }

  async addProcessedCanvas(canvasId: string): Promise<void> {
    const progress = await this.getProgress();
    if (!progress.processedCanvases.includes(canvasId)) {
      progress.processedCanvases.push(canvasId);
      progress.timestamp = new Date().toISOString();
      await this.fileSystem.saveProgress(progress);
    }
  }
}