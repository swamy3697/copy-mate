import * as fs from 'fs';
import * as path from 'path';
import { getStyles } from './styles';
import { getScripts } from './scripts';
 export default function isTextFile(filePath: string): boolean {
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
export function getWebviewContent(workspaceFolder: string): string {
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <style>${getStyles()}</style>
            </head>
            <body>
                <h3>Select Files to Copy:</h3>
                <div id="loadingContainer" class="loading-container">
                    <div class="loader">
                        <div class="copy-shadow"></div>
                        <div class="copy-animation"></div>
                    </div>
                    <p>Preparing Your Files</p>
                </div>
                <div id="mainContent" style="display: none;">
                    <div class="checkbox-container">
                        <ul class="file-tree" id="fileTreeRoot">
                            <!-- File tree will be inserted here -->
                        </ul>
                    </div>
                    <div class="button-container">
                    <button id="copyContentBtn" onclick="copySelectedFiles()">Copy Content</button>
                    <button id="structureBtn" onclick="copyFileStructure()">Copy Selected Structure</button>
                    <button id="structureWithContentBtn" onclick="copyStructureWithContent()">Copy Structure with Content</button>
                    </div>
                </div>
                <script>${getScripts()}</script>
            </body>
        </html>
    `;
}

export async function generateFileTree(dirPath: string): Promise<string> {
    console.log('Generating file tree for:', dirPath);
    
    try {
        // Check if directory exists and is readable
        await fs.promises.access(dirPath, fs.constants.R_OK);
        
        const fileTree = await createFileTreeHTML(dirPath);
        console.log('File tree generated successfully');
        return fileTree;
    } catch (error) {
        console.error('Error generating file tree:', error);
        throw error;
    }
}

async function createFileTreeHTML(dirPath: string, currentPath: string = ''): Promise<string> {
    try {
        let html = '';
        const files = await fs.promises.readdir(dirPath);

        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const relativePath = path.join(currentPath, file);

            try {
                const stat = await fs.promises.stat(fullPath);

                if (stat.isDirectory()) {
                    // Skip node_modules and hidden directories
                    if (file === 'node_modules' || file.startsWith('.')) {
                        continue;
                    }

                    const subDirContent = await createFileTreeHTML(fullPath, relativePath);
                    html += `
                        <li>
                            <div class="folder">
                                <input type="checkbox" onclick="toggleFolderCheckbox(event)" data-path="${fullPath}">
                                <span class="folder-toggle"></span>
                                <span class="folder-name">${file}</span>
                            </div>
                            <ul class="file-tree" style="display: none;">
                                ${subDirContent}
                            </ul>
                        </li>
                    `;
                } else {
                    // Skip hidden files
                    if (!file.startsWith('.')) {
                        const isText = isTextFile(fullPath);
                        html += `
                            <li class="file ${isText ? 'text-file' : 'raw-file'}">
                                <input type="checkbox" 
                                    id="${fullPath}" 
                                    value="${fullPath}"
                                    data-type="${isText ? 'text' : 'binary'}"
                                    ${isText ? '' : 'data-structure-only="true"'}
                                    class="file-checkbox">
                                <label for="${fullPath}">${file}</label>
                            </li>
                        `;
                    }
                }
            } catch (error) {
                console.error(`Error processing ${fullPath}:`, error);
            }
        }

        return html;
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
        throw error;
    }
}