export interface IStorageProvider {
  saveFile(
    bucket: string,
    fileName: string,
    fileBuffer: Buffer,
    mimetype: string
  ): Promise<string>;

  getFile(bucket: string, key: string): Promise<Buffer>;
}
