import { NotesSearch } from './search.js';

export class NotesHandler {
  private searchEngine: NotesSearch;

  constructor(notesDir: string) {
    this.searchEngine = new NotesSearch(notesDir);
  }

  async initialize(): Promise<void> {
    await this.searchEngine.loadNotes();
    console.error(`Loaded notes from directory`);
  }

  async searchNotes(query: string, limit: number = 10): Promise<any> {
    const results = this.searchEngine.searchNotes({
      query,
      limit,
      includeContent: true
    });

    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No notes found matching "${query}"`
        }]
      };
    }

    const resultsText = results.map((result, index) => {
      const note = result.note;
      return `
        ## ${index + 1}. ${note.title || note.fileName}
        **File:** ${note.fileName}
        **Relevance:** ${result.relevance.toFixed(2)}
        **Matches:** ${result.matches.join(', ')}
        **Summary:** ${result.context || 'No summary available'}
        **Last Modified:** ${note.lastModified?.toLocaleDateString()}
        ---
        `.trim();
            }).join('\n');

    return {
      content: [{
        type: 'text',
        text: `Found ${results.length} notes matching "${query}":\n\n${resultsText}`
      }]
    };
  }

  async getNoteSummary(fileName: string): Promise<any> {
    const notes = await this.searchEngine.loadNotes();
    const note = notes.find(n => n.fileName === fileName);

    if (!note) {
      return {
        content: [{
          type: 'text',
          text: `Note "${fileName}" not found.`
        }]
      };
    }

    const wordCount = note.content.split(/\s+/).length;
    const tags = note.frontMatter?.tags || [];
    const created = note.frontMatter?.date || note.lastModified;

    const summary = `
        # ${note.title || note.fileName}

        **File:** ${note.fileName}
        **Word Count:** ${wordCount}
        **Tags:** ${tags.length > 0 ? tags.join(', ') : 'None'}
        **Created:** ${created?.toLocaleDateString()}
        **Last Modified:** ${note.lastModified?.toLocaleDateString()}

        ## Content Preview:
        ${note.content.substring(0, 500)}${note.content.length > 500 ? '...' : ''}
        `.trim();

    return {
      content: [{
        type: 'text',
        text: summary
      }]
    };
  }

  async listAllNotes(): Promise<any> {
    const notes = await this.searchEngine.loadNotes();
    const stats = this.searchEngine.getNoteStats();

    if (notes.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No notes found in the directory.'
        }]
      };
    }

    const notesList = notes
      .sort((a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0))
      .map(note => {
        const wordCount = note.content.split(/\s+/).length;
        return `- ${note.title || note.fileName} (${wordCount} words, ${note.lastModified?.toLocaleDateString()})`;
      })
      .join('\n');

    const summary = `
        # Notes Summary

        **Total Notes:** ${stats.totalNotes}
        **Total Words:** ${stats.totalWords}
        **Average Words per Note:** ${stats.avgWords}
        **Last Updated:** ${stats.lastUpdated?.toLocaleDateString() || 'Never'}

        ## All Notes:
        ${notesList}
        `.trim();

    return {
      content: [{
        type: 'text',
        text: summary
      }]
    };
  }

  async getStats(): Promise<any> {
    const stats = this.searchEngine.getNoteStats();
    const notes = await this.searchEngine.loadNotes();

    const tagCounts: Record<string, number> = {};
    notes.forEach(note => {
      const tags = note.frontMatter?.tags || [];
      tags.forEach((tag: any) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const popularTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => `${tag} (${count})`)
      .join(', ');

    const statsText = `
        # Notes Statistics

        **Total Notes:** ${stats.totalNotes}
        **Total Words:** ${stats.totalWords}
        **Average Words per Note:** ${stats.avgWords}
        **Last Updated:** ${stats.lastUpdated?.toLocaleDateString() || 'Never'}

        **Popular Tags:** ${popularTags || 'No tags found'}

        **Recent Notes:**
        ${notes
        .sort((a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0))
        .slice(0, 5)
        .map(note => `- ${note.title || note.fileName} (${note.lastModified?.toLocaleDateString()})`)
        .join('\n')}
        `.trim();

    return {
      content: [{
        type: 'text',
        text: statsText
      }]
    };
  }
}