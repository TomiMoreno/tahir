"use client";

import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { Node, board } from "../lib/tree";

const Home: NextPage = () => {
  const [{ game, status, player, selectedNode, phase, lastMove }, setGame] =
    useState(() => board.getGame());

  const statusLabel = status
    .split(" ")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
  const statusTone = status.includes("wins") ? "win" : "active";
  const hasPieces = game.lines.some((line) =>
    line.nodes.some((node) => node.player)
  );
  const selectedPlayer = selectedNode?.player;
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
            <p className="eyebrow">Tahir</p>
            <h1>Juego de los camellos</h1>
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
              <span className="status-label">Selected</span>
              {selectedPlayer ? (
                <span className="selected-chip" data-player={selectedPlayer}>
                  <span className="turn-dot" data-player={selectedPlayer} />
                  Piece ready
                </span>
              ) : (
                <span className="selected-empty">None</span>
              )}
            </div>
            <div className="status-actions">
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
            {game.lines.map((line) => (
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
            ))}
          </svg>
        </section>
      </main>
    </div>
  );
};

export default Home;
