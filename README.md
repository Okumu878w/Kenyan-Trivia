# Kenya in 50 Seconds – Online

Real-time multiplayer version of the physical board game, for players in the same room using their phones.

## Run it
    npm install
    npm start            # http://localhost:3000  (set PORT to change)
Players on the same Wi-Fi open `http://<your-computer-IP>:3000`. For play over the internet, deploy to any Node host that supports WebSockets (Render, Railway, Fly.io). Shared PHP/cPanel hosting will not work unless it offers Node apps.

## How a game runs
1. Host creates a room (the host is also the judge) and shares the 4-letter code.
2. Players join, pick a team; host starts.
3. A member of the team on turn taps Roll. Pieces move automatically.
4. Black/red square: one teammate taps "I'll give the clues". Only they and the judge see the 8 words. They tap Start (90 s timer), give hints, the judge taps each correctly guessed word and presses Submit. 10 points per word.
5. Judge squares: draw a Supreme card (random -50 to +50). Steal/Give squares: pick the team.
6. Host presses End game; highest score wins.

## Files
- `shared/engine.ts`, `shared/board.ts` - your game rules and board (pointsPerWord is now 10).
- `server/index.ts` - rooms, turns, timer, card decks, secrecy of the words.
- `public/index.html` - the phone/desktop client (Kenya @50 interface: welcome, lobby, scoreboard, dice, pawns, winner screen).
- `public/fonts/` - self-hosted Bricolage Grotesque and Figtree (SIL Open Font License), so the look is the same offline.
- `data/cards.json` - PLACEHOLDER cards. Replace with the real ones (8 words per card, separate `black` and `red` lists).

## Known gaps / to verify
- Square 26 colour (hidden by glare in the photo) is assumed black.
- Supreme card values are a random pick from 10 to 50 up or down; edit `SUPREME` in `server/index.ts` to match the real cards.
- Game state lives in server memory (a restart ends running games).
