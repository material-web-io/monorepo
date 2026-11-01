import { toHtml } from 'hast-util-to-html'
import { fileURLToPath } from 'node:url'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import ts from 'typescript'
import { unified } from 'unified'
import type { Plugin } from 'vite'

/** A prop of a component, as its types and the comment on it say it. */
export type ApiProp = {
  name: string
  type: string
  isRequired: boolean
  /** The comment's text, which is Markdown, as HTML. */
  description: string
  default?: string
  /** The pages the comment names under @see. */
  see: string[]
  isDeprecated: boolean
}

/** The props of an exported component, by where they are declared. */
export type Api = {
  name: string
  /** The comment on the component, which is Markdown, as HTML. */
  description: string
  /** The props the component adds, declared in this package. */
  own: ApiProp[]
  /** The props it takes besides: those of the component or element it is built on. */
  inherited: ApiProp[]
  /** How many props of the element it renders it takes besides, which the tables leave out. */
  domCount: number
}

const root = fileURLToPath(new URL('../../..', import.meta.url))
const entry = fileURLToPath(new URL('../../react/src/index.ts', import.meta.url))
const ownSource = fileURLToPath(new URL('../../react/src/', import.meta.url))

// React's and React Aria's lists of every attribute and event an element takes.
const domInterfaces = new Set([
  'AriaAttributes',
  'DOMAttributes',
  'HTMLAttributes',
  'AllHTMLAttributes',
  'GlobalDOMAttributes',
  'GlobalDOMEvents',
])

const markdown = unified().use(remarkParse).use(remarkRehype)
const html = (text: string) => toHtml(markdown.runSync(markdown.parse(text)))

// The address in what a comment gives under @see: TypeScript reads `https` as the name a link
// is given and leaves the rest as its text, and a `{@link}` carries its own text after it.
const address = (see: string) =>
  see.replace(/^https?\s*:\/\//, 'https://').match(/https?:\/\/[^\s}]+/)?.[0]

const typeFormat =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType |
  ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope

function createProgram(oldProgram?: ts.Program) {
  const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json')!
  const { options } = ts.parseJsonConfigFileContent(
    ts.readConfigFile(configPath, ts.sys.readFile).config,
    ts.sys,
    root,
  )
  return ts.createProgram({ rootNames: [entry], options, oldProgram })
}

/** Reads the props of every component the React package exports. */
export function readApi(oldProgram?: ts.Program) {
  const program = createProgram(oldProgram)
  const checker = program.getTypeChecker()
  const module = checker.getSymbolAtLocation(program.getSourceFile(entry)!)!
  const apis = new Map<string, Api>()

  const text = (parts: ts.SymbolDisplayPart[] | undefined) => ts.displayPartsToString(parts).trim()

  const isLiteral = (type: ts.Type) =>
    type.isLiteral() || Boolean(type.flags & ts.TypeFlags.BooleanLiteral)

  // The types a prop has across a union of props, as one: a union of literals as its members,
  // `'a' | 'b'`, and any other type as its declaration writes it, which keeps React's aliases.
  const print = (prop: ts.Symbol, types: ts.Type[]): string => {
    const flat = (type: ts.Type): ts.Type[] => (type.isUnion() ? type.types.flatMap(flat) : [type])
    // A type that depends on a type parameter of the component is printed as what it is at most.
    const isGeneric = types.flatMap(flat).some((type) => type.flags & ts.TypeFlags.Instantiable)
    const members = types
      .flatMap(flat)
      .flatMap((type) =>
        type.flags & ts.TypeFlags.Instantiable
          ? flat(checker.getBaseConstraintOfType(type) ?? type)
          : [type],
      )
      .filter((member) => !(member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Never)))
    const printed = [
      ...new Set(members.map((member) => checker.typeToString(member, undefined, typeFormat))),
    ]
    if (members.every(isLiteral)) {
      const literals = printed.filter((literal) => literal !== 'true' && literal !== 'false')
      return [...literals, ...(printed.length > literals.length ? ['boolean'] : [])].join(' | ')
    }
    if (prop.getName() === 'ref') {
      const object = members.find((member) => member.getSymbol()?.getName() === 'RefObject')
      const [element] = object ? checker.getTypeArguments(object as ts.TypeReference) : []
      if (element) {
        const name = checker.typeToString(
          checker.getNonNullableType(element),
          undefined,
          typeFormat,
        )
        return `Ref<${name}>`
      }
    }
    // As it is written, unless that names a type parameter, which says nothing here: then the
    // type it resolves to, where that is short enough to read.
    const written = prop.declarations?.find(ts.isPropertySignature)?.type?.getText()
    const literals = printed.filter((literal) => literal !== 'true' && literal !== 'false')
    const resolved = [...literals, ...(printed.length > literals.length ? ['boolean'] : [])]
    const namesParameter = isGeneric || /\b[A-Z]\b/.test(written ?? '')
    if (written && !(namesParameter && resolved.length <= 8)) return written.replace(/\s+/g, ' ')
    return resolved.join(' | ')
  }

  for (const exported of checker.getExportsOfModule(module)) {
    const symbol =
      exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
    const declaration = symbol.valueDeclaration
    const name = exported.getName()
    // A component: an exported value named as one, which is called with its props.
    if (!declaration || !/^[A-Z]/.test(name)) continue
    const signature = checker.getTypeOfSymbolAtLocation(symbol, declaration).getCallSignatures()[0]
    const parameter = signature?.getParameters()[0]
    if (!signature || !parameter || signature.getParameters().length > 2) continue
    const propsType = checker.getTypeOfSymbolAtLocation(parameter, declaration)

    // The props of every member of a union of props, each once, with the types it has in each.
    const props = new Map<string, { symbol: ts.Symbol; types: ts.Type[]; optional: boolean }>()
    const members = propsType.isUnion() ? propsType.types : [propsType]
    for (const member of members) {
      for (const prop of checker.getPropertiesOfType(checker.getApparentType(member))) {
        const type = checker.getTypeOfSymbolAtLocation(prop, declaration)
        const seen = props.get(prop.getName()) ?? { symbol: prop, types: [], optional: false }
        seen.types.push(type)
        seen.optional ||= Boolean(prop.flags & ts.SymbolFlags.Optional)
        props.set(prop.getName(), seen)
      }
    }

    const api: Api = {
      name,
      description: html(text(symbol.getDocumentationComment(checker))),
      own: [],
      inherited: [],
      domCount: 0,
    }
    for (const [propName, { symbol: prop, types, optional }] of props) {
      // React's own, which no component reads.
      if (propName === 'key') continue
      const source = prop.declarations?.[0]
      const holder = source?.parent
      const isDom =
        holder !== undefined &&
        ts.isInterfaceDeclaration(holder) &&
        domInterfaces.has(holder.name.text)
      if (isDom) {
        api.domCount += 1
        continue
      }
      const tags = prop.getJsDocTags(checker)
      const tag = (tagName: string) => tags.filter((entry) => entry.name === tagName)
      const defaultValue = text(tag('default')[0]?.text)
      const entry: ApiProp = {
        name: propName,
        type: print(prop, types),
        // A member of a union of props that leaves a prop out makes it optional.
        isRequired: !optional && types.length === members.length,
        description: html(text(prop.getDocumentationComment(checker))),
        ...(defaultValue && { default: defaultValue }),
        see: tag('see').flatMap((seen) => address(text(seen.text)) ?? []),
        isDeprecated: tag('deprecated').length > 0,
      }
      // A prop this package declares and documents is its own: one it only retypes, such as
      // `className`, is listed with those of the React Aria component.
      const file = source?.getSourceFile().fileName ?? ''
      const isOwn = file.startsWith(ownSource)
      ;(isOwn && entry.description ? api.own : api.inherited).push(entry)
    }
    apis.set(name, api)
  }
  return { program, apis }
}

const prefix = 'virtual:api/'

/**
 * `virtual:api/<Component>`: the props of a component of the React package, read from its types
 * with the TypeScript compiler, so that a page's tables say what the code says.
 */
export function api(): Plugin {
  let read: ReturnType<typeof readApi> | undefined
  return {
    name: 'docs:api',
    resolveId(id) {
      if (id.startsWith(prefix)) return `\0${id}`
    },
    load(id) {
      if (!id.startsWith(`\0${prefix}`)) return
      read ??= readApi()
      const name = id.slice(prefix.length + 1)
      const found = read.apis.get(name)
      if (!found) this.error(`@material-web/react exports no component named ${name}`)
      // Every source file a table is read from is one whose change the page follows.
      for (const file of read.program.getSourceFiles()) {
        if (file.fileName.startsWith(ownSource)) this.addWatchFile(file.fileName)
      }
      return `export default ${JSON.stringify(found)}`
    },
    // The types are read again, from the program before, once a component's source changes.
    watchChange(file) {
      if (read && file.startsWith(ownSource)) read = readApi(read.program)
    },
  }
}
