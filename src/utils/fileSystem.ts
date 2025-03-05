import fs from 'fs-extra';
import path from 'path';
import { CanvasData, ErrorLog, Progress, EmptyModelLog } from '../types';

export class FileSystem {
  private readonly dataDir = 'data';
  private readonly projectsDir = path.join(this.dataDir, 'projects');
  private readonly errorLogPath = path.join(this.dataDir, 'error.log.json');
  private readonly emptyModelsLogPath = path.join(this.dataDir, 'empty-models.log.json');
  private readonly progressPath = path.join(this.dataDir, 'progress.json');

  constructor() {
    this.initializeDirectories();
  }

  private async initializeDirectories(): Promise<void> {
    await fs.ensureDir(this.dataDir);
    await fs.ensureDir(this.projectsDir);
  }

  async saveCanvasData(
    projectId: string | number,
    manifestId: string,
    canvasId: string,
    data: CanvasData
  ): Promise<void> {
    const projectDir = path.join(this.projectsDir, projectId.toString());
    const manifestDir = path.join(projectDir, manifestId);
    const filePath = path.join(manifestDir, `${canvasId}.json`);
    
    await fs.ensureDir(manifestDir);
    await fs.writeJson(filePath, data, { spaces: 2 });
  }

  async saveErrorLog(errors: ErrorLog[]): Promise<void> {
    await fs.writeJson(this.errorLogPath, errors, { spaces: 2 });
  }

  async loadErrorLog(): Promise<ErrorLog[]> {
    try {
      return await fs.readJson(this.errorLogPath);
    } catch {
      return [];
    }
  }

  async saveEmptyModelsLog(emptyModels: EmptyModelLog[]): Promise<void> {
    await fs.writeJson(this.emptyModelsLogPath, emptyModels, { spaces: 2 });
  }

  async loadEmptyModelsLog(): Promise<EmptyModelLog[]> {
    try {
      return await fs.readJson(this.emptyModelsLogPath);
    } catch {
      return [];
    }
  }

  async saveProgress(progress: Progress): Promise<void> {
    await fs.writeJson(this.progressPath, progress, { spaces: 2 });
  }

  async loadProgress(): Promise<Progress> {
    try {
      return await fs.readJson(this.progressPath);
    } catch {
      return {
        lastProcessedManifest: null,
        processedCanvases: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  // Helper method to migrate existing data to new structure
  async migrateExistingData(): Promise<void> {
    const oldCanvasDir = path.join(this.dataDir, 'canvases');
    
    if (await fs.pathExists(oldCanvasDir)) {
      const files = await fs.readdir(oldCanvasDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const oldPath = path.join(oldCanvasDir, file);
          const data = await fs.readJson(oldPath);
          
          // Extract manifest and canvas IDs from the data
          const { manifestId, canvasId } = this.extractIds(data.canvasId);
          
          // Save to new location using project ID 21
          await this.saveCanvasData(21, manifestId, canvasId, data);
          
          // Remove old file
          await fs.remove(oldPath);
        }
      }
      
      // Remove old directory if empty
      const remainingFiles = await fs.readdir(oldCanvasDir);
      if (remainingFiles.length === 0) {
        await fs.remove(oldCanvasDir);
      }
    }
  }

  private extractIds(url: string): { manifestId: string; canvasId: string } {
    const matches = url.match(/\/manifests\/(\d+)\/.*?\/([c]\d+)$/);
    
    if (!matches) {
      throw new Error(`Unable to extract IDs from URL: ${url}`);
    }

    return {
      manifestId: matches[1],
      canvasId: matches[2]
    };
  }
}