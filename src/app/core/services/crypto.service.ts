import { Injectable, computed, signal } from '@angular/core';

type TypedIV = Uint8Array<ArrayBuffer>;

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private _key = signal<CryptoKey | null>(null);

  readonly hasKey = computed(() => this._key() !== null);

  async initKey(userId: string) {
    const salt = await this._getOrCreateSalt(userId);
    const rawKeyMaterial = await this._deriveRawKey(userId);
    const derivedKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 310_000, hash: 'SHA-256' },
      rawKeyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    this._key.set(derivedKey);
  }

  clearKey() {
    this._key.set(null);
  }

  async encrypt(plaintext: string) {
    const key = this._requireKey();
    const iv = this._randomIV();
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    return this._pack(iv, new Uint8Array(ciphertext));
  }

  async decrypt(packed: string) {
    const key = this._requireKey();
    const [iv, data] = this._unpack(packed);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
  }

  async encryptBuffer(buffer: ArrayBuffer) {
    const key = this._requireKey();
    const iv = this._randomIV();
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer);
    return this._pack(iv, new Uint8Array(ciphertext));
  }

  async decryptBuffer(packed: string) {
    const key = this._requireKey();
    const [iv, data] = this._unpack(packed);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  }

  private _requireKey() {
    const key = this._key();
    if (!key) throw new Error('Crypto key not initialized');
    return key;
  }

  private _randomIV() {
    return crypto.getRandomValues(new Uint8Array(12)) as TypedIV;
  }

  private async _deriveRawKey(userId: string) {
    const encoded = new TextEncoder().encode(userId);
    return crypto.subtle.importKey('raw', encoded, 'PBKDF2', false, ['deriveKey']);
  }

  private async _getOrCreateSalt(userId: string) {
    const saltKey = `notes_salt_${userId}`;
    const stored = localStorage.getItem(saltKey);
    if (stored) {
      return new Uint8Array(JSON.parse(stored) as number[]) as TypedIV;
    }
    const salt = crypto.getRandomValues(new Uint8Array(32)) as TypedIV;
    localStorage.setItem(saltKey, JSON.stringify(Array.from(salt)));
    return salt;
  }

  private _pack(iv: TypedIV, data: Uint8Array) {
    const combined = new Uint8Array(iv.length + data.length);
    combined.set(iv);
    combined.set(data, iv.length);
    return btoa(Array.from(combined, (b) => String.fromCharCode(b)).join(''));
  }

  private _unpack(packed: string): [TypedIV, TypedIV] {
    const bytes = Uint8Array.from(atob(packed), (c) => c.charCodeAt(0));
    return [
      new Uint8Array(bytes.buffer, 0, 12) as TypedIV,
      new Uint8Array(bytes.buffer, 12) as TypedIV,
    ];
  }
}

