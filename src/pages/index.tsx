"use client";

import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import { Node, board } from "../lib/tree";

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
    { game, status, player, selectedNode, phase, lastMove, winningLineId },
    setGame,
  ] = useState(() => board.getGame());
  const [isRulesOpen, setIsRulesOpen] = useState(false);

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
