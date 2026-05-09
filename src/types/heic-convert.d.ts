declare module "heic-convert" {
  interface HeicConvertOptions {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality?: number;
  }

  function heicConvert(options: HeicConvertOptions): Promise<Buffer | Uint8Array | ArrayBuffer>;

  export default heicConvert;
}
