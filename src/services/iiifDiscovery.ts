import pLimit from 'p-limit';
import pRetry from 'p-retry';
import { IIIFOrderedCollection, IIIFOrderedCollectionPage, Manifest } from '../types';

const API_ENDPOINT = 'https://madoc.nlw.digtest.co.uk/s/tours-in-wales/madoc/api/activity/curated-project-manifests/stream/mini-illustrated-tours-in-wales/changes';
const RATE_LIMIT = 5; // Concurrent requests
const limit = pLimit(RATE_LIMIT);

export class IIIFDiscoveryService {
  private async fetchWithRetry(url: string): Promise<Response> {
    return pRetry(
      async () => {
        try {
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Fetch failed with status ${response.status}:`, errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }

          return response;
        } catch (error) {
          console.error('Fetch error:', error);
          throw error;
        }
      },
      {
        retries: 3,
        onFailedAttempt: (error) => {
          console.log(`Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
          console.log('Error details:', error);
        }
      }
    );
  }

  private async fetchCollectionPage(url: string): Promise<IIIFOrderedCollectionPage> {
    try {
      console.log('Fetching collection page:', url);
      const response = await this.fetchWithRetry(url);
      const data = await response.json() as IIIFOrderedCollectionPage;

      if (!data.orderedItems || !Array.isArray(data.orderedItems)) {
        throw new Error('Invalid page structure: missing or invalid orderedItems');
      }

      return data;
    } catch (error) {
      console.error('Error fetching collection page:', error);
      throw error;
    }
  }

  async getManifestUrls(): Promise<string[]> {
    try {
      console.log('Fetching collection from endpoint:', API_ENDPOINT);

      // Fetch the initial collection
      const response = await this.fetchWithRetry(API_ENDPOINT);
      const collection = await response.json() as IIIFOrderedCollection;

      if (!collection.first?.id) {
        throw new Error('Invalid collection: missing first page URL');
      }

      console.log('Collection metadata:', {
        totalItems: collection.totalItems,
        totalPages: collection.totalPages,
        firstPage: collection.first.id
      });

      const manifestUrls: string[] = [];
      let currentPageUrl = collection.first.id;

      // Fetch pages until we don't have a next page
      while (currentPageUrl) {
        const page = await this.fetchCollectionPage(currentPageUrl);
        
        // Extract manifest URLs from the current page
        const pageUrls = page.orderedItems
          .filter(item => item.type === 'Update')
          .map(item => item.object.id);

        manifestUrls.push(...pageUrls);
        console.log(`Found ${pageUrls.length} manifests on current page`);

        // Move to next page if available
        currentPageUrl = page.next?.id || '';
      }

      console.log(`Total manifests found: ${manifestUrls.length}`);
      return manifestUrls;

    } catch (error) {
      console.error('Error in getManifestUrls:', error);
      throw error;
    }
  }

  async fetchManifest(url: string): Promise<Manifest> {
    return limit(async () => {
      try {
        const response = await this.fetchWithRetry(url);
        return response.json() as Promise<Manifest>;
      } catch (error) {
        console.error(`Error fetching manifest from ${url}:`, error);
        throw error;
      }
    });
  }
}