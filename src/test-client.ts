import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

async function main() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ['./dist/index.js'],
    env: {
        DIR: "./notes"
    }
  })

  const client = new Client(
    { name: "LocalTestClient", version: "1.0.0" },
  )

  await client.connect(transport)

  console.log('connected to client')

  const tools = await client.listTools()
  console.log("Available tools:", tools)

  // 1. Listing all notes
  const notes = await client.callTool({
    name: "list_all_notes",
  })

  console.log(`All notes : ${JSON.stringify(notes, null, 2)}`)

  // 2. Note Summary
  // const summary = await client.callTool({
  //   name: "get_note_summary",
  //   arguments: {
  //     filename: "redis.txt"
  //   }
  // })

  // console.log(`Summary : ${JSON.stringify(summary)}`)

  // await client.close()


  // 3. Determine Notes stats
  const stats = await client.callTool({
    name: "get_notes_stats"
  })

  console.log(`Stats : ${JSON.stringify(stats, null, 2)}`)

  // 4. Querying in notes
  const query = await client.callTool({
    name: "search_notes",
    arguments: {
      "query": "database"
    }
  })

  console.log(`Query : ${JSON.stringify(query, null, 2)}`)
}

main().catch(console.error)
