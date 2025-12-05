
export enum CatAction {
  IDLE = 'IDLE',
  SPIN = 'SPIN',
  JUMP = 'JUMP',
  LAY = 'LAY',
  SNEEZE = 'SNEEZE',
  SHAKE = 'SHAKE'
}

export interface Point {
  x: number;
  y: number;
}

export type TypewriterRule = [string, string]; // [Label, Instruction]
