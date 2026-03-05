declare module 'get-stream' {
  export function getStreamAsBuffer(stream: NodeJS.ReadableStream): Promise<Buffer>;
}
