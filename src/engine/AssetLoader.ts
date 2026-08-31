import assetManifest from './assetManifest.json';
import { TextureAtlas } from './TextureAtlas';

export interface ManifestData {
  maps: Record<string, { spritesheets: string[]; terrain: string }>;
  urls: Record<string, string>;
}

export class AssetLoader {
  private static instance: AssetLoader | null = null;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  private constructor() {}

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  /**
   * Preloads assets for a specific map, providing fine-grained progress updates.
   * Dispatches updates from 0% to 100% smoothly.
   */
  public async preloadMapAssets(
    mapId: string,
    onProgress: (percent: number, statusText: string) => void
  ): Promise<void> {
    const manifest = assetManifest as ManifestData;
    const mapConfig = manifest.maps[mapId] || { spritesheets: ['luci', 'darky', 'explorer'], terrain: 'generic' };
    const spritesheetsToLoad = mapConfig.spritesheets;

    const totalSteps = spritesheetsToLoad.length + 4; // Images + Atlas + Geometry + Texture Pre-heat + Done
    let completedSteps = 0;

    const updateProgress = (completed: number, status: string) => {
      const percentage = Math.floor((completed / totalSteps) * 100);
      onProgress(Math.min(100, Math.max(0, percentage)), status);
    };

    // Phase 1: Downloading Spritesheets
    updateProgress(0, 'Iniciando conexión con el reino...');

    const loadPromises = spritesheetsToLoad.map(async (key) => {
      const url = manifest.urls[key];
      if (!url) return;

      if (this.imageCache.has(url)) {
        completedSteps++;
        updateProgress(completedSteps, `Recuperando spritesheet: ${key}...`);
        return;
      }

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => {
          this.imageCache.set(url, img);
          completedSteps++;
          updateProgress(completedSteps, `Descargado spritesheet: ${key}...`);
          resolve();
        };
        img.onerror = () => {
          console.warn(`AssetLoader failed to load: ${key} from ${url}`);
          completedSteps++;
          updateProgress(completedSteps, `Error cargando: ${key}, continuando...`);
          resolve();
        };
      });
    });

    await Promise.all(loadPromises);

    // Phase 1.5: Loading Texture Atlas
    updateProgress(completedSteps, 'Recuperando el Atlas de Texturas Sagrado...');
    try {
      await TextureAtlas.getInstance().load();
      completedSteps++;
      updateProgress(completedSteps, 'Atlas cargado correctamente.');
    } catch (e) {
      console.warn('Error loading TextureAtlas:', e);
      completedSteps++;
      updateProgress(completedSteps, 'Error en el Atlas, usando materiales base...');
    }

    // Phase 2: Building Map Geometry & Collision Grid (Simulated high-perf steps for smooth updates)
    completedSteps++;
    updateProgress(completedSteps, 'Compilando matrices de colisión...');
    await new Promise((r) => setTimeout(r, 120));

    // Phase 3: Pre-heating texture canvas & setting filtering limits
    completedSteps++;
    updateProgress(completedSteps, 'Alineando filtros de píxeles (Nearest)...');
    await new Promise((r) => setTimeout(r, 100));

    // Phase 4: Finalizing rendering pipelines
    completedSteps++;
    updateProgress(completedSteps, 'Invocando ciclo de renderizado 3D...');
    await new Promise((r) => setTimeout(r, 80));
  }

  /**
   * Returns a preloaded image directly from the cache.
   */
  public getImage(url: string): HTMLImageElement | null {
    const cached = this.imageCache.get(url);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      return cached;
    }
    return null;
  }

  /**
   * Direct cache injection to keep the 3D renderer in sync.
   */
  public getCacheMap(): Map<string, HTMLImageElement> {
    return this.imageCache;
  }
}
