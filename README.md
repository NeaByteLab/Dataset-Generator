<div align='center'>

# Dataset Generator

[![Deno](https://img.shields.io/badge/deno-compatible-ffcb00?logo=deno&logoColor=000000)](https://deno.com) [![Node](https://img.shields.io/badge/node-%3E%3D24-6DA55F?logo=node.js&logoColor=white)](https://nodejs.org) [![Bun](https://img.shields.io/badge/bun-compatible-f9f1e1?logo=bun&logoColor=000000)](https://bun.sh) [![Browser](https://img.shields.io/badge/browser-compatible-4285F4?logo=googlechrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

</div>

## What is this?

`generate()` expands each template by crossing every `{{name}}` slot against the matching lexicon list, returns the unique rows, and throws when a placeholder is invalid, a used slot has no values, or the expansion would exceed 1,000,000 rows.

## Installation

**Deno:**

```bash
deno add npm:@neabyte/dataset-generator
```

**npm:**

```bash
npm install @neabyte/dataset-generator
```

**CDN (jsDelivr/esm.sh):**

```html
<script type="module">
  import Dataset from 'https://cdn.jsdelivr.net/npm/@neabyte/dataset-generator/dist/index.mjs'
</script>
```

Or via [esm.sh](https://esm.sh):

```html
<script type="module">
  import Dataset from 'https://esm.sh/@neabyte/dataset-generator'
</script>
```

## Usage

```ts
import Dataset from '@neabyte/dataset-generator'

// Shared slot values for every template
const parameters = {
  name: ['Alice', 'Bob', 'Charlie', 'Support Lead'],
  action: ['restart the server', 'verify your account', 'clear cache']
}

// Templates that share those slot names
const templates = [
  'Hello {{name}}, I will {{action}} now.',
  'Could you please hold on {{name}} while I {{action}}?'
]

// Cross every slot value into unique rows
const dataset = Dataset.generate(templates, parameters)
// [
//   'Hello Alice, I will restart the server now.',
//   'Hello Alice, I will verify your account now.',
//   'Hello Alice, I will clear cache now.',
//   'Hello Bob, I will restart the server now.',
//   ...
// ]
```

A slot name must match `[A-Za-z_][A-Za-z0-9_]*`, and whitespace inside `{{ }}` is allowed. The same name can appear more than once in one template and is filled with the same value, while a template with no slots is returned as-is. Missing slots, empty value lists, and malformed placeholders throw.

## API

### generate

```ts
Dataset.generate(pattern, lexicon)
```

- `pattern` `<readonly string[]>`: Template strings with `{{name}}` slots.
- `lexicon` `<Readonly<Record<string, readonly string[]>>>`: Named string lists used to fill those slots.
- Returns: `<string[]>`

Throws:

- `TypeError` when `pattern` is not an array, an entry is not a string, `lexicon` is not a plain object, or a value list contains a non-string.
- `SyntaxError` when a `{{` opener is not a valid `{{name}}` placeholder.
- `RangeError` when a used placeholder has no values, or the expansion would exceed 1,000,000 rows.

## Build

```bash
npm run build
```

## Testing

```bash
deno task check
```

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for details.
