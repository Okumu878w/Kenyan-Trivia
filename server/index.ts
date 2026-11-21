// Authoritative game server. Clients send intents; the shared engine decides everything.
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { randomInt } from 'crypto';
import { Server, Socket } from 'socket.io';
import { BOARD } from '../shared/board';
import { State, newGame, applyRoll, applyCardResult, applySupreme, applyTarget } from '../shared/engine';

const PORT = Number(process.env.PORT) || 3000;
const RAW = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/cards.json'), 'utf8'));
// A card is either ["w1", ...] or { words: [...], hl: [highlighted words] }; every entry is in play for now.
interface Card { words: string[]; hl: string[] }
const norm = (a: any[]): Card[] => a.map(c => (Array.isArray(c) ? { words: c, hl: [] } : { words: c.words, hl: c.hl ?? [] }));
const CARDS = { black: norm(RAW.black), red: norm(RAW.red) };
const SUPREME = [-50, -40, -30, -20, -10, 10, 20, 30, 40, 50]; // adjust to match the real Supreme cards

const TEAM_DEFS = [
  { id: 't1', name: 'Team 1', color: '#f5c518' },
  { id: 't2', name: 'Team 2', color: '#2f9bff' },
  { id: 't3', name: 'Team 3', color: '#b266ff' },
  { id: 't4', name: 'Team 4', color: '#ff8a3d' },
];

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
class Deck {
  private q: Card[] = [];
  constructor(private src: Card[]) {}
  draw(): Card { if (!this.q.length) this.q = shuffle([...this.src]); return this.q.pop()!; }
}

interface Player { pid: string; name: string; teamId: string | null; sid: string | null }
interface Round { side: 'black' | 'red'; clueGiver: string; words: string[]; hl: boolean[]; correct: boolean[]; endsAt: number | null; expired: boolean; timer?: NodeJS.Timeout }
interface Room {
  code: string; hostPid: string; players: Map<string, Player>;
  game: State | null; round: Round | null; decks: { black: Deck; red: Deck }; lastSeen: number;
}

const rooms = new Map<string, Room>();
const app = express();
app.use(express.static(path.join(__dirname, '../public')));
app.get('/health', (_req, res) => { res.send('ok'); });
const server = http.createServer(app);
const io = new Server(server);

const clean = (s: unknown, n: number) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, n);
function newCode(): string {
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (;;) { let c = ''; for (let i = 0; i < 4; i++) c += L[randomInt(L.length)]; if (!rooms.has(c)) return c; }
}

function view(room: Room, pid: string) {
  const g = room.game, r = room.round, isHost = pid === room.hostPid;
  const me = room.players.get(pid)!;
  const showWords = !!r && (pid === r.clueGiver || isHost);
  return {
    now: Date.now(), code: room.code,
    me: { pid, teamId: me.teamId, isHost }, hostPid: room.hostPid, teamDefs: TEAM_DEFS,
    players: [...room.players.values()].map(p => ({ pid: p.pid, name: p.name, teamId: p.teamId, online: !!p.sid })),
    board: BOARD, game: g,
    round: r && {
      side: r.side, clueGiver: r.clueGiver, clueGiverName: room.players.get(r.clueGiver)?.name ?? '?',
      started: r.endsAt !== null, endsAt: r.endsAt, expired: r.expired,
      total: r.words.length, correctCount: r.correct.filter(Boolean).length,
      words: showWords ? r.words : null, hl: showWords ? r.hl : null, correct: showWords ? r.correct : null,
    },
  };
}
function broadcast(room: Room) {
  room.lastSeen = Date.now();
  for (const p of room.players.values()) if (p.sid) io.to(p.sid).emit('state', view(room, p.pid));
}
function clearRound(room: Room) { if (room.round?.timer) clearTimeout(room.round.timer); room.round = null; }

type Ack = (r: { ok: boolean; error?: string; code?: string }) => void;

io.on('connection', (socket: Socket) => {
  const ctx = () => {
    const room = rooms.get(socket.data.code); const pid: string = socket.data.pid;
    if (!room || !room.players.has(pid)) throw new Error('Not in a room');
    return { room, pid, player: room.players.get(pid)! };
  };
  const on = (ev: string, fn: (d: any, c: ReturnType<typeof ctx>) => void) =>
    socket.on(ev, (d: any, ack?: Ack) => {
      try { fn(d ?? {}, ctx()); ack?.({ ok: true }); } catch (e: any) { ack?.({ ok: false, error: e.message }); }
    });
  const curTeamId = (room: Room) => room.game!.teams[room.game!.turn].id;
  const needTurn = (room: Room, p: Player) => { if (!room.game || p.teamId !== curTeamId(room)) throw new Error("It's not your team's turn"); };
  const needHost = (room: Room, pid: string) => { if (pid !== room.hostPid) throw new Error('Host only'); };

  socket.on('create', (d: any, ack?: Ack) => {
    const pid = clean(d?.pid, 40), name = clean(d?.name, 20);
    if (!pid || !name) return ack?.({ ok: false, error: 'Enter your name' });
    const code = newCode();
    const room: Room = { code, hostPid: pid, players: new Map(), game: null, round: null,
      decks: { black: new Deck(CARDS.black), red: new Deck(CARDS.red) }, lastSeen: Date.now() };
    room.players.set(pid, { pid, name, teamId: null, sid: socket.id });
    rooms.set(code, room); socket.data = { code, pid }; socket.join(code);
    ack?.({ ok: true, code }); broadcast(room);
  });

  socket.on('join', (d: any, ack?: Ack) => {
    const pid = clean(d?.pid, 40), name = clean(d?.name, 20), code = clean(d?.code, 4).toUpperCase();
    const room = rooms.get(code);
    if (!room) return ack?.({ ok: false, error: 'Room not found' });
    const ex = room.players.get(pid);
    if (ex) { ex.sid = socket.id; }
    else {
      if (!name) return ack?.({ ok: false, error: 'Enter your name' });
      if (room.game) return ack?.({ ok: false, error: 'Game already started' });
      if (room.players.size >= 40) return ack?.({ ok: false, error: 'Room is full' });
      room.players.set(pid, { pid, name, teamId: null, sid: socket.id });
    }
    socket.data = { code, pid }; socket.join(code); ack?.({ ok: true, code }); broadcast(room);
  });

  on('team', (d, { room, player }) => {
    if (room.game) throw new Error('Game already started');
    player.teamId = TEAM_DEFS.some(t => t.id === d.teamId) ? d.teamId : null; broadcast(room);
  });
  on('start', (_d, { room, pid }) => {
    needHost(room, pid); if (room.game) throw new Error('Already started');
    const teams = TEAM_DEFS.filter(t => [...room.players.values()].some(p => p.teamId === t.id));
    if (teams.length < 2) throw new Error('Need at least 2 teams with players');
    room.game = newGame(teams); clearRound(room); broadcast(room);
  });
  on('roll', (_d, { room, player }) => {
    needTurn(room, player); room.game = applyRoll(room.game!, 1 + randomInt(6)); broadcast(room);
  });
  on('claim', (_d, { room, pid, player }) => {
    needTurn(room, player);
    if (room.game!.phase !== 'card' || room.round) throw new Error('No card to claim');
    const side = room.game!.cardSide!;
    const card = room.decks[side].draw();
    room.round = { side, clueGiver: pid, words: card.words, hl: card.words.map(w => card.hl.includes(w)),
      correct: card.words.map(() => false), endsAt: null, expired: false };
    broadcast(room);
  });
  on('startTimer', (_d, { room, pid }) => {
    const r = room.round; if (!r || r.clueGiver !== pid || r.endsAt) throw new Error("Can't start now");
    const ms = room.game!.config.roundSeconds * 1000; r.endsAt = Date.now() + ms;
    r.timer = setTimeout(() => { if (room.round === r) { r.expired = true; broadcast(room); } }, ms + 50);
    broadcast(room);
  });
  on('toggle', (d, { room, pid }) => {
    needHost(room, pid); const r = room.round; const i = Number(d.idx);
    if (!r || !(i >= 0 && i < r.words.length)) throw new Error('No such word');
    r.correct[i] = !r.correct[i]; broadcast(room);
  });
  on('submit', (_d, { room, pid }) => {
    needHost(room, pid); const r = room.round; if (!r) throw new Error('No round');
    const n = Math.min(r.correct.filter(Boolean).length, r.words.length);
    room.game = applyCardResult(room.game!, n); clearRound(room); broadcast(room);
  });
  on('supreme', (_d, { room, pid, player }) => {
    if (pid !== room.hostPid) needTurn(room, player);
    room.game = applySupreme(room.game!, SUPREME[randomInt(SUPREME.length)]); broadcast(room);
  });
  on('target', (d, { room, player }) => {
    needTurn(room, player); room.game = applyTarget(room.game!, String(d.teamId)); broadcast(room);
  });
  on('end', (_d, { room, pid }) => {
    needHost(room, pid); const g = room.game; if (!g) throw new Error('No game');
    const top = [...g.teams].sort((a, b) => b.score - a.score)[0];
    clearRound(room); room.game = { ...g, phase: 'ended', winnerId: top.id }; broadcast(room);
  });
  on('reset', (_d, { room, pid }) => {
    needHost(room, pid); clearRound(room); room.game = null; broadcast(room);
  });

  // Leave this room (any player). Before the game starts a non-host is removed; otherwise they are only detached so they can rejoin with the code.
  socket.on('leave', (_d: any, ack?: Ack) => {
    const room = rooms.get(socket.data?.code); const pid: string | undefined = socket.data?.pid; const p = pid ? room?.players.get(pid) : undefined;
    if (room && pid && p) {
      if (!room.game && pid !== room.hostPid) room.players.delete(pid); else p.sid = null;
      socket.leave(room.code); broadcast(room);
    }
    socket.data = {}; ack?.({ ok: true });
  });
  // Close the room for everyone (host only): tell every player, then delete it.
  on('close', (_d, { room, pid }) => {
    needHost(room, pid); clearRound(room);
    io.to(room.code).emit('closed');
    io.in(room.code).socketsLeave(room.code);
    rooms.delete(room.code);
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.data?.code); const p = room?.players.get(socket.data?.pid);
    if (room && p && p.sid === socket.id) { p.sid = null; broadcast(room); }
  });
});

// Drop rooms nobody has touched for 3 hours.
setInterval(() => {
  for (const [c, r] of rooms) if (Date.now() - r.lastSeen > 3 * 3600_000) { clearRound(r); rooms.delete(c); }
}, 10 * 60_000);

server.listen(PORT, () => console.log(`Game server on http://localhost:${PORT}`));
