# Notes App — Frontend

Aplicación web personal de notas construida con **Angular 21**, **Angular Material** y **ngx-translate**. El contenido de las notas se cifra en el navegador (AES-GCM) antes de enviarse al backend NestJS.

## Características

- Inicio de sesión con email/contraseña o como invitado (sesión 24h)
- Notas con texto, enlaces y archivos adjuntos
- Arrastrar y soltar archivos, pegar imágenes desde el portapapeles
- Cifrado AES-GCM cliente-servidor (clave derivada con PBKDF2 desde el ID de usuario)
- Almacenamiento remoto via API REST (NestJS :3000)
- Busca, fija y colorea notas
- Perfil de usuario editable
- Temas claro/oscuro, multi-idioma (EN/ES)

## Desarrollo

```bash
pnpm install
pnpm dev
```

Abre http://localhost:4200

## Build producción

```bash
pnpm build
```

## Estructura del proyecto

```
src/app/
  core/
    components/  # Home, login-card, settings-modal, user-menu-modal
    guards/      # authGuard, guestGuard, hasDataGuard, noDataGuard
    interceptors/ # authInterceptor (Bearer JWT)
    mappers/     # encryptNote/decryptNote wrappers
    models/      # User, Note, Section, Attachment
    services/    # Auth, Crypto, Notes, Sections, User, Backup, Files
  layout/
    shell/       # Side + toolbar + router-outlet
    sidenav/     # Section list + settings + sign-out
    toolbar/     # Search, clock, user avatar
  domains/
    notes/       # NoteCard, NoteCreateEditModal, NoteList, NotePreview
    sections/    # SectionCard, SectionCreateEditModal, SectionList
  shared/
    attachment-section/
    clock/
    confirm-dialog-modal/
    search-input/
    user-avatar/
```

## Seguridad

- Las notas se cifran con **AES-GCM 256-bit** antes de enviarse al backend
- La clave se deriva del ID de usuario usando **PBKDF2** con 310000 iteraciones y SHA-256
- La clave de cifrado nunca se persiste; se regenera en cada sesión
- Los archivos adjuntos también se cifran individualmente
- Autenticación via JWT (Bearer token en localStorage)
