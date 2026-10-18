/** Offers `text` as a file download named `filename`; the object URL is released after the click. */
export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime.includes('charset') ? mime : `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
