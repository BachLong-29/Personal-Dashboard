/** First non-empty line of free-form text — for single-line previews of a
 * multi-line note, where showing every line joined by spaces reads as a
 * run-on jumble instead of a readable summary. */
export function firstLine(text: string): string {
  return text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? '';
}
