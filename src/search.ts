import { Note, SearchResult, SearchOptions } from "./types.js"
import { globby } from "globby"
import { readFileSync, statSync } from "fs"
import matter from "gray-matter"
import path from "path"

export class NotesSearch {
    private notes: Note[] = []

    constructor(private notesDir: string){}

    async loadNotes(filePath: string): Promise<Note[]> {
        const files = await globby([
                '**/*.md',
                '**/*.txt',
                '**/*.mdx'
            ], {
        cwd: this.notesDir,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**']
        })

        this.notes = await Promise.all(files.map(async(filePath) => this.loadNote(filePath)))

        return this.notes

    }


    async loadNote(filePath: string): Promise<Note> {
        try {
            const content = readFileSync(filePath, 'utf-8')
            const stats = statSync(filePath)

            const parsed = matter(content)

            let title = parsed.data.title

            if (!title) {
                const firstLine = content.split('\n')[0];
                const headingMatch = firstLine?.match(/^#+\s+(.+)$/);
                title = headingMatch ? headingMatch[1] : path.basename(filePath, path.extname(filePath));
            }

            return {
                filePath,
                fileName: path.basename(filePath),
                content: parsed.content,
                frontMatter: parsed.data,
                title,
                lastModified: stats.mtime,
                size: stats.size
            }
        } catch (error) {
            console.error("Error loading note", error)
            throw error
        }
    }

    searchNotes(options: SearchOptions): SearchResult[] {
        const {
            query,
            limit=10,
            minRelevance=0.1,
            includeContent = false
        } = options

        const results: SearchResult[] = []

        const qLower = query.toLowerCase()
        const queryTerms = qLower.split(/\s+/).filter(term => term.length > 2);

        for(const note of this.notes){
            const matches = []
            let relevance = 0;

            if(note.title?.toLowerCase().includes(qLower)){
                relevance += 3
                matches.push(`Note Title : "${note.title}"`)
            }

            const contentLower = note.content.toLowerCase()
            if(contentLower.includes(qLower)){
                relevance += 2

                const matchIndex = contentLower.indexOf(qLower)
                if (matchIndex !== -1) {
                    const start = Math.max(0, matchIndex - 50);
                    const end = Math.min(contentLower.length, matchIndex + qLower.length + 50);
                    const context = note.content.substring(start, end).replace(/\n/g, ' ').trim();
                    matches.push(`Content: "...${context}..."`);
                }
            }

            if(note.frontMatter){
                const frontMatterStr = JSON.stringify(note.frontMatter).toLowerCase()

                if(frontMatterStr.includes(qLower)){
                    relevance += 1.5
                    matches.push("front matter")
                }
            }

            for (const term of queryTerms) {
                if (note.content.toLowerCase().includes(term)) {
                relevance += 0.5;
                }
                if (note.title?.toLowerCase().includes(term)) {
                relevance += 1;
                }
            }

             if (note.fileName.toLowerCase().includes(qLower)) {
                relevance += 2;
            }

            if (relevance >= minRelevance) {
                results.push({
                    note: note,
                    relevance: relevance,
                    matches: matches,
                    context: includeContent ? this.generateSummary(note.content) : ''
                });
            }
        }

        return results
               .sort((a, b) => b.relevance - a.relevance)
               .slice(0, limit)
    }

    private generateSummary(content: string, maxLength: number = 200): string{
        const firstParagraph = content.split('\n\n')[0] ?? '';
        if (firstParagraph.length <= maxLength) {
            return firstParagraph;
        }

        const sentences = firstParagraph.split(/[.!?]+/);
        let summary = '';
        for (const sentence of sentences) {
        if ((summary + sentence).length > maxLength) break;
            summary += sentence + '.';
        }

        return summary || firstParagraph.substring(0, maxLength) + '...';
    }

    getNoteStats() {
        const totalNotes = this.notes.length;
        const totalWords = this.notes.reduce((sum, note) => {
        return sum + note.content.split(/\s+/).length;
        }, 0);
        const avgWords = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;

        return {
            totalNotes,
            totalWords,
            avgWords,
            lastUpdated: this.notes.length > 0 
                ? new Date(Math.max(...this.notes.map(n => n.lastModified?.getTime() || 0)))
                : null
            };
    }

    getNotesByTag(tag: string): Note[] {
        return this.notes.filter(note => 
            note.frontMatter?.tags?.includes(tag) ||
            note.content.toLowerCase().includes(`#${tag}`)
        );
    }
}