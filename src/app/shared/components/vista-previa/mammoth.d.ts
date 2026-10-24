/** Tipos mínimos del build para navegador de mammoth (Word .docx -> HTML). */
declare module 'mammoth/mammoth.browser.min.js' {
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: unknown[] }>;
}
