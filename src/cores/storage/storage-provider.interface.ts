export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface StorageWriteRequest {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
}

export interface StoredObject {
  key: string;
  provider: string;
  bucket: string | null;
}

export interface StorageProvider {
  readonly name: string;

  write(request: StorageWriteRequest): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
