/**
 * Cartesian placeholder text expander.
 * @description Expands {{name}} patterns against a lexicon.
 */
export default class Dataset {
  /** Maximum generated row count */
  private static readonly ceiling = 1000000
  /** Placeholder token matcher */
  private static readonly token = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g

  /**
   * Row limit overflow message.
   * @description Explains how to shrink the expansion.
   * @returns Overflow message for RangeError
   */
  private static get overflow(): string {
    return `generate would produce more than ${Dataset.ceiling} rows, reduce the pattern count, the placeholder count, or the number of values`
  }

  /**
   * Expand patterns into rows.
   * @description Crosses placeholder values for each pattern.
   * @param pattern - Template strings with {{name}} slots
   * @param lexicon - Named string lists for slots
   * @returns Unique expanded row strings
   * @throws {TypeError} When pattern or lexicon is invalid
   * @throws {SyntaxError} When a placeholder is malformed
   * @throws {RangeError} When a slot is empty or too large
   */
  static generate(
    pattern: readonly string[],
    lexicon: Readonly<Record<string, readonly string[]>>
  ): string[] {
    if (!Array.isArray(pattern)) {
      throw new TypeError(`pattern argument must be an array but got ${typeof pattern}`)
    }
    if (lexicon === null || typeof lexicon !== 'object' || Array.isArray(lexicon)) {
      throw new TypeError(
        `lexicon argument must be a plain object but got ${
          lexicon === null ? 'null' : Array.isArray(lexicon) ? 'array' : typeof lexicon
        }`
      )
    }
    for (let index = 0; index < pattern.length; index++) {
      if (typeof pattern[index] !== 'string') {
        throw new TypeError(`pattern[${index}] must be a string but got ${typeof pattern[index]}`)
      }
    }
    const template = [...new Set(pattern)]
    const table = new Map<string, readonly string[]>()
    for (const key of Object.keys(lexicon)) {
      const values = lexicon[key]
      if (!Array.isArray(values)) {
        throw new TypeError(`lexicon.${key} must be an array of strings but got ${typeof values}`)
      }
      for (let offset = 0; offset < values.length; offset++) {
        if (typeof values[offset] !== 'string') {
          throw new TypeError(
            `lexicon.${key}[${offset}] must be a string but got ${typeof values[offset]}`
          )
        }
      }
      table.set(key, [...new Set(values)])
    }
    const row: string[] = []
    for (let index = 0; index < template.length; index++) {
      if (row.length >= Dataset.ceiling) {
        throw new RangeError(Dataset.overflow)
      }
      const source = template[index]
      const segment: string[] = []
      const slot: string[] = []
      const place: number[] = []
      let cursor = 0
      Dataset.token.lastIndex = 0
      let match = Dataset.token.exec(source)
      while (match !== null) {
        const start = match.index
        if (start > cursor) {
          const broken = source.indexOf('{{', cursor)
          if (broken !== -1 && broken < start) {
            throw new SyntaxError(Dataset.describe(index, source.slice(broken, start)))
          }
        }
        const name = match[1]
        if (name === undefined) {
          throw new SyntaxError(Dataset.describe(index, match[0]))
        }
        let at = slot.indexOf(name)
        if (at === -1) {
          at = slot.length
          slot.push(name)
        }
        segment.push(source.slice(cursor, start))
        place.push(at)
        cursor = start + match[0].length
        match = Dataset.token.exec(source)
      }
      const open = source.indexOf('{{', cursor)
      if (open !== -1) {
        const close = source.indexOf('}}', open + 2)
        const broken = close === -1 ? source.slice(open) : source.slice(open, close + 2)
        throw new SyntaxError(Dataset.describe(index, broken))
      }
      segment.push(source.slice(cursor))
      const pool = new Array<readonly string[]>(slot.length)
      const stride = new Array<number>(slot.length)
      let span = 1
      for (let depth = slot.length - 1; depth >= 0; depth--) {
        const name = slot[depth] ?? ''
        const values = table.get(name)
        if (values === undefined || values.length === 0) {
          throw new RangeError(
            `pattern[${index}] placeholder {{${name}}} has no values in ${source}`
          )
        }
        if (row.length + span * values.length > Dataset.ceiling) {
          throw new RangeError(Dataset.overflow)
        }
        pool[depth] = values
        stride[depth] = span
        span *= values.length
      }
      for (let combo = 0; combo < span; combo++) {
        let line = segment[0] ?? ''
        for (let depth = 0; depth < place.length; depth++) {
          const at = place[depth] ?? 0
          const values = pool[at] ?? []
          line = `${line}${values[Math.floor(combo / (stride[at] ?? 1)) % values.length] ?? ''}${
            segment[depth + 1] ?? ''
          }`
        }
        row.push(line)
      }
    }
    return [...new Set(row)]
  }

  /**
   * Build a malformed placeholder error.
   * @description Names the pattern index and bad token.
   * @param index - Pattern entry index
   * @param placeholder - Invalid placeholder text
   * @returns Syntax error message for the placeholder
   */
  private static describe(index: number, placeholder: string): string {
    return `pattern[${index}] placeholder ${placeholder} must match {{name}} and use an identifier`
  }
}
