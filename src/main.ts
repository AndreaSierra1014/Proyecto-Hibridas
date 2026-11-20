import { bootstrapApplication } from '@angular/platform-browser';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Habilita la cámara en el navegador (ionic serve) para las pruebas.
defineCustomElements(window);

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
