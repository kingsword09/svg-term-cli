import { execa } from 'execa';
import os from 'node:os';
import { AsciinemaError, AsciinemaErrorType } from './errors';
import type { ClipboardOptions, ClipboardSystemInfo } from '../types';

export interface ClipboardManager {
  copy(content: string, options?: ClipboardOptions): Promise<boolean>;
  isSupported(): Promise<boolean>;
  getSystemInfo(): ClipboardSystemInfo;
}

export class DefaultClipboardManager implements ClipboardManager {
  async copy(content: string, options: ClipboardOptions = {}): Promise<boolean> {
    const systemInfo = this.getSystemInfo();
    
    if (!systemInfo.hasClipboard) {
      if (options.fallback) {
        // Could implement fallback strategies here
        return false;
      }
      
      throw new AsciinemaError(
        AsciinemaErrorType.CLIPBOARD_FAILED,
        'Clipboard operations are not supported on this system'
      );
    }

    try {
      const processedContent = this.processContent(content, options);
      await this.copyToClipboard(processedContent);
      
      if (options.notification) {
        console.log('✓ Content copied to clipboard');
      }
      
      return true;
    } catch (error) {
      throw new AsciinemaError(
        AsciinemaErrorType.CLIPBOARD_FAILED,
        `Failed to copy to clipboard: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  async isSupported(): Promise<boolean> {
    const systemInfo = this.getSystemInfo();
    return systemInfo.hasClipboard;
  }

  getSystemInfo(): ClipboardSystemInfo {
    const platform = os.platform();
    
    return {
      platform,
      hasClipboard: this.detectClipboardSupport(platform),
      supportedFormats: ['svg', 'base64', 'dataurl'],
    };
  }

  private detectClipboardSupport(platform: string): boolean {
    switch (platform) {
      case 'darwin':
        return true; // macOS has pbcopy/pbpaste
      case 'linux':
        return true; // Linux usually has xclip or xsel
      case 'win32':
        return true; // Windows has clip command
      default:
        return false;
    }
  }

  private processContent(content: string, options: ClipboardOptions): string {
    switch (options.format) {
      case 'base64':
        return Buffer.from(content).toString('base64');
      case 'dataurl':
        return `data:image/svg+xml;base64,${Buffer.from(content).toString('base64')}`;
      case 'svg':
      default:
        return content;
    }
  }

  private async copyToClipboard(content: string): Promise<void> {
    const platform = os.platform();
    
    switch (platform) {
      case 'darwin':
        await this.copyMacOS(content);
        break;
      case 'linux':
        await this.copyLinux(content);
        break;
      case 'win32':
        await this.copyWindows(content);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private async copyMacOS(content: string): Promise<void> {
    try {
      await execa('pbcopy', [], { input: content });
    } catch (error) {
      throw new Error(`macOS clipboard operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async copyLinux(content: string): Promise<void> {
    // Try xclip first, then xsel as fallback
    try {
      await execa('xclip', ['-selection', 'clipboard'], { input: content });
    } catch {
      try {
        await execa('xsel', ['--clipboard', '--input'], { input: content });
      } catch (error) {
        throw new Error(`Linux clipboard operation failed. Please install xclip or xsel: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private async copyWindows(content: string): Promise<void> {
    try {
      await execa('clip', [], { input: content });
    } catch (error) {
      throw new Error(`Windows clipboard operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}