import { Component, effect, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, bagCheckOutline, buildOutline, camera, cartOutline, checkmarkCircle, closeCircle, cubeOutline,
  imagesOutline, logOutOutline, phonePortraitOutline, removeCircleOutline, searchOutline, storefrontOutline, trashOutline,
  timeOutline, createOutline, calendarOutline } from 'ionicons/icons';
import { AuthService } from './core/auth.service';
import { NotificationService } from './core/notification.service';
import { SyncService } from './core/sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>`
})
export class AppComponent {
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);
  private sync = inject(SyncService); // se instancia al iniciar para reanudar pedidos pendientes

  constructor() {
    addIcons({ addCircleOutline, bagCheckOutline, buildOutline, camera, cartOutline, checkmarkCircle, closeCircle, cubeOutline,
      imagesOutline, logOutOutline, phonePortraitOutline, removeCircleOutline, searchOutline, storefrontOutline, trashOutline,
      timeOutline, createOutline, calendarOutline });
    effect(() => { if (this.auth.user()) this.notifications.start(); });
  }
}
