import * as path from "node:path";
import { type SKRSContext2D, createCanvas, loadImage } from "@napi-rs/canvas";

export type Rank = {
  name: string;
  value: number;
};

export type Card = {
  suit: string;
  rank: Rank;
  image: string;
};

type GenerateBoardOptions = {
  playerHand: Card[];
  playerName: string;
  dealerHand: Card[];
  playerImage: string;
  dealerImage: string;
  finishedText?: string;
};

const suits = ["spades", "hearts", "diamonds", "clubs"];
const ranks = [
  { name: "ace", value: 1 },
  { name: "2", value: 2 },
  { name: "3", value: 3 },
  { name: "4", value: 4 },
  { name: "5", value: 5 },
  { name: "6", value: 6 },
  { name: "7", value: 7 },
  { name: "8", value: 8 },
  { name: "9", value: 9 },
  { name: "10", value: 10 },
  { name: "jack", value: 10 },
  { name: "queen", value: 10 },
  { name: "king", value: 10 }
] as Rank[];

export async function generateBoard({
  playerHand,
  playerName,
  dealerHand,
  playerImage,
  dealerImage,
  finishedText
}: GenerateBoardOptions) {
  const canvas = createCanvas(616, 360);
  const context = canvas.getContext("2d");

  const boardImage = await loadImage(
    path.join(
      __dirname,
      "..",
      "..",
      "assets",
      "images",
      "blackjack",
      "board.png"
    )
  );
  context.drawImage(boardImage, 0, 0, canvas.width, canvas.height);

  context.fillStyle = "#282828";
  context.fillRect(44, 44, 100, 140);

  context.fillStyle = "#282828";
  context.fillRect(472, 174, 100, 140);

  const dealerImageCanvas = await loadImage(dealerImage);
  context.drawImage(dealerImageCanvas, 44, 44, 100, 100);

  const playerAvatar = await loadImage(playerImage);
  context.drawImage(playerAvatar, 472, 214, 100, 100);

  await drawCards(context, dealerHand, 152, 44, 1);
  await drawCards(context, playerHand, 396, 214, -1);

  context.font = "bold 24px Poppins";
  context.fillStyle = "#FFFFFF";
  const playerNameWidth = context.measureText(playerName).width;
  const dealerNameWidth = context.measureText("Dealer").width;
  context.fillText(
    playerName,
    (context.canvas.width - playerNameWidth) / 2,
    344
  );
  context.fillText("Dealer", (context.canvas.width - dealerNameWidth) / 2, 30);

  writeHandValue(context, dealerHand, [44, 144], [144, 184]);
  writeHandValue(context, playerHand, [472, 174], [572, 214]);

  if (finishedText) {
    drawOverlay(context, finishedText);
  }

  return canvas.toBuffer("image/png");
}

async function drawCards(
  context: SKRSContext2D,
  hand: Card[],
  startX: number,
  startY: number,
  direction: number
) {
  const cardWidth = 72;
  const maxCards = hand.length;
  const availableWidth = cardWidth * maxCards;

  const spacing = Math.min(cardWidth, availableWidth / maxCards);

  for (const card of hand) {
    const cardImage = await loadImage(
      path.join(
        __dirname,
        "..",
        "..",
        "assets",
        "images",
        "blackjack",
        "cards",
        card.image
      )
    );
    context.drawImage(cardImage, startX, startY);

    // biome-ignore lint/style/noParameterAssign: <explanation>
    startX += direction * spacing;
  }
}

function writeHandValue(
  context: SKRSContext2D,
  hand: Card[],
  startCoords: number[],
  endCoords: number[]
) {
  const handValue = hand.reduce((acc, card) => acc + card.rank.value, 0);
  const hasAce = hand.some(card => card.rank.name === "ace");

  const displayValue =
    hasAce && handValue + 10 <= 21
      ? handValue + 10 === 21
        ? `${handValue + 10}`
        : `${handValue} / ${handValue + 10}`
      : `${handValue}`;

  context.fillStyle = "#ffffff";
  context.font = "bold 26px Poppins";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    displayValue,
    (startCoords[0] + endCoords[0]) / 2,
    (startCoords[1] + endCoords[1]) / 2
  );
}

function drawOverlay(context: SKRSContext2D, finishedText: string) {
  context.fillStyle = "rgba(0, 0, 0, 0.7)";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  context.fillStyle = "#ffffff";
  context.font = "bold 40px Poppins";

  const finishedTextLines = finishedText.split("\n");

  const lineHeight = 40;
  const totalHeight = finishedTextLines.length * lineHeight;
  const startY = (context.canvas.height - totalHeight) / 2 + lineHeight / 2;

  for (let i = 0; i < finishedTextLines.length; i++) {
    const line = finishedTextLines[i];

    context.fillText(line, context.canvas.width / 2, startY + lineHeight * i);
  }
}

export function calculateHandValue(hand: Card[]) {
  let totalValue = hand.reduce((acc, card) => acc + card.rank.value, 0);
  let aceCount = hand.filter(card => card.rank.name === "ace").length;

  while (aceCount > 0 && totalValue + 10 <= 21) {
    totalValue += 10;
    aceCount--;
  }

  return totalValue;
}

export function generateDeck() {
  const deck: Card[] = [];

  for (let i = 0; i < 3; i++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank, image: `${rank.name}_of_${suit}.png` });
      }
    }
  }

  shuffleDeck(deck);

  return deck;
}

function shuffleDeck(deck: Card[]) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}
