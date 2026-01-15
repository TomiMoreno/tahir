"use client";

import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { getBestMove } from "../lib/ai";
import type { AiMove } from "../lib/ai";
import { Node, board } from "../lib/tree";

const AI_PLAYER = 2;
const AI_DELAYS = {
  place: 450,
  moveSelect: 320,
};
const DIFFICULTY_DEPTH = {
  easy: { placement: 3, movement: 3 },
  medium: { placement: 5, movement: 4 },
  hard: { placement: 7, movement: 6 },
} as const;
type Difficulty = keyof typeof DIFFICULTY_DEPTH;
type AiStep = "idle" | "placing" | "selecting" | "moving";

const getWinEndpoints = (nodes: [Node, Node, Node]) => {
  const [first, second, third] = nodes;
  const distanceSq = (left: Node, right: Node) => {
    const dx = left.x - right.x;
    const dy = left.y - right.y;
    return dx * dx + dy * dy;
  };
  const firstSecond = distanceSq(first, second);
  const secondThird = distanceSq(second, third);
  const firstThird = distanceSq(first, third);

  if (firstSecond >= secondThird && firstSecond >= firstThird) {
    return [first, second] as const;
  }
  if (secondThird >= firstSecond && secondThird >= firstThird) {
    return [second, third] as const;
  }
  return [first, third] as const;
};

const Home: NextPage = () => {
  const [
    {
      game,
      status,
      player,
      selectedNode,
      phase,
      lastMove,
      winningLineId,
      availableMoves,
    },
    setGame,
  ] = useState(() => board.getGame());
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [mode, setMode] = useState<"ai" | "pvp">("ai");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [aiStep, setAiStep] = useState<AiStep>("idle");
  const aiMoveRef = useRef<AiMove | null>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statusLabel = status
    .split(" ")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
  const statusTone = status.includes("wins") ? "win" : "active";
  const hasPieces = game.lines.some((line) =>
    line.nodes.some((node) => node.player)
  );
  const selectedNodeId = selectedNode?.id;
  const lastMoveToId = lastMove?.type === "move" ? lastMove.toId : undefined;
  const lastMoveFromId =
    lastMove?.type === "move" ? lastMove.fromId : undefined;
  const moveTargets = new Set(availableMoves?.map((move) => move.id));
  const aiDepth = useMemo(() => {
    return phase === "placement"
      ? DIFFICULTY_DEPTH[difficulty].placement
      : DIFFICULTY_DEPTH[difficulty].movement;
  }, [difficulty, phase]);

  const onPlay = (node: Node) => {
    const possibleGame = board.play(node);
    if (possibleGame) {
      setGame(possibleGame);
    }
  };

  const onReset = () => {
    board.clear();
    setGame(board.getGame());
  };

  useEffect(() => {
    board.clear();
    setGame(board.getGame());
  }, [mode]);

  useEffect(() => {
    if (!isRulesOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsRulesOpen(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isRulesOpen]);

  useEffect(() => {
    if (isRulesOpen) {
      return;
    }
    if (status.includes("wins")) {
      return;
    }
    if (mode !== "ai" || player !== AI_PLAYER || aiStep !== "idle") {
      return;
    }
    const move = getBestMove(game, AI_PLAYER, { maxDepth: aiDepth });
    if (!move) {
      return;
    }
    aiMoveRef.current = move;
    setAiStep(move.type === "place" ? "placing" : "selecting");
  }, [aiDepth, aiStep, game, isRulesOpen, mode, player, status]);

  useEffect(() => {
    if (mode !== "ai" || isRulesOpen || status.includes("wins")) {
      if (aiStep !== "idle") {
        setAiStep("idle");
      }
      aiMoveRef.current = null;
    }
  }, [aiStep, isRulesOpen, mode, status]);

  useEffect(() => {
    if (aiStep !== "placing") {
      return;
    }
    const move = aiMoveRef.current;
    if (!move || move.type !== "place") {
      setAiStep("idle");
      return;
    }
    aiTimeoutRef.current = setTimeout(() => {
      const node = board.getNexoById(move.toId);
      if (node) {
        const possibleGame = board.play(node);
        if (possibleGame) {
          setGame(possibleGame);
        }
      }
      aiMoveRef.current = null;
      setAiStep("idle");
    }, AI_DELAYS.place);
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  }, [aiStep]);

  useEffect(() => {
    if (aiStep !== "selecting") {
      return;
    }
    const move = aiMoveRef.current;
    if (!move || move.type !== "move") {
      setAiStep("idle");
      return;
    }
    const fromNode = board.getNexoById(move.fromId);
    if (!fromNode) {
      aiMoveRef.current = null;
      setAiStep("idle");
      return;
    }
    const possibleGame = board.play(fromNode);
    if (possibleGame) {
      setGame(possibleGame);
    }
    aiTimeoutRef.current = setTimeout(() => {
      setAiStep("moving");
    }, AI_DELAYS.moveSelect);
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  }, [aiStep]);

  useEffect(() => {
    if (aiStep !== "moving") {
      return;
    }
    const move = aiMoveRef.current;
    if (!move || move.type !== "move") {
      setAiStep("idle");
      return;
    }
    const toNode = board.getNexoById(move.toId);
    if (!toNode) {
      aiMoveRef.current = null;
      setAiStep("idle");
      return;
    }
    const possibleGame = board.play(toNode);
    if (possibleGame) {
      setGame(possibleGame);
    }
    aiMoveRef.current = null;
    setAiStep("idle");
  }, [aiStep]);

  return (
    <div className="page">
      <Head>
        <title>Tahir - Juego de los camellos</title>
        <meta
          name="description"
          content="A golden-ratio alignment game. Place three pieces in a line to win."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="layout">
        <section className="panel">
          <header className="title-block">
            <p className="eyebrow">Three in a row</p>
            <h1>Tahir</h1>
            <p className="subtitle">
              A golden-ratio alignment game. Place three pieces in a line to
              win, then slide along the connections to reposition.
            </p>
          </header>
          <div className="status-card">
            <div className="status-row">
              <span className="status-label">Status</span>
              <span className="status-pill" data-tone={statusTone}>
                {statusLabel}
              </span>
            </div>
            {player ? (
              <div className="status-row">
                <span className="status-label">Turn</span>
                <span className="turn-chip" data-player={player}>
                  <span className="turn-dot" data-player={player} />
                  Player {player}
                </span>
              </div>
            ) : null}
            <div className="status-row">
              <span className="status-label">Mode</span>
              <div className="segmented">
                <button
                  className="segmented-button"
                  type="button"
                  data-active={mode === "pvp"}
                  onClick={() => setMode("pvp")}
                >
                  Player vs Player
                </button>
                <button
                  className="segmented-button"
                  type="button"
                  data-active={mode === "ai"}
                  onClick={() => setMode("ai")}
                >
                  Vs AI (Player 2)
                </button>
              </div>
            </div>
            {mode === "ai" ? (
              <div className="status-row">
                <span className="status-label">Difficulty</span>
                <div className="segmented">
                  <button
                    className="segmented-button"
                    type="button"
                    data-active={difficulty === "easy"}
                    onClick={() => setDifficulty("easy")}
                  >
                    Easy
                  </button>
                  <button
                    className="segmented-button"
                    type="button"
                    data-active={difficulty === "medium"}
                    onClick={() => setDifficulty("medium")}
                  >
                    Medium
                  </button>
                  <button
                    className="segmented-button"
                    type="button"
                    data-active={difficulty === "hard"}
                    onClick={() => setDifficulty("hard")}
                  >
                    Hard
                  </button>
                </div>
              </div>
            ) : null}
            <div className="status-actions">
              <button
                className="rules-button"
                type="button"
                onClick={() => setIsRulesOpen(true)}
              >
                Rules
              </button>
              <button
                className="reset-button"
                type="button"
                onClick={onReset}
                disabled={!hasPieces}
              >
                Reset board
              </button>
            </div>
          </div>
        </section>
        <section className="board-card">
          <svg
            className="board"
            viewBox="0 0 110 110"
            role="img"
            aria-label="Tahir game board"
            data-turn={player ?? 0}
            data-phase={phase}
            data-selection={Boolean(selectedNodeId)}
          >
            <title>Tahir board</title>
            {game.lines.map((line) => {
              const isWinningLine = winningLineId === line.id;
              const winningPlayer = isWinningLine
                ? line.nodes[0].player
                : undefined;
              const [winStart, winEnd] = isWinningLine
                ? getWinEndpoints(line.nodes)
                : [line.nodes[0], line.nodes[2]];
              return (
                <g key={line.id} id={line.id}>
                  <line
                    className="board-line"
                    x1={line.nodes[0].x}
                    y1={line.nodes[0].y}
                    x2={line.nodes[1].x}
                    y2={line.nodes[1].y}
                  />
                  <line
                    className="board-line"
                    x1={line.nodes[1].x}
                    y1={line.nodes[1].y}
                    x2={line.nodes[2].x}
                    y2={line.nodes[2].y}
                  />
                  {isWinningLine ? (
                    <line
                      className="win-line"
                      x1={winStart.x}
                      y1={winStart.y}
                      x2={winEnd.x}
                      y2={winEnd.y}
                      pathLength={1}
                      data-win-player={winningPlayer ?? 0}
                    />
                  ) : null}
                  {line.nodes.map((node) => (
                    <circle
                      key={node.id}
                      className="node"
                      r={2.2}
                      cx={node.x}
                      cy={node.y}
                      onClick={() => onPlay(node)}
                      id={node.id}
                      data-player={node.player ?? 0}
                      data-selected={selectedNodeId === node.id}
                      data-move-target={
                        moveTargets.has(node.id) ? "true" : undefined
                      }
                      data-move={
                        lastMoveToId === node.id
                          ? "to"
                          : lastMoveFromId === node.id
                          ? "from"
                          : undefined
                      }
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        </section>
      </main>
      {isRulesOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsRulesOpen(false);
            }
          }}
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-title"
          >
            <header className="modal-header">
              <h2 id="rules-title" className="modal-title">
                How to play
              </h2>
              <button
                className="modal-close"
                type="button"
                aria-label="Close rules"
                onClick={() => setIsRulesOpen(false)}
              >
                Close
              </button>
            </header>
            <div className="modal-body">
              <p>
                Tahir is an alignment game. Each player has three pieces and
                aims to make a straight line.
              </p>
              <ul>
                <li>Phase 1: take turns placing pieces on empty nodes.</li>
                <li>
                  Phase 2: select one of your pieces, then move it to an empty
                  node.
                </li>
                <li>A line of three pieces wins the game.</li>
                <li>Variant: play with three pieces per player.</li>
              </ul>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default Home;
