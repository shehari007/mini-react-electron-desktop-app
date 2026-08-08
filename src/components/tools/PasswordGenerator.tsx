'use client';

import { RefreshCw, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Segmented, Slider, Stepper, Switch } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { cn, formatNumber } from '@/lib/utils';

type Mode = 'password' | 'passphrase';

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
};

/** Characters that are easy to confuse in most fonts. */
const AMBIGUOUS = new Set(['l', 'I', '1', 'O', '0', 'o', '5', 'S', '2', 'Z', 'B', '8']);

/**
 * A short, memorable word list for passphrase mode.
 *
 * Bundled rather than fetched so the tool works offline. Entropy is computed
 * from the list's actual length and shown in the readout, so the strength claim
 * stays honest — a full Diceware list (7776 words, 12.9 bits each) is stronger
 * per word but would add ~60KB to this route.
 *
 * Deduplicated at module load: a repeated word would make the real entropy lower
 * than log2(length) suggests.
 */
const RAW_WORDS =
  'able acid aged also area army away baby back ball band bank base bath bear beat been beer bell belt bend best bike bill bird blue boat body bold bone book boot born both bowl bulk burn bush busy cake calm came camp card care case cash cast cell chat chef chip city clay clip club coal coat code cold come cook cool copy cord core corn cost crew crop cube cure curl dark dart data date dawn days dean dear deep deer desk dial dice diet dirt dish dock does dome done door dose dove down draw drew drop drum dual duck dust duty each earn ease east easy edge exam exit face fact fade fail fair fall fame farm fast fate fear feed feel feet fell felt file fill film find fine fire fish fist five flag flat flew flow food foot fork form fort four free frog from fuel full fund gain game gate gave gear gene gift girl give glad glow goal goat gold golf gone good gray grew grid grip grow gulf hair half hall hand hang hard harm hate have hawk head heal heap hear heat held hell helm help herb herd here hero hide high hill hint hire hold hole holy home hood hook hope horn hose host hour huge hunt hurt icon idea inch iron item jade jazz join joke jump jury just keen keep kept kick kind king kiss kite knee knew knot know lace lack lady laid lake lamb lamp land lane last late lava lawn lead leaf lean leap left lend lens less lift like lime line link lion list live load loan lock loft logo long look loop lord lose loss loud love luck lung made mail main make mall many map mark mask mass mast mate math meal mean meat meet melt menu mesh mild mile milk mill mind mine mint miss mist mode mood moon more moss most moth move much mule must nail name navy near neat neck need nest news next nice nine node none noon norm nose note noun oath oats obey odds omit once only onto open oral oven over pace pack page paid pain pair pale palm park part pass past path peak pear peel pace poem poet pole poll pond pool poor pork port post pour pray prep prey prop pull pump pure push quit quiz race rack raft rage rail rain rake ramp rank rare rate read real reef reel rely rent rest rice rich ride ring rise risk road roar robe rock rode role roll roof room root rope rose rule rush rust safe sage said sail salt same sand sang save scan seal seat seed seek seem seen self sell send sent shed ship shoe shop shot show shut side sign silk sing sink site size skin skip slab sled slid slim slip slot slow snap snow soap sock soft soil sold sole solo some song soon sort soul soup sour span spin spot star stay stem step stew stir stop stud such suit sunk sure surf swim tale talk tall tank tape task teal team tear tech tell tend tent term test text than that them then they thin this thus tide tidy tile time tiny tone took tool torn tour town trap tray tree trim trip true tube tuna tune turn twin type unit upon urge used user vase vast verb very vest view vine visa void vote wage wait wake walk wall want warm warn wash wave weak wear week well went were west what when whip whom wide wife wild will wind wine wing wipe wire wise wish with wolf wood wool word wore work worm worn wrap yard yarn yeah year yoga zone zoom'.split(
    ' ',
  );

const WORDS = [...new Set(RAW_WORDS)];

const SEPARATORS = [
  { value: '-', label: 'Hyphen  -' },
  { value: '.', label: 'Dot  .' },
  { value: '_', label: 'Underscore  _' },
  { value: ' ', label: 'Space' },
  { value: '', label: 'None' },
];

/** Uniform random integer in [0, max) from the CSPRNG.
 *  `% max` on a raw 32-bit value would bias toward low numbers, so values
 *  landing in the final partial bucket are rejected and redrawn. */
function randomBelow(max: number): number {
  const limit = Math.floor(0xffffffff / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0] ?? 0;
  } while (value >= limit);
  return value % max;
}

function pick<T>(items: readonly T[]): T {
  return items[randomBelow(items.length)] as T;
}

/** Estimated time to crack, at 100 billion guesses per second — a plausible
 *  rate for an offline attack on a fast hash with commodity GPUs. */
function crackTime(bits: number): string {
  const guessesPerSecond = 1e11;
  // Expected work is half the keyspace.
  const seconds = 2 ** (bits - 1) / guessesPerSecond;

  if (seconds < 1) return 'instantly';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2.6e6) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 3.15e7) return `${Math.round(seconds / 2.6e6)} months`;

  const years = seconds / 3.15e7;
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${Math.round(years / 1000)} thousand years`;
  if (years < 1e9) return `${Math.round(years / 1e6)} million years`;
  if (years < 1e12) return `${Math.round(years / 1e9)} billion years`;
  return 'longer than the age of the universe';
}

function strengthLabel(bits: number): { label: string; tone: 'danger' | 'warning' | 'success'; percent: number } {
  // 128 bits is the point past which the meter is simply full.
  const percent = Math.min(100, (bits / 128) * 100);
  if (bits < 50) return { label: 'Weak', tone: 'danger', percent };
  if (bits < 75) return { label: 'Reasonable', tone: 'warning', percent };
  if (bits < 100) return { label: 'Strong', tone: 'success', percent };
  return { label: 'Very strong', tone: 'success', percent };
}

export function PasswordGenerator() {
  const [mode, setMode] = useState<Mode>('password');

  // Password options
  const [length, setLength] = useState(20);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);

  // Passphrase options
  const [wordCount, setWordCount] = useState(5);
  const [separator, setSeparator] = useState('-');
  const [capitalize, setCapitalize] = useState(true);
  const [appendNumber, setAppendNumber] = useState(true);

  const [value, setValue] = useState('');

  const alphabet = useMemo(() => {
    let chars = '';
    if (useLower) chars += SETS.lower;
    if (useUpper) chars += SETS.upper;
    if (useDigits) chars += SETS.digits;
    if (useSymbols) chars += SETS.symbols;
    if (avoidAmbiguous) chars = [...chars].filter((char) => !AMBIGUOUS.has(char)).join('');
    return chars;
  }, [useLower, useUpper, useDigits, useSymbols, avoidAmbiguous]);

  const generate = useCallback(() => {
    if (mode === 'password') {
      if (alphabet.length === 0) {
        setValue('');
        return;
      }
      setValue(Array.from({ length }, () => pick([...alphabet])).join(''));
      return;
    }

    const words = Array.from({ length: wordCount }, () => {
      const word = pick(WORDS);
      return capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    });

    const phrase = words.join(separator);
    setValue(appendNumber ? `${phrase}${separator}${randomBelow(100)}` : phrase);
  }, [mode, alphabet, length, wordCount, separator, capitalize, appendNumber]);

  // Generated in an effect: random output during render would differ between the
  // prerender and hydration.
  useEffect(() => {
    generate();
  }, [generate]);

  const entropyBits = useMemo(() => {
    if (mode === 'password') {
      if (alphabet.length === 0) return 0;
      return length * Math.log2(alphabet.length);
    }
    // log2(list size) bits per word, plus log2(100) ≈ 6.6 for a 0-99 suffix.
    const base = wordCount * Math.log2(WORDS.length);
    return base + (appendNumber ? Math.log2(100) : 0);
  }, [mode, alphabet.length, length, wordCount, appendNumber]);

  const strength = strengthLabel(entropyBits);
  const noSetsSelected = mode === 'password' && alphabet.length === 0;

  return (
    <ToolColumns
      main={
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented
                value={mode}
                onChange={setMode}
                ariaLabel="Generator mode"
                options={[
                  { value: 'password', label: 'Random password' },
                  { value: 'passphrase', label: 'Passphrase' },
                ]}
              />
              <Button variant="primary" leadingIcon={<RefreshCw />} onClick={generate}>
                Generate
              </Button>
            </div>

            <div className="mt-5">
              {noSetsSelected ? (
                <Callout tone="danger">Choose at least one character type below.</Callout>
              ) : (
                <div className="rounded-2xl border border-accent/25 bg-accent-soft px-4 py-5">
                  <p className="break-all text-center font-mono text-lg font-semibold leading-relaxed text-accent-text sm:text-xl">
                    {value}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <CopyButton value={value} label="Copy password" variant="secondary" size="md" disabled={value === ''} />
            </div>

            {/* Strength meter. The fill carries the severity; the track is a
                lighter step of the same ramp so the state reads across it. */}
            <div className="mt-6">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-fg">Strength</span>
                <span
                  className={cn(
                    'text-[13px] font-semibold',
                    strength.tone === 'danger'
                      ? 'text-danger'
                      : strength.tone === 'warning'
                        ? 'text-warning'
                        : 'text-success',
                  )}
                >
                  {strength.label} · {formatNumber(entropyBits, 0)} bits
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-accent-soft"
                role="meter"
                aria-valuenow={Math.round(entropyBits)}
                aria-valuemin={0}
                aria-valuemax={128}
                aria-label="Password strength in bits of entropy"
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-[width,background-color] duration-300',
                    strength.tone === 'danger'
                      ? 'bg-danger'
                      : strength.tone === 'warning'
                        ? 'bg-warning'
                        : 'bg-success',
                  )}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Stat label="Entropy" value={`${formatNumber(entropyBits, 1)} bits`} />
              <Stat label="Time to crack" value={crackTime(entropyBits)} hint="at 100 billion guesses/sec" />
            </div>
          </Card>

          <Callout tone="info" title="Generated on your device">
            This uses your browser&apos;s cryptographic random source. Nothing is sent over the network and no
            password is ever stored, so what you see here exists only until you navigate away.
          </Callout>
        </>
      }
      side={
        <Card>
          <CardHeader title="Options" icon={<ShieldCheck />} />

          {mode === 'password' ? (
            <div className="mt-4 space-y-4">
              <Slider
                label="Length"
                value={length}
                onChange={setLength}
                min={8}
                max={128}
                formatValue={(value) => `${value} chars`}
              />

              <div className="space-y-3 border-t border-border pt-4">
                <Switch checked={useLower} onChange={setUseLower} label="Lowercase (a–z)" />
                <Switch checked={useUpper} onChange={setUseUpper} label="Uppercase (A–Z)" />
                <Switch checked={useDigits} onChange={setUseDigits} label="Digits (0–9)" />
                <Switch checked={useSymbols} onChange={setUseSymbols} label="Symbols (!@#…)" />
                <Switch
                  checked={avoidAmbiguous}
                  onChange={setAvoidAmbiguous}
                  label="Avoid look-alike characters"
                  description="Excludes l, I, 1, O, 0 and similar pairs."
                />
              </div>

              <p className="border-t border-border pt-4 text-[12px] leading-relaxed text-fg-subtle">
                Alphabet size: {alphabet.length} characters.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <Field label="Number of words">
                <Stepper value={wordCount} onChange={setWordCount} min={3} max={12} ariaLabel="word count" />
              </Field>

              <Field label="Separator">
                <Select
                  options={SEPARATORS}
                  value={separator}
                  onChange={(event) => setSeparator(event.currentTarget.value)}
                />
              </Field>

              <div className="space-y-3 border-t border-border pt-4">
                <Switch checked={capitalize} onChange={setCapitalize} label="Capitalise each word" />
                <Switch
                  checked={appendNumber}
                  onChange={setAppendNumber}
                  label="Append a number"
                  description="Satisfies rules that demand a digit."
                />
              </div>

              <p className="border-t border-border pt-4 text-[12px] leading-relaxed text-fg-subtle">
                From a {WORDS.length}-word list, so each word adds {formatNumber(Math.log2(WORDS.length), 1)} bits.
                Passphrases are far easier to type and remember than a random string of the same strength.
              </p>
            </div>
          )}
        </Card>
      }
    />
  );
}
