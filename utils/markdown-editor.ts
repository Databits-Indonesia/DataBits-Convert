export interface MarkdownEditorOptions {
    placeholder?: string;
    initialValue?: string;
}

export class MarkdownEditor {
    private container: HTMLElement;
    private textarea: HTMLTextAreaElement;
    private options: MarkdownEditorOptions;

    constructor(container: HTMLElement, options: MarkdownEditorOptions = {}) {
        this.container = container;
        this.options = options;
        this.textarea = document.createElement('textarea');
        this.initialize();
    }

    private initialize(): void {
        this.textarea.className = 'markdown-editor-textarea';
        this.textarea.placeholder = this.options.placeholder || 'Enter your markdown here...';
        this.textarea.value = this.options.initialValue || '';
        this.textarea.style.width = '100%';
        this.textarea.style.height = '400px';
        this.textarea.style.padding = '10px';
        this.textarea.style.border = '1px solid #ccc';
        this.textarea.style.borderRadius = '4px';
        this.textarea.style.fontFamily = 'monospace';
        this.textarea.style.resize = 'vertical';

        this.container.appendChild(this.textarea);
    }

    public getValue(): string {
        return this.textarea.value;
    }

    public setValue(value: string): void {
        this.textarea.value = value;
    }

    public focus(): void {
        this.textarea.focus();
    }

    public destroy(): void {
        if (this.textarea.parentNode) {
            this.textarea.parentNode.removeChild(this.textarea);
        }
    }
}