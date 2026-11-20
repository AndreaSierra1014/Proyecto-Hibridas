import { Injectable, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

export interface UserPhoto { filepath: string; webviewPath?: string; }

/** Servicio de fotos de la galería (actividad Ionic): cámara, Filesystem y Preferences. */
@Injectable({ providedIn: 'root' })
export class PhotoService {
  readonly photos = signal<UserPhoto[]>([]);
  private readonly KEY = 'photos';

  async addNewToGallery() {
    const captured = await Camera.getPhoto({ resultType: CameraResultType.Uri, source: CameraSource.Camera, quality: 90 });
    const saved = await this.savePicture(captured);
    this.photos.update((p) => [saved, ...p]);
    await Preferences.set({ key: this.KEY, value: JSON.stringify(this.photos().map((p) => ({ filepath: p.filepath }))) });
  }

  async loadSaved() {
    const { value } = await Preferences.get({ key: this.KEY });
    const list: UserPhoto[] = value ? JSON.parse(value) : [];
    if (!Capacitor.isNativePlatform()) {
      for (const p of list) {
        const file = await Filesystem.readFile({ path: p.filepath, directory: Directory.Data });
        p.webviewPath = `data:image/jpeg;base64,${await this.asBase64(file.data)}`;
      }
    } else {
      for (const p of list) {
        const { uri } = await Filesystem.getUri({ path: p.filepath, directory: Directory.Data });
        p.webviewPath = Capacitor.convertFileSrc(uri);
      }
    }
    this.photos.set(list);
  }

  async deletePicture(photo: UserPhoto) {
    await Filesystem.deleteFile({ path: photo.filepath, directory: Directory.Data }).catch(() => undefined);
    this.photos.update((p) => p.filter((x) => x.filepath !== photo.filepath));
    await Preferences.set({ key: this.KEY, value: JSON.stringify(this.photos().map((p) => ({ filepath: p.filepath }))) });
  }

  /** Foto reducida para asignar a un producto del inventario (RF-09). */
  async takeProductPhoto(): Promise<string | undefined> {
    const p = await Camera.getPhoto({ resultType: CameraResultType.DataUrl, source: CameraSource.Prompt, quality: 50, width: 600 });
    return p.dataUrl;
  }

  private async savePicture(photo: Photo): Promise<UserPhoto> {
    const base64 = await this.readAsBase64(photo);
    const fileName = `${Date.now()}.jpeg`;
    await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Data });
    if (Capacitor.isNativePlatform()) {
      const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Data });
      return { filepath: fileName, webviewPath: Capacitor.convertFileSrc(uri) };
    }
    return { filepath: fileName, webviewPath: photo.webPath };
  }

  private async readAsBase64(photo: Photo): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      const file = await Filesystem.readFile({ path: photo.path! });
      return this.asBase64(file.data);
    }
    const blob = await (await fetch(photo.webPath!)).blob();
    return this.asBase64(blob);
  }

  private asBase64(data: string | Blob): Promise<string> {
    if (typeof data === 'string') return Promise.resolve(data);
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = reject;
      r.onload = () => resolve((r.result as string).split(',')[1]);
      r.readAsDataURL(data);
    });
  }
}
