// Board layout traced from the physical board photo: one closed loop of 42 squares.
// Direction of travel: START -> along the bottom row to the right (index increases).
// Grid is 10 columns (c 0-9) x 7 rows (r 0-6); row 0 is the top row of the board.
// Square 26 was hidden by glare in the photo; it is assumed to be black. Verify on the real board.

export type SquareType =
  | 'start' | 'black' | 'red' | 'judge'
  | 'steal' | 'give' | 'sgr' | 'rhino' | 'mombasa' | 'lions' | 'home';

export interface Square { i: number; type: SquareType; c: number; r: number; label: string }

const T: [SquareType, number, number][] = [
  ['start', 0, 6],
  ['red', 1, 6], ['black', 2, 6], ['red', 3, 6], ['judge', 4, 6],
  ['black', 4, 5], ['red', 4, 4], ['black', 3, 4], ['give', 2, 4],
  ['red', 2, 3], ['judge', 2, 2],
  ['black', 3, 2], ['red', 4, 2], ['black', 5, 2], ['sgr', 6, 2],
  ['red', 6, 3], ['judge', 6, 4], ['black', 6, 5],
  ['rhino', 6, 6],
  ['red', 7, 6], ['black', 8, 6], ['mombasa', 9, 6],
  ['black', 9, 5], ['red', 9, 4], ['judge', 9, 3], ['red', 9, 2], ['black', 9, 1],
  ['steal', 9, 0],
  ['red', 8, 0], ['black', 7, 0], ['red', 6, 0], ['judge', 5, 0],
  ['black', 4, 0], ['red', 3, 0], ['black', 2, 0], ['red', 1, 0],
  ['lions', 0, 0],
  ['red', 0, 1], ['black', 0, 2], ['judge', 0, 3], ['red', 0, 4],
  ['home', 0, 5],
];

const LABELS: Record<SquareType, string> = {
  start: 'Start', black: 'Black card', red: 'Red card', judge: 'Supreme Court',
  steal: 'Steal 20 points from any team', give: 'Give 20 points to any team',
  sgr: 'SGR trip: collect 20 points', rhino: 'Rare find, a rhino: move 4 steps forward',
  mombasa: 'Mombasa Raha: skip a turn', lions: 'Mauled by lions: go back 3 spaces, lose 20 points',
  home: 'Back home: collect 50 points after passing Start',
};

export const BOARD: Square[] = T.map(([type, c, r], i) => ({ i, type, c, r, label: LABELS[type] }));
export const BOARD_SIZE = BOARD.length; // 42
