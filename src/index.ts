import { IIIFDiscoveryService } from './services/iiifDiscovery';
import { ManifestProcessor } from './services/manifestProcessor';
import { CanvasProcessor } from './services/canvasProcessor';
import { FileSystem } from './utils/fileSystem';
import { ErrorLogger } from './utils/errorLogger';
import { EmptyModelLogger } from './utils/emptyModelLogger';
import { ProgressTracker } from './utils/progressTracker';

async function main() {
  try {
    const fileSystem = new FileSystem();
    const errorLogger = new ErrorLogger(fileSystem);
    const emptyModelLogger = new EmptyModelLogger(fileSystem);
    const progressTracker = new ProgressTracker(fileSystem);
    const iiifService = new IIIFDiscoveryService();
    
    // Migrate existing data to new structure
    console.log('Migrating existing data to new project-based structure...');
    await fileSystem.migrateExistingData();
    
    const canvasProcessor = new CanvasProcessor(
      fileSystem,
      errorLogger,
      emptyModelLogger,
      progressTracker,
      YOUR_PROJECT_ID // Replace with your project ID (e.g., 21)
    );
    
    const manifestProcessor = new ManifestProcessor(
      iiifService,
      canvasProcessor,
      progressTracker,
      errorLogger
    );

    console.log('Starting IIIF data extraction (test mode - first 20 canvases only)...');
    await manifestProcessor.processManifests();
    console.log('Test extraction completed successfully!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();