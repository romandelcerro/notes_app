# Notes App

Aplicación web personal de notas construida con **Angular 21**, **Angular Material** e **IndexedDB** (Dexie.js). Todo el contenido de las notas se cifra en el navegador usando AES-GCM antes de guardarse localmente.

## Características

- Inicio de sesión local (sin cuenta externa)
- Notas con texto, enlaces y archivos adjuntos
- Arrastrar y soltar archivos, pegar imágenes desde el portapapeles
- Cifrado AES-GCM local (clave derivada con PBKDF2 desde tu ID de usuario)
- Almacenamiento 100% local en IndexedDB (no sale de tu dispositivo)
- Busca, fija y colorea notas
- Perfil de usuario editable

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
- La clave se deriva de tu ID de usuario usando **PBKDF2** con 310 000 iteraciones y SHA-256
- La sal PBKDF2 se guarda en `localStorage` por usuario
- La clave de cifrado nunca se persiste; se regenera en cada sesión
- Los archivos adjuntos también se cifran individualmente
