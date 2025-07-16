import fs from 'node:fs/promises';
import path from 'node:path';
import { AsciinemaError, AsciinemaErrorType } from './errors';
import type { BatchOptions, BatchResult } from '../types';

export interface BatchProcessor {
  process(options: BatchOptions): Promise<BatchResult>;
  findCastFiles(dir: string, pattern?: string): Promise<string[]>;
}

export class DefaultBatchProcessor implements BatchProcessor {
  async process(options: BatchOptions): Promise<BatchResult> {
    const result: BatchResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Find all cast files
      const files = await this.findCastFiles(options.inputDir, options.pattern);
      result.processed = files.length;

      if (files.length === 0) {
        return result;
      }

      // Process files with controlled parallelism
      const parallel = Math.min(options.parallel || 4, files.length);
      const chunks = this.chunkArray(files, Math.ceil(files.length / parallel));

      const promises = chunks.map(chunk => 
        this.processChunk(chunk, options, result)
      );

      await Promise.all(promises);
    } catch (error) {
      throw new AsciinemaError(
        AsciinemaErrorType.BATCH_PROCESSING_FAILED,
        `Batch processing failed: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }

    return result;
  }

  async findCastFiles(dir: string, pattern?: string): Promise<string[]> {
    try {
      const searchPattern = pattern || '*.cast';
      
      // Use fs.glob (Node.js 20+) or fallback to manual directory traversal
      if (fs.glob) {
        const files = [];
        const globPattern = path.join(dir, searchPattern);
        
        for await (const file of fs.glob(globPattern)) {
          const fullPath = path.resolve(file);
          const stat = await fs.stat(fullPath);
          if (stat.isFile()) {
            files.push(fullPath);
          }
        }
        
        return files;
      } else {
        // Fallback for older Node.js versions
        return await this.findCastFilesRecursive(dir, searchPattern);
      }
    } catch (error) {
      throw new AsciinemaError(
        AsciinemaErrorType.BATCH_PROCESSING_FAILED,
        `Failed to find cast files: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  private async findCastFilesRecursive(dir: string, pattern: string): Promise<string[]> {
    const files: string[] = [];
    
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await this.findCastFilesRecursive(fullPath, pattern);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.cast')) {
        files.push(path.resolve(fullPath));
      }
    }
    
    return files;
  }

  private async processChunk(
    files: string[], 
    options: BatchOptions, 
    result: BatchResult
  ): Promise<void> {
    for (const file of files) {
      try {
        await this.processFile(file, options);
        result.succeeded++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          file,
          error: error instanceof Error ? error.message : String(error),
        });

        if (!options.skipErrors) {
          throw error;
        }
      }
    }
  }

  private async processFile(file: string, options: BatchOptions): Promise<void> {
    // This is a placeholder for the actual file processing logic
    // In the real implementation, this would:
    // 1. Read the cast file
    // 2. Parse it using CastFileParser
    // 3. Convert it to SVG using the existing render function
    // 4. Save the SVG to the output directory
    
    const fileName = path.basename(file, '.cast');
    const outputDir = options.outputDir || path.dirname(file);
    const outputFile = path.join(outputDir, `${fileName}.svg`);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // For now, just create a placeholder file
    // TODO: Implement actual conversion logic in later tasks
    await fs.writeFile(outputFile, `<!-- Placeholder SVG for ${file} -->`);
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}