type Player = 1 | 2 | undefined;

export type Game = {
  lines: Line[];
};

const MAX_BALLS = 6;
type MovePhase = "placement" | "movement";
type LastMove = {
  type: "place" | "move";
  toId: string;
  fromId?: string;
};
type AvailableMove = {
  id: string;
};

class Board {
  private game: Game;
  public player: Player = 1;
  private selectedNode?: Node;
  private numberOfBalls = 0;
  private nodes = new Map<string, Node & { neighbors: Node[] }>();
  private lastMove?: LastMove;

  constructor(game: Game) {
    this.game = game;
  }

  start() {
    console.log("Iniciando juego");
  }

  play(from: Node) {
    if (this.checkStatus().includes("wins")) {
      return;
    }

    const isPlacementPhase = this.numberOfBalls < MAX_BALLS;

    if (isPlacementPhase) {
      if (!this.isNexoAvailable(from)) {
        return;
      }
      from.player = this.player;
      this.numberOfBalls++;
      this.lastMove = {
        type: "place",
        toId: from.id,
      };
      this.player = this.player === 1 ? 2 : 1;
      this.selectedNode = undefined;
      return this.getGame();
    }

    if (!this.selectedNode) {
      if (from.player === this.player) {
        this.selectedNode = from;
      }
      return this.getGame();
    }

    if (from === this.selectedNode) {
      this.selectedNode = undefined;
      return this.getGame();
    }

    if (!this.isNexoAvailable(from)) {
      if (from.player === this.player) {
        this.selectedNode = from;
      }
      return this.getGame();
    }

    const neighbours = this.getNeighbours(this.selectedNode);
    if (!neighbours.includes(from)) {
      return this.getGame();
    }

    const fromId = this.selectedNode.id;
    this.selectedNode.player = undefined;
    from.player = this.player;
    this.selectedNode = undefined;
    this.lastMove = {
      type: "move",
      fromId,
      toId: from.id,
    };
    this.player = this.player === 1 ? 2 : 1;
    return this.getGame();
  }

  clear() {
    this.selectedNode = undefined;
    this.player = 1;
    this.numberOfBalls = 0;
    this.lastMove = undefined;
    for (const line of this.game.lines) {
      for (const node of line.nodes) {
        node.player = undefined;
      }
    }
  }

  getNexoById(id: string) {
    for (const line of this.game.lines) {
      for (const node of line.nodes) {
        if (node.id === id) {
          return node;
        }
      }
    }
  }

  isNexoAvailable(nexo: Node) {
    return nexo.player === undefined;
  }

  getNeighbours(nexo: Node) {
    const neighbours: Node[] = [];
    for (const line of this.game.lines) {
      if (line.nodes[0] === nexo) {
        neighbours.push(line.nodes[1]);
      }
      if (line.nodes[1] === nexo) {
        neighbours.push(line.nodes[0]);
        neighbours.push(line.nodes[2]);
      }
      if (line.nodes[2] === nexo) {
        neighbours.push(line.nodes[1]);
      }
    }
    return neighbours;
  }

  checkStatus(): "player 1 wins" | "player 2 wins" | "playing" | "setup" {
    const winningLine = this.getWinningLine();
    if (winningLine) {
      const playerOfLine = winningLine.nodes[0].player;
      if (playerOfLine) {
        return `player ${playerOfLine} wins`;
      }
    }
    return "playing";
  }

  private getWinningLine() {
    for (const line of this.game.lines) {
      const playerOfLine = line.nodes[0].player;
      if (!playerOfLine) continue;
      if (line.nodes.every((node) => node.player === playerOfLine)) {
        return line;
      }
    }
  }

  getGame() {
    const phase: MovePhase =
      this.numberOfBalls < MAX_BALLS ? "placement" : "movement";
    const winningLine = this.getWinningLine();
    const status =
      winningLine && winningLine.nodes[0].player
        ? `player ${winningLine.nodes[0].player} wins`
        : "playing";
    const availableMoves: AvailableMove[] =
      phase === "movement" && this.selectedNode ? this.getAvailableMoves() : [];
    return {
      game: this.game,
      status,
      player: this.player,
      selectedNode: this.selectedNode,
      phase,
      lastMove: this.lastMove,
      winningLineId: winningLine?.id,
      availableMoves,
    };
  }

  private getAvailableMoves(): AvailableMove[] {
    if (!this.selectedNode) {
      return [];
    }
    const neighbours = this.getNeighbours(this.selectedNode);
    const uniqueMoves = new Map<string, AvailableMove>();
    for (const node of neighbours) {
      if (this.isNexoAvailable(node) && !uniqueMoves.has(node.id)) {
        uniqueMoves.set(node.id, { id: node.id });
      }
    }
    return Array.from(uniqueMoves.values());
  }
}

export class Node {
  constructor(
    public id: string,
    public x: number,
    public y: number,
    public player?: Player
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.player = player;
  }

  setPlayer(player: Player) {
    this.player = player;
  }

  getPlayer() {
    return this.player;
  }

  getId() {
    return this.id;
  }
}

class Line {
  constructor(public id: string, public nodes: [Node, Node, Node]) {
    this.id = id;
    this.nodes = nodes;
  }

  isLine = () => {
    return this.nodes.every((node) => node.getPlayer() !== undefined);
  };
}
// initial position to show full circle
const i = 10;
// max position
const m = 90;

function calculatePoint(p1: Node, p2: Node) {
  const φ = 1.61803398875;
  const x = p1.x + (p2.x - p1.x) / (1 + φ);
  const y = p1.y + (p2.y - p1.y) / (1 + φ);

  return new Node(`${p1.id}_${p2.id}`, x, y);
}

// Triangle vertices
const V1 = new Node("v1", i, i);
const V2 = new Node("v2", m + i, i);
const V3 = new Node("v3", m / 2 + i, m + i);
// Triangle midpoints
const V1_V2 = calculatePoint(V1, V2);
const V2_V3 = calculatePoint(V2, V3);
const V1_V3 = calculatePoint(V3, V1);
// Inner triangle vertices
const X1 = calculatePoint(V1_V2, V3);
const X2 = calculatePoint(V1_V3, V2);
const X3 = calculatePoint(V2_V3, V1);

const L1 = new Line("l1", [V1, V1_V2, V2]);
const L2 = new Line("l2", [V1, V1_V3, V3]);
const L3 = new Line("l3", [V3, V2_V3, V2]);
const L4 = new Line("l4", [V1_V2, X1, V3]);
const L5 = new Line("l5", [V1_V3, X2, V2]);
const L6 = new Line("l6", [V2_V3, X3, V1]);
const L7 = new Line("l7", [V1_V2, X3, X2]);
const L8 = new Line("l8", [V1_V3, X1, X3]);
const L9 = new Line("l9", [V2_V3, X2, X1]);

export const initialGame: Game = {
  lines: [L1, L2, L3, L4, L5, L6, L7, L8, L9],
};

export const board = new Board(initialGame);
