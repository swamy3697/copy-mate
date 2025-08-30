// src/webview/messageHandler.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { isTextFile } from './utils';
import { createTreeStructureWithContent } from './utils';

export function handleWebviewMessage(message: any, workspaceFolder: string, panel: any) {
    switch (message.type) {
        case 'copy':
            handleCopyContent(message.selectedFiles, panel);
            break;
        case 'copyStructure':
            handleCopyStructure(message.selectedFiles, workspaceFolder, panel);
            break;
        case 'copyStructureWithContent':
            const output = createTreeStructureWithContent(message.selectedFiles, workspaceFolder);
            copyToClipboard(output, 'File structure with content copied to clipboard!', panel);
            break;
    }
}

function handleCopyContent(selectedFiles: string[], panel: any) {
    let contentToCopy = '';
    const textFiles = selectedFiles.filter((file: string) => isTextFile(file));

    textFiles.forEach((filePath: string) => {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            contentToCopy += `File Path: ${filePath}\nContent:\n${fileContent}\n\n`;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to read file: ${filePath}`);
        }
    });

    copyToClipboard(contentToCopy, 'File content copied to clipboard!', panel);
}

function handleCopyStructure(selectedFiles: string[], workspaceFolder: string, panel: any) {
    const tree: { [key: string]: any } = {};

    selectedFiles.sort();
    selectedFiles.forEach(file => {
        const relativePath = path.relative(workspaceFolder, file);
        const parts = relativePath.split(path.sep);
        let current = tree;
        parts.forEach(part => {
            if (!current[part]) current[part] = {};
            current = current[part];
        });
    });

    function renderTree(node: any, prefix: string = '', isLast: boolean = true): string {
        let result = '';
        const entries = Object.entries(node);
        entries.forEach(([key, value], index) => {
            const isLastEntry = index === entries.length - 1;
            const connector = isLastEntry ? '└── ' : '├── ';
            const childPrefix = isLastEntry ? '    ' : '│   ';
            result += prefix + connector + key + '\n';
            if (typeof value === 'object') {
                result += renderTree(value, prefix + childPrefix, isLastEntry);
            }
        });
        return result;
    }

    const output = renderTree(tree);
    copyToClipboard(output, 'File structure copied to clipboard!', panel);
}

function copyToClipboard(content: string, successMessage: string, panel: any) {
    vscode.env.clipboard.writeText(content).then(
        () => {
            vscode.window.showInformationMessage(successMessage);
            panel.webview.postMessage({ type: 'copySuccess' });
        },
        () => vscode.window.showErrorMessage('Failed to copy to clipboard.')
    );
}