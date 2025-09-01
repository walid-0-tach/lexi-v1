import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import qrcode from "qrcode-terminal"
import fs from "fs-extra"
import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0]
    if (!m.message) return
    const from = m.key.remoteJid
    const type = Object.keys(m.message)[0]
    const body =
      type === "conversation"
        ? m.message.conversation
        : m.message.extendedTextMessage?.text || ""
    if (!body.startsWith(config.prefix)) return

    const command = body.slice(1).trim().split(" ")[0].toLowerCase()

    // Load commands dynamically
    const commandFile = path.join(__dirname, "commands", `${command}.js`)
    if (fs.existsSync(commandFile)) {
      const { run } = await import(`./commands/${command}.js`)
      await run(sock, m, from)
    } else {
      await sock.sendMessage(from, { text: `❌ Unknown command: ${command}` })
    }
  })
}

startBot()
