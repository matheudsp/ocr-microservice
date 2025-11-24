export interface IOcrProvider {
  extractText(imageBuffer: Buffer): Promise<string>;
}
