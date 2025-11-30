import { ProviderType, ProviderConfig } from '../types/index.js';
import { RapidAPIClient } from './RapidAPIClient.js';
import { TwitterAPIClient } from './TwitterAPIClient.js';
import { config } from '../config/environment.js';

/**
 * Factory para crear instancias de clientes de scraping según el proveedor
 */
export class ProviderFactory {
  /**
   * Crea un cliente de scraping según el tipo de proveedor
   */
  static createClient(provider: ProviderType): RapidAPIClient | TwitterAPIClient {
    switch (provider) {
      case 'rapidapi':
        return new RapidAPIClient();
      case 'twitterapi':
        return new TwitterAPIClient();
      default:
        throw new Error(`Provider desconocido: ${provider}`);
    }
  }

  /**
   * Obtiene la lista de proveedores disponibles (con API key configurada)
   * TwitterAPI.io es el predeterminado y único visible en UI
   */
  static getAvailableProviders(): ProviderConfig[] {
    const providers: ProviderConfig[] = [];

    // TwitterAPI.io como prioridad (predeterminado)
    if (config.twitterApi.key && config.twitterApi.key.length > 0) {
      providers.push({
        type: 'twitterapi',
        name: 'TwitterAPI.io',
        active: true,
      });
    }

    // RapidAPI disponible pero oculto de UI (mantener para compatibilidad backend)
    // Solo se puede usar vía API directa especificando provider: 'rapidapi'
    // if (config.rapidApi.key && config.rapidApi.key.length > 0) {
    //   providers.push({
    //     type: 'rapidapi',
    //     name: 'RapidAPI (easy-x-com)',
    //     active: false, // Oculto de UI
    //   });
    // }

    return providers;
  }

  /**
   * Verifica si un proveedor específico está disponible
   */
  static isProviderAvailable(provider: ProviderType): boolean {
    const available = this.getAvailableProviders();
    return available.some(p => p.type === provider);
  }

  /**
   * Obtiene el proveedor por defecto (el primero disponible)
   */
  static getDefaultProvider(): ProviderType | null {
    const available = this.getAvailableProviders();
    return available.length > 0 ? available[0].type : null;
  }
}
