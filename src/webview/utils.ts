// src/webview/utils.ts
import * as fs from 'fs';
import * as path from 'path';

export function isTextFile(filePath: string): boolean {
    const textExtensions = [
        '.txt', '.js', '.jsx', '.ts', '.tsx', '.md', '.json', '.css', '.scss',
        '.html', '.htm', '.xml', '.yaml', '.yml', '.ini', '.conf', '.sh',
        '.bash', '.py', '.java', '.rb', '.php', '.c', '.cpp', '.h', '.hpp',
        '.cs', '.go', '.rs', '.swift', '.kt', '.kts', '.dart', '.vue',
        '.graphql', '.sql', '.env', '.toml', '.properties', '.gradle',
        '.gitignore', '.dockerignore', '.editorconfig', '.eslintrc',
        '.prettierrc', '.babelrc'
    ];
    const ext = path.extname(filePath).toLowerCase();
    return textExtensions.includes(ext);
}

export function getAllFilesInDirectory(dirPath: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dirPath)) return results;

    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        if (item === 'node_modules' || item.startsWith('.')) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            results = results.concat(getAllFilesInDirectory(fullPath));
        } else {
            results.push(fullPath);
        }
    }
    return results;
}

interface TreeNode {
    [key: string]: TreeNode | string;
}

export function createTreeStructureWithContent(files: string[], rootPath: string): string {
    const tree: TreeNode = {};
    const selectedFilesSet = new Set(files);

    const commonRootDir = findCommonRootDir(files);
    const relativeRoot = path.relative(rootPath, commonRootDir) || path.basename(commonRootDir);

    const allFiles = getAllFilesInDirectory(commonRootDir);

    allFiles.forEach(file => {
        const relativePath = path.relative(commonRootDir, file);
        const parts = relativePath.split(path.sep);
        let current = tree;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] === 'string') {
                current[part] = {};
            }
            current = current[part] as TreeNode;
        }

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
            current[fileName] = '[File not selected]';
        }
    });

    const rootTree: TreeNode = { [relativeRoot]: tree };

    function renderTree(node: TreeNode, prefix: string = '', isLast: boolean = true): string {
        let result = '';
        const entries = Object.entries(node);
        entries.forEach(([key, value], index) => {
            const isLastEntry = index === entries.length - 1;
            const connector = isLastEntry ? '└── ' : '├── ';
            const childPrefix = isLastEntry ? '    ' : '│   ';
            result += prefix + connector + key + '\n';
            if (typeof value === 'string') {
                if (!value.includes('[File not selected]')) {
                    result += prefix + childPrefix + 'Content:\n';
                    value.split('\n').forEach(line => {
                        result += prefix + childPrefix + '    ' + line + '\n';
                    });
                }
            } else {
                result += renderTree(value, prefix + childPrefix, isLastEntry);
            }
        });
        return result;
    }

    return renderTree(rootTree);
}

function findCommonRootDir(files: string[]): string {
    if (files.length === 0) return '';
    if (files.length === 1) return path.dirname(files[0]);

    let commonPath = path.dirname(files[0]);
    for (let i = 1; i < files.length; i++) {
        while (!files[i].startsWith(commonPath)) {
            commonPath = path.dirname(commonPath);
        }
    }
    return commonPath;
}