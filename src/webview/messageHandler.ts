import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import isTextFile from './content';

export function handleWebviewMessage(message: any, workspaceFolder: string, panel: any) {
    switch (message.type) {
        case 'copy':
            const textFiles = message.selectedFiles.filter((file: string) => isTextFile(file));
            handleCopyContent(textFiles, panel);
            break;
        case 'copyStructure':
            handleCopyStructure(message.selectedFiles, workspaceFolder, panel);
            break;
        case 'copyStructureWithContent':
            handleCopyStructureWithContent(message.selectedFiles, workspaceFolder, panel);
            break;
    }
}

function handleCopyContent(selectedFiles: string[], panel: any) {
    let contentToCopy = '';
    selectedFiles.forEach((filePath: string) => {
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
    selectedFiles.sort();
    const structure = createTreeStructure(selectedFiles, workspaceFolder);
    copyToClipboard(structure, 'File structure copied to clipboard!', panel);
}

function handleCopyStructureWithContent(selectedFiles: string[], workspaceFolder: string, panel: any) {
    selectedFiles.sort();
    const structureWithContent = createTreeStructureWithContent(selectedFiles, workspaceFolder, panel);
    copyToClipboard(structureWithContent, 'File structure with content copied to clipboard!', panel);
}

interface TreeNode {
    [key: string]: TreeNode | string;
}

function findCommonRootDir(files: string[]): string {
    if (files.length === 0) 
        {return '';}
    if (files.length === 1) {return path.dirname(files[0]);}

    let commonPath = path.dirname(files[0]);
    
    for (let i = 1; i < files.length; i++) {
        while (!files[i].startsWith(commonPath)) {
            commonPath = path.dirname(commonPath);
        }
    }
    
    return commonPath;
}

function getAllFilesInDirectory(dirPath: string): string[] {
    let results: string[] = [];

    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        
        // Skip node_modules and hidden files/directories
        if (item === 'node_modules' || item.startsWith('.')) {
            continue;
        }

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            results = results.concat(getAllFilesInDirectory(fullPath));
        } else {
            results.push(fullPath);
        }
    }

    return results;
}

function createTreeStructureWithContent(selectedFiles: string[], workspaceFolder: string, panel: any): string {
    const tree: TreeNode = {};
    const selectedFilesSet = new Set(selectedFiles);
    
    // Find the common root directory of selected files
    const commonRootDir = findCommonRootDir(selectedFiles);
    
    // Get all files in the common root directory
    const allFiles = getAllFilesInDirectory(commonRootDir);
    
    // Filter files to only include those under the common root
    const relevantFiles = allFiles.filter(file => file.startsWith(commonRootDir));
    
    // Process all relevant files
    relevantFiles.forEach(file => {
        const relativePath = path.relative(commonRootDir, file);
        const parts = relativePath.split(path.sep);
        let current = tree;
        
        // Navigate through the tree
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] === 'string') {
                current[part] = {};
            }
            current = current[part] as TreeNode;
        }
        
        // Add the file with its content if selected, otherwise just the name
        const fileName = parts[parts.length - 1];
        if (selectedFilesSet.has(file)) {
            try {
                if (isTextFile(file)) {
                    const content = fs.readFileSync(file, 'utf-8');
                    current[fileName] = content;
                } else {
                    current[fileName] = '[Binary File]';
                }
            } catch (error) {
                current[fileName] = '[Error reading file]';
            }
        } else {
            // For unselected files, just store the filename
            current[fileName] = '[File not selected]';
        }
    });
    
    // Add the root directory name at the beginning
    const rootTree: TreeNode = {
        [path.basename(commonRootDir)]: tree
    };
    
    // Convert tree object to string with content
    function renderTreeWithContent(node: TreeNode, prefix: string = '', isLast: boolean = true): string {
        let result = '';
        const entries = Object.entries(node);
        
        entries.forEach(([key, value], index) => {
            const isLastEntry = index === entries.length - 1;
            const connector = isLastEntry ? '└── ' : '├── ';
            const childPrefix = isLastEntry ? '    ' : '│   ';
            
            result += prefix + connector + key + '\n';
            
            if (typeof value === 'string') {
                if (value !== '[File not selected]') {
                    // Only show content for selected files
                    result += prefix + childPrefix + 'Content:\n';
                    const contentLines = value.split('\n');
                    contentLines.forEach(line => {
                        result += prefix + childPrefix + '    ' + line + '\n';
                    });
                }
            } else {
                result += renderTreeWithContent(value, prefix + childPrefix, isLastEntry);
            }
        });
        
        return result;
    }
    
    return renderTreeWithContent(rootTree);
}

function createTreeStructure(files: string[], rootPath: string): string {
    const tree: TreeNode = {};
    
    files.forEach(file => {
        const relativePath = path.relative(rootPath, file);
        const parts = relativePath.split(path.sep);
        let current = tree;
        
        parts.forEach((part, index) => {
            if (!current[part] || typeof current[part] === 'string') {
                current[part] = {};
            }
            current = current[part] as TreeNode;
        });
    });
    
    function renderTree(node: TreeNode, prefix: string = '', isLast: boolean = true): string {
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
    
    return renderTree(tree);
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