import { Component, inject } from '@angular/core';
import { ActionSheetController, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { PhotoService, UserPhoto } from '../core/photo.service';

@Component({
  selector: 'app-photos',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon],
  template: `
  <ion-header><ion-toolbar><ion-title>Galería de fotos</ion-title></ion-toolbar></ion-header>
  <ion-content>
    @if (photos.photos().length === 0) { <div class="empty">Toca el botón de la cámara para tomar tu primera foto.</div> }
    <div class="grid">
      @for (p of photos.photos(); track p.filepath) {
        <img [src]="p.webviewPath" alt="Foto de la galería" (click)="options(p)" />
      }
    </div>
    <ion-fab vertical="bottom" horizontal="center" slot="fixed">
      <ion-fab-button (click)="add()" aria-label="Tomar foto"><ion-icon name="camera"></ion-icon></ion-fab-button>
    </ion-fab>
  </ion-content>`,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; padding: 6px 6px 96px; }
    img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; }
  `]
})
export class PhotosPage {
  photos = inject(PhotoService);
  private sheet = inject(ActionSheetController);
  constructor() { this.photos.loadSaved().catch(() => undefined); }
  async add() { try { await this.photos.addNewToGallery(); } catch { /* cámara cancelada */ } }
  async options(p: UserPhoto) {
    (await this.sheet.create({ header: 'Foto', buttons: [
      { text: 'Eliminar', role: 'destructive', icon: 'trash-outline', handler: () => this.photos.deletePicture(p) },
      { text: 'Cancelar', role: 'cancel' }] })).present();
  }
}
