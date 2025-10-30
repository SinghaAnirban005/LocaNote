#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import dotenv from "dotenv"
import { NotesHandler } from "./notes-handler.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"

dotenv.config()

class NotesServer {
    private server: Server
    private notesHandler: NotesHandler

    constructor() {
        this.server = new Server(
            {
                name: 'LocaNote',
                version: '1.0.0'
            },
            {
                capabilities: {
                    tools: {},
                    resources: {}
                }
            }
        )

        const notesDir = process.env.DIR || ""
        this.notesHandler = new NotesHandler(notesDir)


        this.setupHandler()
        this.initialize()
    }

    private setupHandler() {
        this.server.setRequestHandler(ListToolsRequestSchema, async() => (
            {
                tools: [
                        {
                        name: 'search_notes',
                        description: 'Search through markdown notes for specific content, concepts, or topics',
                        inputSchema: {
                            type: 'object',
                            properties: {
                            query: {
                                type: 'string',
                                description: 'Search query - can be keywords, phrases, or concepts'
                            },
                            limit: {
                                type: 'number',
                                description: 'Maximum number of results to return (default: 10)',
                                default: 10
                            }
                            },
                            required: ['query']
                        }
                        },
                        {
                        name: 'get_note_summary',
                        description: 'Get detailed summary and content of a specific note by filename',
                        inputSchema: {
                            type: 'object',
                            properties: {
                            filename: {
                                type: 'string',
                                description: 'Name of the note file (e.g., "react-notes.md")'
                            }
                            },
                            required: ['filename']
                        }
                        },
                        {
                        name: 'list_all_notes',
                        description: 'List all available notes with basic information',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                        },
                        {
                        name: 'get_notes_stats',
                        description: 'Get statistics about your notes collection',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                        }
                ]
            }
        ))

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            switch (request.params.name) {
                case 'search_notes':
                return await this.notesHandler.searchNotes(
                    request?.params?.arguments?.query as string,
                    request?.params?.arguments?.limit as number
                );

                case 'get_note_summary':
                return await this.notesHandler.getNoteSummary(
                    request?.params?.arguments?.filename as string
                );

                case 'list_all_notes':
                return await this.notesHandler.listAllNotes();

                case 'get_notes_stats':
                return await this.notesHandler.getStats();

                default:
                throw new Error(
                    `Unknown tool: ${request.params.name}`
                )
            }
        });

        this.server.onerror = (error) => {
            console.error('MCP Error', error);
        };

        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    
    private async initialize() {
        try {
        await this.notesHandler.initialize();
        console.error('MCP server initialized');
        } catch (error) {
        console.error('Failed to initialize notes handler:', error);
        }
    }

    async run() {
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        console.error("MCP Server running")
    }
}

const server = new NotesServer()
server.run().catch(console.error)