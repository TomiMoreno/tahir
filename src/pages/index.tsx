import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { Nexo, board } from "../lib/tree";

const fillCircle = {
  1: "red",
  2: "blue",
};

const Home: NextPage = () => {
  const [{ game, status }, setGame] = useState(board.getGame());

  const onPlay = (node: Nexo) => {
    console.log(node);
    const possibleGame = board.play(node);
    if (possibleGame) {
      setGame({ game, status });
    }
  };

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <svg width="90%" height="90%">
        {game.lines.map((line, i) => (
          <g key={line.id} id={line.id}>
            <line
              x1={line.nodes[0].x}
              y1={line.nodes[0].y}
              x2={line.nodes[2].x}
              y2={line.nodes[2].y}
              stroke="black"
            ></line>
            {line.nodes.map((node) => (
              <circle
                key={node.id}
                r={10}
                cx={node.x}
                cy={node.y}
                fill={node?.player ? fillCircle[node.player] : "black"}
                onClick={() => onPlay(node)}
              ></circle>
            ))}
          </g>
        ))}
      </svg>
    </>
  );
};

export default Home;