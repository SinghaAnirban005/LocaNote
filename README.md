# LocaNotes

An MCP (Model Context Protocol) server that allows AI assistants to search and analyze your local notes directory.

## Features

- **Full-text search** across all your notes
- **Note statistics** and summaries
- **Content preview** and context extraction
- **Fast and efficient** file scanning

## Installation

1. Clone the project
```bash
git clone https://github.com/SinghaAnirban005/LocaNote.git
```

2. Install dependencies
```bash
pnpm install
```

3. Build the project
```bash
pnpm build:MCP
```

4. Set the environment variable for your notes directory
```bash
export DIR="/path/to/your/notes"
```

5. Start the MCP server
```bash
pnpm start:MCP
```

6. To test the server
```bash
pnpm start:client
```