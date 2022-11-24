export async function delay(duration: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

export function generateRandomSixDigitNumber() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function getStartingPosition(maxPlayers: number) {
  const team1Pos: { xPos: number, yPos: number }[] = []
  const team2Pos: { xPos: number, yPos: number }[] = []
  const xOffset = 5
  let yOffset = 5
  for (let i = 0; i < maxPlayers / 2; i++) {
    team1Pos.push({ xPos: xOffset, yPos: yOffset })
    // FOR TEAM 2, XPOS IS THE DISTANCE TO THE LEFT STARTING FROM THE RIGHT EDGE
    team2Pos.push({ xPos: xOffset, yPos: yOffset })
    yOffset += 11
  }
  return { team1Pos, team2Pos }
}