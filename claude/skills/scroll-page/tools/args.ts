export interface ParsedArgs {
  positional: string[];
  flags: Map<string, string | true>;
}

// `--key value`, `--key=value` and bare `--flag`; everything else is positional.
export function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === undefined) continue;
    if (!a.startsWith("--")) {
      positional.push(a);
      continue;
    }
    const eq = a.indexOf("=");
    if (eq > 0) {
      flags.set(a.slice(2, eq), a.slice(eq + 1));
      continue;
    }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags.set(a.slice(2), next);
      i += 1;
    } else flags.set(a.slice(2), true);
  }
  return { positional, flags };
}

export function flagString(args: ParsedArgs, name: string): string | undefined {
  const v = args.flags.get(name);
  return typeof v === "string" ? v : undefined;
}

export function flagNumber(args: ParsedArgs, name: string): number | undefined {
  const v = flagString(args, name);
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`--${name} expects a number, got "${v}"`);
  return n;
}

export function flagBool(args: ParsedArgs, name: string): boolean {
  return args.flags.has(name);
}
