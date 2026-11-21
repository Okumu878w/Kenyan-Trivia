// Pure game rules. Run on the server only; clients send intents and render the returned state.
import { BOARD, BOARD_SIZE } from './board';

export interface Config {
  roundSeconds: number;      // 90
  pointsPerWord: number;     // 10
  passStartBonus: number;    // 50
  sgrBonus: number;          // 20
  stealAmount: number;       // 20
  giveAmount: number;        // 20
  lionsPenalty: number;      // 20
  lionsBack: number;         // 3
  rhinoForward: number;      // 4
  allowNegative: boolean;
  winScore: number | null;   // null = host ends the game (confirmed)
}
export const DEFAULT_CONFIG: Config = {
  roundSeconds: 90, pointsPerWord: 10, passStartBonus: 50, sgrBonus: 20, stealAmount: 20,
  giveAmount: 20, lionsPenalty: 20, lionsBack: 3, rhinoForward: 4, allowNegative: false, winScore: null,
};

export type Phase = 'roll' | 'card' | 'supreme' | 'target' | 'ended';
export interface Team { id: string; name: string; color: string; pos: number; score: number; skip: boolean }
export interface State {
  teams: Team[]; turn: number; phase: Phase; roll?: number;
  cardSide?: 'black' | 'red';
  target?: { kind: 'steal' | 'give'; amount: number };
  log: string[]; config: Config; winnerId?: string;
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const cur = (s: State) => s.teams[s.turn];
const add = (s: State, t: Team, d: number) => {
  t.score += d;
  if (!s.config.allowNegative && t.score < 0) t.score = 0;
};

export function newGame(teams: { id: string; name: string; color: string }[], config = DEFAULT_CONFIG): State {
  return {
    teams: teams.map(t => ({ ...t, pos: 0, score: 0, skip: false })),
    turn: 0, phase: 'roll', log: [], config: { ...config },
  };
}

function endTurn(s: State): void {
  if (s.config.winScore !== null) {
    const w = s.teams.find(t => t.score >= s.config.winScore!);
    if (w) { s.phase = 'ended'; s.winnerId = w.id; return; }
  }
  s.cardSide = undefined; s.target = undefined; s.roll = undefined;
  for (let n = 0; n < s.teams.length; n++) {
    s.turn = (s.turn + 1) % s.teams.length;
    if (!cur(s).skip) break;
    cur(s).skip = false;
    s.log.push(`${cur(s).name} skips a turn`);
  }
  s.phase = 'roll';
}

// Move forward (positive) or back (negative); pay the Start bonus each time the loop wraps forward.
function moveBy(s: State, steps: number) {
  const t = cur(s);
  const raw = t.pos + steps;
  if (steps > 0 && raw >= BOARD_SIZE) {
    add(s, t, s.config.passStartBonus * Math.floor(raw / BOARD_SIZE));
    s.log.push(`${t.name} passes Start: +${s.config.passStartBonus}`);
  }
  t.pos = ((raw % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
}

function land(s: State, depth = 0): void {
  const t = cur(s);
  const sq = BOARD[t.pos];
  switch (sq.type) {
    case 'black': case 'red': s.cardSide = sq.type; s.phase = 'card'; return;
    case 'judge': s.phase = 'supreme'; return;
    case 'steal': s.target = { kind: 'steal', amount: s.config.stealAmount }; s.phase = 'target'; return;
    case 'give': s.target = { kind: 'give', amount: s.config.giveAmount }; s.phase = 'target'; return;
    case 'sgr': add(s, t, s.config.sgrBonus); s.log.push(`${t.name} takes the SGR: +${s.config.sgrBonus}`); return endTurn(s);
    case 'mombasa': t.skip = true; s.log.push(`${t.name} will skip their next turn`); return endTurn(s);
    case 'lions':
      add(s, t, -s.config.lionsPenalty); moveBy(s, -s.config.lionsBack);
      s.log.push(`${t.name} is mauled by lions`); return endTurn(s);
    case 'rhino':
      moveBy(s, s.config.rhinoForward); s.log.push(`${t.name} finds a rhino: +${s.config.rhinoForward} steps`);
      return depth < 1 ? land(s, depth + 1) : endTurn(s); // resolve the new square once, never chain further
    default: return endTurn(s); // start, home
  }
}

// intent: current team rolled. `dice` comes from the server's RNG.
export function applyRoll(prev: State, dice: number): State {
  if (prev.phase !== 'roll') throw new Error('not rolling');
  const s = clone(prev);
  s.roll = dice; moveBy(s, dice); land(s); return s;
}
// intent: round over, referee approved `approved` words (server clamps to the card's word count).
export function applyCardResult(prev: State, approved: number): State {
  if (prev.phase !== 'card') throw new Error('no card in play');
  const s = clone(prev);
  add(s, cur(s), approved * s.config.pointsPerWord);
  s.log.push(`${cur(s).name} scores ${approved * s.config.pointsPerWord}`);
  endTurn(s); return s;
}
// intent: Supreme Court card drawn by the server; delta is -50..+50 in steps of 10.
export function applySupreme(prev: State, delta: number): State {
  if (prev.phase !== 'supreme') throw new Error('not at the Supreme Court');
  const s = clone(prev);
  add(s, cur(s), delta); s.log.push(`Supreme Court: ${cur(s).name} ${delta >= 0 ? '+' : ''}${delta}`);
  endTurn(s); return s;
}
// intent: steal/give target chosen.
export function applyTarget(prev: State, targetId: string): State {
  if (prev.phase !== 'target' || !prev.target) throw new Error('no target needed');
  const s = clone(prev);
  const me = cur(s), other = s.teams.find(t => t.id === targetId);
  if (!other || other.id === me.id) throw new Error('bad target');
  const { kind, amount } = s.target!;
  if (kind === 'steal') {
    const take = s.config.allowNegative ? amount : Math.min(amount, other.score);
    add(s, other, -take); add(s, me, take);
  } else {
    const give = s.config.allowNegative ? amount : Math.min(amount, me.score);
    add(s, me, -give); add(s, other, give);
  }
  s.log.push(`${me.name} ${kind}s ${amount} ${kind === 'steal' ? 'from' : 'to'} ${other.name}`);
  endTurn(s); return s;
}
