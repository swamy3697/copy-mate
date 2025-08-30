// src/extension.ts
import * as vscode from 'vscode';
import { createWebviewPanel } from './webview/panel';
import { createTreeStructureWithContent, getAllFilesInDirectory } from './webview/utils';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('"copy-mate" is now active!');

    // 🔹 Existing Command: Open Webview (Ctrl+Shift+P → "Copy Mate")
    const openWebview = vscode.commands.registerCommand('copy-mate', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        const workspaceFolder = workspaceFolders[0].uri.fsPath;
        createWebviewPanel(workspaceFolder);
    });

    // 🔹 New Command: Right-click → "Copy Structure and Content"
    const copyFileOrFolder = vscode.commands.registerCommand('copy-mate.copyFileOrFolder', async (uri: vscode.Uri) => {
        if (!uri) {
            vscode.window.showWarningMessage('No file or folder selected.');
            return;
        }

        try {
            const stat = await vscode.workspace.fs.stat(uri);
            let filesToCopy: string[] = [];

            if (stat.type === vscode.FileType.File) {
                // Single file
                filesToCopy = [uri.fsPath];
            } else if (stat.type === vscode.FileType.Directory) {
                // Folder: get all files inside
                filesToCopy = getAllFilesInDirectory(uri.fsPath);
                if (filesToCopy.length === 0) {
                    vscode.window.showInformationMessage('No readable files found in the folder.');
                    return;
                }
            }

            // Sort for consistent output
            filesToCopy.sort();

            // Get workspace root to calculate relative paths
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath;
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('File is not in a workspace.');
                return;
            }

            // Generate formatted output (same as webview)
            const output = createTreeStructureWithContent(filesToCopy, workspaceFolder);

            // Copy to clipboard
            await vscode.env.clipboard.writeText(output);

            // Show success message
            const name = path.basename(uri.fsPath);
            vscode.window.showInformationMessage(`📋 Copied: ${name}`);
        } catch (err: any) {
            vscode.window.showErrorMessage(`Copy failed: ${err.message}`);
        }
    });

    // 🔹 Register both commands
    context.subscriptions.push(openWebview, copyFileOrFolder);
}

export function deactivate() {}