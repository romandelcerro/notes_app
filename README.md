# Notes App

Aplicación web personal de notas construida con **Angular 21**, **Angular Material**, **Firebase Auth** e **IndexedDB** (Dexie.js). Todo el contenido de las notas se cifra en el navegador usando AES-GCM antes de guardarse localmente.

## Características

- Login con Google (Firebase Auth)
- Notas con texto, enlaces y archivos adjuntos
- Arrastrar y soltar archivos, pegar imágenes desde el portapapeles
- Cifrado AES-GCM local (clave derivada con PBKDF2 desde tu UID)
- Almacenamiento 100% local en IndexedDB (no sale de tu dispositivo)
- Busca, fija y colorea notas
- Perfil de usuario editable

## Configuración inicial (obligatoria)

### 1. Crear proyecto Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Crea un nuevo proyecto
3. En **Authentication → Sign-in method**, habilita **Google**
4. En **Project settings → General**, copia la configuración de tu app web

### 2. Configurar las credenciales

Edita `src/environments/environment.ts` y `src/environments/environment.prod.ts`:

```ts
export const environment = {
  production: false,
  firebase: {
    apiKey: 'TU_API_KEY',
    authDomain: 'TU_PROJECT_ID.firebaseapp.com',
    projectId: 'TU_PROJECT_ID',
    storageBucket: 'TU_PROJECT_ID.appspot.com',
    messagingSenderId: 'TU_SENDER_ID',
    appId: 'TU_APP_ID',
  },
};
```

### 3. Añadir dominio autorizado en Firebase

En **Authentication → Settings → Authorized domains**, añade `localhost` y el dominio de producción.

## Desarrollo

```bash
pnpm install
pnpm start
```

Abre http://localhost:4200

## Build producción

```bash
pnpm run build
```

## Estructura del proyecto

```
src/app/
  core/
    guards/      # authGuard
    models/      # Note, AppUser
    services/    # AuthService, CryptoService, DatabaseService, NotesService, FilesService
  features/
    auth/        # LoginComponent
    home/        # HomeComponent
    notes/
      note-card/    # NoteCardComponent
      note-editor/  # NoteEditorComponent (dialog)
  shared/
    toolbar/        # ToolbarComponent
    user-menu/      # UserMenuComponent (dialog)
```

## Seguridad

- Las notas se cifran con **AES-GCM 256-bit** antes de escribirse en IndexedDB
- La clave se deriva de tu UID usando **PBKDF2** con 310 000 iteraciones y SHA-256
- La sal PBKDF2 se guarda en `localStorage` por usuario
- La clave de cifrado nunca se persiste; se regenera en cada sesión
- Los archivos adjuntos también se cifran individualmente
