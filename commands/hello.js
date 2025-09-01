export async function run(sock, m, from) {
  await sock.sendMessage(from, { text: "👋 Hello! I'm Lexi V5 (Optiklink edition)!" })
}
