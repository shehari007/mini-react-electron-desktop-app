/**
 * A small arithmetic expression evaluator: tokenizer → shunting-yard → RPN.
 *
 * This exists instead of mathjs, which is ~500KB for a calculator that needs
 * four operators and a dozen functions. Writing it out also means precise control
 * over the parts a calculator actually cares about: degree/radian trig, postfix
 * factorial, implicit multiplication before a parenthesis, and errors specific
 * enough to show the user ("unmatched parenthesis" rather than "syntax error").
 */

export type AngleMode = 'deg' | 'rad';

export class ExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpressionError';
  }
}

type TokenType = 'number' | 'operator' | 'function' | 'lparen' | 'rparen' | 'comma';

interface Token {
  type: TokenType;
  value: string;
  /** Distinguishes unary minus from subtraction; set during tokenizing. */
  unary?: boolean;
}

interface OperatorSpec {
  precedence: number;
  associativity: 'left' | 'right';
  arity: 1 | 2;
  /** Postfix operators bind to the value on their left (factorial). */
  postfix?: boolean;
}

const OPERATORS: Record<string, OperatorSpec> = {
  '+': { precedence: 2, associativity: 'left', arity: 2 },
  '-': { precedence: 2, associativity: 'left', arity: 2 },
  '*': { precedence: 3, associativity: 'left', arity: 2 },
  '/': { precedence: 3, associativity: 'left', arity: 2 },
  '%': { precedence: 3, associativity: 'left', arity: 2 },
  // Right-associative so 2^3^2 is 2^(3^2) = 512, matching maths convention.
  '^': { precedence: 4, associativity: 'right', arity: 2 },
  // Unary minus binds tighter than ^ would suggest but looser than factorial.
  'u-': { precedence: 5, associativity: 'right', arity: 1 },
  '!': { precedence: 6, associativity: 'left', arity: 1, postfix: true },
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  π: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new ExpressionError('Factorial needs a whole number that is zero or greater.');
  }
  // 171! overflows to Infinity; refusing is clearer than returning it.
  if (n > 170) throw new ExpressionError('That factorial is too large to represent.');
  let result = 1;
  for (let i = 2; i <= n; i += 1) result *= i;
  return result;
}

/** Functions available by name. Trig entries receive already-converted radians. */
const FUNCTIONS: Record<string, { arity: number; apply: (args: number[]) => number; trig?: boolean }> = {
  sin: { arity: 1, trig: true, apply: ([x = 0]) => Math.sin(x) },
  cos: { arity: 1, trig: true, apply: ([x = 0]) => Math.cos(x) },
  tan: { arity: 1, trig: true, apply: ([x = 0]) => Math.tan(x) },
  asin: { arity: 1, apply: ([x = 0]) => Math.asin(x) },
  acos: { arity: 1, apply: ([x = 0]) => Math.acos(x) },
  atan: { arity: 1, apply: ([x = 0]) => Math.atan(x) },
  sinh: { arity: 1, apply: ([x = 0]) => Math.sinh(x) },
  cosh: { arity: 1, apply: ([x = 0]) => Math.cosh(x) },
  tanh: { arity: 1, apply: ([x = 0]) => Math.tanh(x) },
  ln: { arity: 1, apply: ([x = 0]) => Math.log(x) },
  log: { arity: 1, apply: ([x = 0]) => Math.log10(x) },
  log10: { arity: 1, apply: ([x = 0]) => Math.log10(x) },
  log2: { arity: 1, apply: ([x = 0]) => Math.log2(x) },
  sqrt: { arity: 1, apply: ([x = 0]) => Math.sqrt(x) },
  cbrt: { arity: 1, apply: ([x = 0]) => Math.cbrt(x) },
  abs: { arity: 1, apply: ([x = 0]) => Math.abs(x) },
  exp: { arity: 1, apply: ([x = 0]) => Math.exp(x) },
  floor: { arity: 1, apply: ([x = 0]) => Math.floor(x) },
  ceil: { arity: 1, apply: ([x = 0]) => Math.ceil(x) },
  round: { arity: 1, apply: ([x = 0]) => Math.round(x) },
  sign: { arity: 1, apply: ([x = 0]) => Math.sign(x) },
  fact: { arity: 1, apply: ([x = 0]) => factorial(x) },
  min: { arity: 2, apply: (args) => Math.min(...args) },
  max: { arity: 2, apply: (args) => Math.max(...args) },
  pow: { arity: 2, apply: ([a = 0, b = 0]) => a ** b },
  root: { arity: 2, apply: ([x = 0, n = 1]) => (n === 0 ? NaN : Math.sign(x) * Math.abs(x) ** (1 / n)) },
};

export const FUNCTION_NAMES = Object.keys(FUNCTIONS);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  // Normalise the display glyphs a calculator keypad produces into ASCII.
  const source = input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/√/g, 'sqrt')
    .replace(/,/g, ',');

  let i = 0;

  const previous = () => tokens[tokens.length - 1];
  /** True when the next '-' is unary and the next '(' is an implicit multiply. */
  const expectsValue = () => {
    const token = previous();
    if (!token) return true;
    if (token.type === 'number' || token.type === 'rparen') return false;
    // A postfix operator produces a value, so what follows is not a value slot.
    if (token.type === 'operator' && OPERATORS[token.value]?.postfix) return false;
    return true;
  };

  while (i < source.length) {
    const char = source[i] as string;

    if (/\s/.test(char)) {
      i += 1;
      continue;
    }

    // Number, including decimals and exponent notation.
    if (/[\d.]/.test(char)) {
      // Consume the whole digit-and-dot run before validating, so "1.2.3" is
      // caught as one malformed literal rather than silently becoming 1.2 × 0.3.
      const match = /^[\d.]+(?:[eE][+-]?\d+)?/.exec(source.slice(i));
      const literal = match?.[0] ?? '';
      if (literal === '' || literal === '.') throw new ExpressionError(`Unexpected "${char}".`);
      if ((literal.match(/\./g) ?? []).length > 1) {
        throw new ExpressionError(`"${literal}" has more than one decimal point.`);
      }
      if (!Number.isFinite(Number(literal))) throw new ExpressionError(`"${literal}" is not a valid number.`);

      // Implicit multiply: 2pi, 3(4), 2sqrt(9).
      if (!expectsValue()) tokens.push({ type: 'operator', value: '*' });
      tokens.push({ type: 'number', value: literal });
      i += literal.length;
      continue;
    }

    // Identifier: a function name or a constant.
    if (/[a-zA-Zπ]/.test(char)) {
      // Names may contain digits (log2, log10), so the run is matched greedily
      // and then shortened to the longest prefix that is actually known. That
      // way "log2" resolves as one function while "pi2" still reads as pi × 2.
      const match = /^[a-zA-Z][a-zA-Z0-9]*|^π/.exec(source.slice(i));
      const run = match?.[0] ?? char;

      let word = run;
      while (word.length > 1 && !(word.toLowerCase() in FUNCTIONS) && !(word.toLowerCase() in CONSTANTS)) {
        word = word.slice(0, -1);
      }

      const lower = word.toLowerCase();

      if (!expectsValue()) tokens.push({ type: 'operator', value: '*' });

      if (lower in FUNCTIONS) {
        tokens.push({ type: 'function', value: lower });
      } else if (word === 'π' || lower in CONSTANTS) {
        tokens.push({ type: 'number', value: String(CONSTANTS[word === 'π' ? 'π' : lower]) });
      } else {
        throw new ExpressionError(`"${run}" is not a known function or constant.`);
      }

      i += word.length;
      continue;
    }

    if (char === '(') {
      if (!expectsValue()) tokens.push({ type: 'operator', value: '*' });
      tokens.push({ type: 'lparen', value: char });
      i += 1;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'rparen', value: char });
      i += 1;
      continue;
    }

    if (char === ',') {
      tokens.push({ type: 'comma', value: char });
      i += 1;
      continue;
    }

    if (char in OPERATORS) {
      if (char === '-' && expectsValue()) {
        tokens.push({ type: 'operator', value: 'u-', unary: true });
      } else if (char === '+' && expectsValue()) {
        // Leading unary plus is a no-op; drop it rather than erroring.
      } else {
        tokens.push({ type: 'operator', value: char });
      }
      i += 1;
      continue;
    }

    throw new ExpressionError(`Unexpected character "${char}".`);
  }

  return tokens;
}

/** Shunting-yard: infix tokens → reverse Polish notation. */
function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];
  // Tracks how many arguments each open function call has seen.
  const argCounts: number[] = [];

  for (const token of tokens) {
    if (token.type === 'number') {
      output.push(token);
      continue;
    }

    if (token.type === 'function') {
      stack.push(token);
      continue;
    }

    if (token.type === 'comma') {
      while (stack.length > 0 && stack[stack.length - 1]?.type !== 'lparen') {
        output.push(stack.pop() as Token);
      }
      if (stack.length === 0) throw new ExpressionError('Misplaced comma.');
      const last = argCounts.length - 1;
      if (last >= 0) argCounts[last] = (argCounts[last] ?? 1) + 1;
      continue;
    }

    if (token.type === 'operator') {
      const spec = OPERATORS[token.value];
      if (!spec) throw new ExpressionError(`Unknown operator "${token.value}".`);

      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (!top || top.type !== 'operator') break;
        const topSpec = OPERATORS[top.value];
        if (!topSpec) break;

        const shouldPop =
          topSpec.precedence > spec.precedence ||
          (topSpec.precedence === spec.precedence && spec.associativity === 'left');
        if (!shouldPop) break;
        output.push(stack.pop() as Token);
      }

      stack.push(token);
      continue;
    }

    if (token.type === 'lparen') {
      stack.push(token);
      // A '(' directly after a function name opens an argument list.
      if (stack[stack.length - 2]?.type === 'function') argCounts.push(1);
      continue;
    }

    if (token.type === 'rparen') {
      while (stack.length > 0 && stack[stack.length - 1]?.type !== 'lparen') {
        output.push(stack.pop() as Token);
      }
      if (stack.length === 0) throw new ExpressionError('Unmatched closing parenthesis.');
      stack.pop();

      const top = stack[stack.length - 1];
      if (top?.type === 'function') {
        const count = argCounts.pop() ?? 1;
        const spec = FUNCTIONS[top.value];
        if (spec && spec.arity !== count) {
          throw new ExpressionError(
            `${top.value}() takes ${spec.arity} argument${spec.arity === 1 ? '' : 's'}, got ${count}.`,
          );
        }
        output.push(stack.pop() as Token);
      }
      continue;
    }
  }

  while (stack.length > 0) {
    const token = stack.pop() as Token;
    if (token.type === 'lparen') throw new ExpressionError('Unmatched opening parenthesis.');
    output.push(token);
  }

  return output;
}

function evaluateRpn(rpn: Token[], angleMode: AngleMode): number {
  const stack: number[] = [];

  for (const token of rpn) {
    if (token.type === 'number') {
      stack.push(Number(token.value));
      continue;
    }

    if (token.type === 'operator') {
      const spec = OPERATORS[token.value];
      if (!spec) throw new ExpressionError(`Unknown operator "${token.value}".`);

      if (spec.arity === 1) {
        const value = stack.pop();
        if (value === undefined) throw new ExpressionError('An operator is missing its operand.');
        stack.push(token.value === 'u-' ? -value : factorial(value));
        continue;
      }

      const right = stack.pop();
      const left = stack.pop();
      if (left === undefined || right === undefined) {
        throw new ExpressionError('An operator is missing its operand.');
      }

      switch (token.value) {
        case '+':
          stack.push(left + right);
          break;
        case '-':
          stack.push(left - right);
          break;
        case '*':
          stack.push(left * right);
          break;
        case '/':
          if (right === 0) throw new ExpressionError('Cannot divide by zero.');
          stack.push(left / right);
          break;
        case '%':
          if (right === 0) throw new ExpressionError('Cannot take a remainder by zero.');
          stack.push(left % right);
          break;
        case '^':
          stack.push(left ** right);
          break;
        default:
          throw new ExpressionError(`Unknown operator "${token.value}".`);
      }
      continue;
    }

    if (token.type === 'function') {
      const spec = FUNCTIONS[token.value];
      if (!spec) throw new ExpressionError(`"${token.value}" is not a known function.`);

      const args: number[] = [];
      for (let i = 0; i < spec.arity; i += 1) {
        const value = stack.pop();
        if (value === undefined) throw new ExpressionError(`${token.value}() is missing an argument.`);
        args.unshift(value);
      }

      // Degree mode converts on the way into forward trig, and on the way out of
      // the inverses, so the whole calculator is consistent.
      if (spec.trig && angleMode === 'deg' && args[0] !== undefined) {
        args[0] = (args[0] * Math.PI) / 180;
      }

      let result = spec.apply(args);
      if (angleMode === 'deg' && ['asin', 'acos', 'atan'].includes(token.value)) {
        result = (result * 180) / Math.PI;
      }

      stack.push(result);
      continue;
    }
  }

  if (stack.length === 0) throw new ExpressionError('Nothing to calculate.');
  if (stack.length > 1) throw new ExpressionError('That expression is incomplete.');

  const result = stack[0] as number;
  if (Number.isNaN(result)) throw new ExpressionError('That is not a number (check the function inputs).');
  if (!Number.isFinite(result)) throw new ExpressionError('The result is too large to represent.');

  return result;
}

/** Evaluate an expression, throwing ExpressionError with a readable message. */
export function evaluateExpression(input: string, angleMode: AngleMode = 'rad'): number {
  const trimmed = input.trim();
  if (trimmed === '') throw new ExpressionError('Nothing to calculate.');
  return evaluateRpn(toRpn(tokenize(trimmed)), angleMode);
}

/** Non-throwing variant for live preview while typing. */
export function tryEvaluate(
  input: string,
  angleMode: AngleMode = 'rad',
): { ok: true; value: number } | { ok: false; error: string } {
  try {
    return { ok: true, value: evaluateExpression(input, angleMode) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Could not evaluate that.' };
  }
}
