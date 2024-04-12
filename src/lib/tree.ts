type Player = 1 | 2 | undefined;

export type Game = {
  lines: Line[];
};

class Board {
  private game: Game;
  public player: Player = 1;
  private currentNode?: Node;
  private numberOfBalls = 0;
  private nodes = new Map<string, Node & { neighbors: Node[] }>();

  constructor(game: Game) {
    this.game = game;
  }

  start() {
    console.log("Iniciando juego");
  }

  play(from: Node) {
    if (!this.isNexoAvailable(from)) {
      return;
    }
    if (this.numberOfBalls < 6) {
      from.player = this.player;
      this.numberOfBalls++;
    } else if (this.currentNode) {
      this.currentNode.player = undefined;
      from.player = this.player;
    } else {
      this.currentNode = from;
    }
    this.player = this.player === 1 ? 2 : 1;
    return this.getGame();
  }

  clear() {
    this.currentNode = undefined;
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
    for (const line of this.game.lines) {
      for (const node of line.nodes) {
        if (node.id === nexo.id) {
          return node.player === undefined;
        }
      }
    }
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
    for (const line of this.game.lines) {
      const playerOfLine = line.nodes[0].player;
      if (!playerOfLine) continue;
      console.log(line.nodes.map((node) => node.player));
      if (line.nodes.every((node) => node.player === playerOfLine)) {
        return `player ${playerOfLine} wins`;
      }
    }
    return "playing";
  }

  getGame() {
    return {
      game: this.game,
      status: this.checkStatus(),
      player: this.player,
    };
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
const L2 = new Line("l2", [V1, V3, V1_V3]);
const L3 = new Line("l3", [V3, V2_V3, V2]);
const L4 = new Line("l4", [V1_V2, X1, V3]);
const L5 = new Line("l5", [V1_V3, X2, V2]);
const L6 = new Line("l6", [V2_V3, X3, V1]);
const L7 = new Line("l7", [V1_V2, X2, X3]);
const L8 = new Line("l8", [V1_V3, X1, X3]);
const L9 = new Line("l9", [V2_V3, X1, X2]);

export const initialGame: Game = {
  lines: [L1, L2, L3, L4, L5, L6, L7, L8, L9],
};

export const board = new Board(initialGame);
