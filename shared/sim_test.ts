import { BOARD, BOARD_SIZE } from './board';
import { newGame, applyRoll, applyCardResult, applySupreme, applyTarget } from './engine';
let ok = true; const check = (c: boolean, m: string) => { if (!c) { ok = false; console.log('FAIL', m); } };
check(BOARD_SIZE === 42, 'size');
// every consecutive pair (and last->first) must be grid-adjacent
BOARD.forEach((q, i) => { const n = BOARD[(i + 1) % BOARD_SIZE]; check(Math.abs(q.c - n.c) + Math.abs(q.r - n.r) === 1, `adjacent ${i}->${(i+1)%42}`); });
check(new Set(BOARD.map(q => q.c + ',' + q.r)).size === 42, 'unique cells');
const count = (t: string) => BOARD.filter(q => q.type === t).length;
console.log({ black: count('black'), red: count('red'), judge: count('judge') });
let s = newGame([{ id: 'a', name: 'A', color: '#b00' }, { id: 'b', name: 'B', color: '#060' }]);
s = applyRoll(s, 1);                                   // lands on red 1
check(s.phase === 'card' && s.cardSide === 'red', 'red card');
s = applyCardResult(s, 4); check(s.teams[0].score === 40 && s.turn === 1, 'card score + turn');
// play 400 random turns, resolving whatever phase comes up
for (let n = 0; n < 400; n++) {
  if (s.phase === 'roll') s = applyRoll(s, 1 + Math.floor(Math.random() * 6));
  else if (s.phase === 'card') s = applyCardResult(s, Math.floor(Math.random() * 9));
  else if (s.phase === 'supreme') s = applySupreme(s, (Math.floor(Math.random() * 11) - 5) * 10);
  else if (s.phase === 'target') s = applyTarget(s, s.teams.find((t, i) => i !== s.turn)!.id);
  check(s.teams.every(t => t.pos >= 0 && t.pos < 42 && t.score >= 0), 'invariants');
}
console.log(s.phase, s.teams.map(t => [t.pos, t.score]));
console.log(ok ? 'ALL OK' : 'FAILURES');
