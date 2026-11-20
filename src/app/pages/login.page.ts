import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonSegment, IonSegmentButton, IonLabel, IonText, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IonButton, IonContent, IonIcon, IonInput, IonItem, IonSegment, IonSegmentButton, IonLabel, IonText, IonSpinner],
  template: `
  <ion-content class="ion-padding">
    <div class="wrap">
      <ion-icon name="phone-portrait-outline" class="logo"></ion-icon>
      <h1>Magic Cell</h1>
      <p class="sub">Celulares, accesorios y componentes</p>

      <ion-segment [value]="mode()" (ionChange)="mode.set($any($event.detail.value)); error.set('')">
        <ion-segment-button value="login"><ion-label>Ingresar</ion-label></ion-segment-button>
        <ion-segment-button value="register"><ion-label>Crear cuenta</ion-label></ion-segment-button>
      </ion-segment>

      @if (mode() === 'register') {
        <ion-item><ion-input label="Nombre" labelPlacement="floating" [(ngModel)]="name" autocomplete="name"></ion-input></ion-item>
      }
      <ion-item><ion-input label="Correo electrónico" labelPlacement="floating" type="email" [(ngModel)]="email" autocomplete="email"></ion-input></ion-item>
      <ion-item><ion-input label="Contraseña" labelPlacement="floating" type="password" [(ngModel)]="password" (keyup.enter)="submit()"></ion-input></ion-item>

      @if (error()) { <ion-text color="danger"><p class="err">{{ error() }}</p></ion-text> }

      <ion-button expand="block" (click)="submit()" [disabled]="busy()">
        @if (busy()) { <ion-spinner name="dots"></ion-spinner> } @else { {{ mode() === 'login' ? 'Ingresar' : 'Crear cuenta' }} }
      </ion-button>
      <p class="hint">Administrador de prueba: admin&#64;magiccell.com / Admin123</p>
    </div>
  </ion-content>`,
  styles: [`
    .wrap { max-width: 420px; margin: 0 auto; padding-top: 8vh; }
    .logo { font-size: 56px; color: var(--ion-color-primary); }
    h1 { margin: 4px 0 0; font-size: 28px; }
    .sub { color: var(--ion-color-medium); margin: 0 0 20px; }
    ion-segment { margin-bottom: 12px; }
    ion-button { margin-top: 16px; }
    .err { margin: 12px 0 0; font-size: 14px; }
    .hint { color: var(--ion-color-medium); font-size: 12px; text-align: center; margin-top: 24px; }
  `]
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  mode = signal<'login' | 'register'>('login');
  busy = signal(false);
  error = signal('');
  name = ''; email = ''; password = '';

  async submit() {
    this.error.set('');
    if (!this.email || !this.password || (this.mode() === 'register' && !this.name)) {
      this.error.set('Completa todos los campos.'); return;
    }
    this.busy.set(true);
    try {
      if (this.mode() === 'login') await this.auth.login(this.email.trim(), this.password);
      else await this.auth.register(this.name.trim(), this.email.trim(), this.password);
      await this.router.navigateByUrl(this.auth.isAdmin() ? '/admin' : '/catalog', { replaceUrl: true });
    } catch (e: any) {
      this.error.set(e.status === 0 ? 'No hay conexión con el servidor.' : e.error?.message ?? 'No se pudo iniciar sesión.');
    } finally { this.busy.set(false); }
  }
}
