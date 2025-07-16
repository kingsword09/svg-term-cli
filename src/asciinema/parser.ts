import { AsciinemaError, AsciinemaErrorType } from './errors';
import type { CastHeader, CastEvent, ParsedCast } from '../types';

export interface CastFileParser {
  parse(content: string): Promise<ParsedCast>;
  validate(content: string): Promise<boolean>;
  detectFormat(content: string): 'v1' | 'v2' | 'unknown';
}

export class DefaultCastFileParser implements CastFileParser {
  async parse(content: string): Promise<ParsedCast> {
    const format = this.detectFormat(content);
    
    if (format === 'unknown') {
      throw new AsciinemaError(
        AsciinemaErrorType.INVALID_CAST_FORMAT,
        'Unknown or invalid cast file format'
      );
    }

    try {
      if (format === 'v1') {
        return this.parseV1(content);
      } else {
        return this.parseV2(content);
      }
    } catch (error) {
      throw new AsciinemaError(
        AsciinemaErrorType.PARSING_FAILED,
        `Failed to parse ${format} format: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  async validate(content: string): Promise<boolean> {
    try {
      await this.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  detectFormat(content: string): 'v1' | 'v2' | 'unknown' {
    if (!content || content.trim().length === 0) {
      return 'unknown';
    }

    const lines = content.trim().split('\n');
    
    try {
      // Try to parse first line as JSON
      const firstLine = JSON.parse(lines[0]);
      
      // V2 format: first line is header object with version property
      if (typeof firstLine === 'object' && firstLine.version === 2) {
        return 'v2';
      }
      
      // V1 format: first line is array with header as first element
      if (Array.isArray(firstLine) && firstLine.length > 0 && 
          typeof firstLine[0] === 'object' && firstLine[0].version === 1) {
        return 'v1';
      }
    } catch {
      // If first line is not valid JSON, it's not a valid cast file
      return 'unknown';
    }

    return 'unknown';
  }

  private parseV1(content: string): ParsedCast {
    const data = JSON.parse(content);
    
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid v1 format: expected array with at least 2 elements');
    }

    const [headerData, ...eventData] = data;
    
    const header: CastHeader = {
      version: 1,
      width: headerData.width || 80,
      height: headerData.height || 24,
      duration: headerData.duration,
      timestamp: headerData.timestamp,
      title: headerData.title,
      command: headerData.command,
    };

    const events: CastEvent[] = eventData.map((event: any) => {
      if (!Array.isArray(event) || event.length < 3) {
        throw new Error('Invalid v1 event format');
      }
      
      return {
        time: event[0],
        type: event[1] === 'o' ? 'o' : 'i',
        data: event[2],
      };
    });

    return {
      header,
      events,
      format: 'v1',
    };
  }

  private parseV2(content: string): ParsedCast {
    const lines = content.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('Invalid v2 format: expected at least 2 lines');
    }

    // Parse header (first line)
    const headerData = JSON.parse(lines[0]);
    
    const header: CastHeader = {
      version: 2,
      width: headerData.width || 80,
      height: headerData.height || 24,
      timestamp: headerData.timestamp,
      duration: headerData.duration,
      idle_time_limit: headerData.idle_time_limit,
      command: headerData.command,
      title: headerData.title,
      env: headerData.env,
    };

    // Parse events (remaining lines)
    const events: CastEvent[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const eventData = JSON.parse(line);
        
        if (!Array.isArray(eventData) || eventData.length < 3) {
          throw new Error(`Invalid v2 event format at line ${i + 1}`);
        }
        
        events.push({
          time: eventData[0],
          type: eventData[1] === 'o' ? 'o' : 'i',
          data: eventData[2],
        });
      } catch (error) {
        throw new Error(`Failed to parse event at line ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      header,
      events,
      format: 'v2',
    };
  }
}