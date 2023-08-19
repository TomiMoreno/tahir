type Player = 1 | 2 | undefined;

export type Nexo = {
  id: string;
  x: number;
  y: number;
  player?: Player;
};

type Line = {
  nodes: [Nexo, Nexo, Nexo];
  id: string;
};

export type Game = {
  lines: Linea[];
};

class Board {
  private game: Game;
  private player: Player = 1;
  private currentNode?: Nexo;
  private numberOfBalls = 0;
  private nodes = new Map<string, Nexo & { neighbors: Nexo[] }>();

  constructor(game: Game) {
    this.game = game;
  }

  start() {
    console.log("Iniciando juego");
  }

  play(from: Nexo) {
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

  isNexoAvailable(nexo: Nexo) {
    for (const line of this.game.lines) {
      for (const node of line.nodes) {
        if (node.id === nexo.id) {
          return node.player === undefined;
        }
      }
    }
  }

  getNeighbours(nexo: Nexo) {
    const neighbours: Nexo[] = [];
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
    };
  }
}

class Nodo {
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

class Linea {
  constructor(public id: string, public nodes: [Nodo, Nodo, Nodo]) {
    this.id = id;
    this.nodes = nodes;
  }

  isLine = () => {
    return this.nodes.every((node) => node.getPlayer() !== undefined);
  };
}

const N1 = new Nodo("n1", 10, 10);
const N2 = new Nodo("n2", 60, 10);
const N3 = new Nodo("n3", 110, 10);
const N4 = new Nodo("n4", 60, 110);
const N5 = new Nodo("n5", 30, 50);
const N6 = new Nodo("n6", 90, 50);
const N7 = new Nodo("n7", 30, 90);
const N8 = new Nodo("n8", 90, 90);
const N9 = new Nodo("n9", 10, 90);

const L1 = new Linea("l1", [N1, N2, N3]);
const L2 = new Linea("l2", [N1, N4, N5]);
const L3 = new Linea("l3", [N4, N6, N3]);
const L4 = new Linea("l4", [N5, N7, N8]);
const L5 = new Linea("l5", [N6, N8, N9]);
const L6 = new Linea("l6", [N7, N9, N2]);

export const initialGame: Game = {
  lines: [L1, L2, L3, L4, L5, L6],
};

export const board = new Board(initialGame);
