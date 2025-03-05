import { ErrorLog } from '../types';
import { FileSystem } from './fileSystem';

export class ErrorLogger {
  constructor(private fileSystem: FileSystem) {}

  async logError(error: ErrorLog): Promise<void> {
    const errors = await this.fileSystem.loadErrorLog();
    errors.push(error);
    await this.fileSystem.saveErrorLog(errors);
  }
}