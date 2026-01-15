import type { Game } from "./tree";

export type AiMove =
  | { type: "place"; toId: string }
  | { type: "move"; fromId: string; toId: string };

type PlayerId = 1 | 2;
type MovePhase = "placement" | "movement";
type NodeState = Record<string, 0 | PlayerId>;
type AiState = {
  nodes: NodeState;
  player: PlayerId;
  phase: MovePhase;
  placedCount: number;
};
type AiContext = {
  nodeIds: string[];
  nodeOrder: string[];
  adjacency: Map<string, Set<string>>;
  lines: [string, string, string][];
};
type AiOptions = {
  maxDepth?: number;
};

const MAX_BALLS = 6;

const getOpponent = (player: PlayerId): PlayerId => (player === 1 ? 2 : 1);

const buildContext = (game: Game): AiContext => {
  const nodeMap = new Map<string, boolean>();
  const adjacency = new Map<string, Set<string>>();
  const lines: [string, string, string][] = game.lines.map((line) => [
    line.nodes[0].id,
    line.nodes[1].id,
    line.nodes[2].id,
  ]);

  const addEdge = (fromId: string, toId: string) => {
    const neighbours = adjacency.get(fromId) ?? new Set<string>();
    neighbours.add(toId);
    adjacency.set(fromId, neighbours);
  };

  for (const line of game.lines) {
    const [first, second, third] = line.nodes;
    nodeMap.set(first.id, true);
    nodeMap.set(second.id, true);
    nodeMap.set(third.id, true);
    addEdge(first.id, second.id);
    addEdge(second.id, first.id);
    addEdge(second.id, third.id);
    addEdge(third.id, second.id);
  }

  const nodeIds = Array.from(nodeMap.keys());
  return {
    nodeIds,
    nodeOrder: [...nodeIds].sort(),
    adjacency,
    lines,
  };
};

const buildState = (
  game: Game,
  player: PlayerId,
  context: AiContext
): AiState => {
  const nodes: NodeState = {};
  for (const id of context.nodeIds) {
    nodes[id] = 0;
  }
  for (const line of game.lines) {
    for (const node of line.nodes) {
      nodes[node.id] = node.player ?? 0;
    }
  }
  const placedCount = Object.values(nodes).filter(Boolean).length;
  return {
    nodes,
    player,
    phase: placedCount < MAX_BALLS ? "placement" : "movement",
    placedCount,
  };
};

const getWinner = (
  state: AiState,
  lines: [string, string, string][]
): PlayerId | 0 => {
  for (const line of lines) {
    const first = state.nodes[line[0]];
    if (!first) {
      continue;
    }
    if (line.every((id) => state.nodes[id] === first)) {
      return first;
    }
  }
  return 0;
};

const getLegalMoves = (state: AiState, context: AiContext): AiMove[] => {
  const moves: AiMove[] = [];
  if (state.phase === "placement") {
    for (const id of context.nodeIds) {
      if (!state.nodes[id]) {
        moves.push({ type: "place", toId: id });
      }
    }
    return moves;
  }

  for (const id of context.nodeIds) {
    if (state.nodes[id] !== state.player) {
      continue;
    }
    const neighbours = context.adjacency.get(id);
    if (!neighbours) {
      continue;
    }
    neighbours.forEach((neighbourId) => {
      if (!state.nodes[neighbourId]) {
        moves.push({ type: "move", fromId: id, toId: neighbourId });
      }
    });
  }

  return moves;
};

const applyMove = (state: AiState, move: AiMove): AiState => {
  const nodes: NodeState = { ...state.nodes };
  let placedCount = state.placedCount;
  if (move.type === "place") {
    nodes[move.toId] = state.player;
    placedCount += 1;
  } else {
    nodes[move.fromId] = 0;
    nodes[move.toId] = state.player;
  }
  const phase: MovePhase =
    state.phase === "placement" && placedCount >= MAX_BALLS
      ? "movement"
      : state.phase;
  return {
    nodes,
    player: getOpponent(state.player),
    phase,
    placedCount,
  };
};

const countMovesForPlayer = (
  state: AiState,
  context: AiContext,
  player: PlayerId
): number => {
  if (state.phase === "placement") {
    return context.nodeIds.filter((id) => !state.nodes[id]).length;
  }
  let count = 0;
  for (const id of context.nodeIds) {
    if (state.nodes[id] !== player) {
      continue;
    }
    const neighbours = context.adjacency.get(id);
    if (!neighbours) {
      continue;
    }
    neighbours.forEach((neighbourId) => {
      if (!state.nodes[neighbourId]) {
        count += 1;
      }
    });
  }
  return count;
};

const evaluateState = (
  state: AiState,
  aiPlayer: PlayerId,
  context: AiContext,
  depth: number
): number => {
  const winner = getWinner(state, context.lines);
  if (winner === aiPlayer) {
    return 100 - depth;
  }
  if (winner === getOpponent(aiPlayer)) {
    return -100 + depth;
  }

  let score = 0;
  for (const line of context.lines) {
    let aiCount = 0;
    let opponentCount = 0;
    for (const id of line) {
      if (state.nodes[id] === aiPlayer) {
        aiCount += 1;
      } else if (state.nodes[id] === getOpponent(aiPlayer)) {
        opponentCount += 1;
      }
    }
    if (aiCount > 0 && opponentCount === 0) {
      score += aiCount === 2 ? 4 : 1;
    } else if (opponentCount > 0 && aiCount === 0) {
      score -= opponentCount === 2 ? 4 : 1;
    }
  }

  if (state.phase === "movement") {
    const mobility =
      countMovesForPlayer(state, context, aiPlayer) -
      countMovesForPlayer(state, context, getOpponent(aiPlayer));
    score += mobility * 0.2;
  }

  return score;
};

const serializeState = (state: AiState, nodeOrder: string[]): string => {
  const nodeSignature = nodeOrder
    .map((id) => state.nodes[id])
    .join("");
  return `${state.player}|${state.phase}|${state.placedCount}|${nodeSignature}`;
};

const minimax = (
  state: AiState,
  depth: number,
  aiPlayer: PlayerId,
  context: AiContext,
  alpha: number,
  beta: number,
  memo: Map<string, number>
): { score: number; move?: AiMove } => {
  const winner = getWinner(state, context.lines);
  const moves = winner ? [] : getLegalMoves(state, context);
  if (winner || depth === 0 || moves.length === 0) {
    return { score: evaluateState(state, aiPlayer, context, depth) };
  }

  const memoKey = `${depth}|${serializeState(state, context.nodeOrder)}`;
  const cachedScore = memo.get(memoKey);
  if (cachedScore !== undefined) {
    return { score: cachedScore };
  }

  const isMaximizing = state.player === aiPlayer;
  let bestScore = isMaximizing ? -Infinity : Infinity;
  let bestMove: AiMove | undefined;

  for (const move of moves) {
    const nextState = applyMove(state, move);
    const result = minimax(
      nextState,
      depth - 1,
      aiPlayer,
      context,
      alpha,
      beta,
      memo
    );
    if (isMaximizing) {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, bestScore);
    }
    if (beta <= alpha) {
      break;
    }
  }

  memo.set(memoKey, bestScore);
  return { score: bestScore, move: bestMove };
};

export const getBestMove = (
  game: Game,
  aiPlayer: PlayerId,
  options: AiOptions = {}
): AiMove | null => {
  const context = buildContext(game);
  const state = buildState(game, aiPlayer, context);
  if (getWinner(state, context.lines)) {
    return null;
  }
  const maxDepth =
    options.maxDepth ??
    (state.phase === "placement" ? 6 : 4);
  const memo = new Map<string, number>();
  const { move } = minimax(
    state,
    maxDepth,
    aiPlayer,
    context,
    -Infinity,
    Infinity,
    memo
  );
  return move ?? null;
};
