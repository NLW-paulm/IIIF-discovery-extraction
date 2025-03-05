import { Model, ProcessedModels } from '../types';

export class ModelProcessor {
  constructor(private targetProjectId?: number) {}

  processModels(models: Model[]): ProcessedModels {
    const filteredModels = this.targetProjectId 
      ? models.filter(model => model.projectId === this.targetProjectId)
      : models;

    return filteredModels.reduce<ProcessedModels>(
      (acc, model) => {
        if (this.isEmptyModel(model)) {
          acc.emptyModels.push(model);
        } else {
          acc.validModels.push(model);
        }
        return acc;
      },
      { validModels: [], emptyModels: [] }
    );
  }

  private isEmptyModel(model: Model): boolean {
    // Exclude standard fields from emptiness check
    const { id, projectId, derivedFrom, ...fields } = model;

    // Special handling for boolean fields
    const booleanFields = Object.entries(fields)
      .filter(([_, value]) => typeof value === 'boolean');
    
    // If there are boolean fields with actual values, model is not empty
    if (booleanFields.length > 0) {
      return false;
    }

    // Check remaining fields for emptiness
    return Object.entries(fields).every(([_, value]) => this.isEmptyValue(value));
  }

  private isEmptyValue(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return true;
    }

    if (Array.isArray(value)) {
      return value.length === 0 || value.every(item => this.isEmptyValue(item));
    }

    if (typeof value === 'object') {
      return Object.keys(value).length === 0 || Object.values(value).every(v => this.isEmptyValue(v));
    }

    return false;
  }
}