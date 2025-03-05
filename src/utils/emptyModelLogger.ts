import { EmptyModelLog } from '../types';
import { FileSystem } from './fileSystem';

export class EmptyModelLogger {
  constructor(private fileSystem: FileSystem) {}

  async logEmptyModel(log: EmptyModelLog): Promise<void> {
    const logs = await this.fileSystem.loadEmptyModelsLog();
    logs.push(log);
    await this.fileSystem.saveEmptyModelsLog(logs);
  }
}