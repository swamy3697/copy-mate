// src/webview/styles.ts
export function getStyles(): string {
    return `
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 0;
            background-color: #2c3e50;
            color: #fff;
        }
        h3 {
            margin-bottom: 10px;
        }
        .file-tree {
            list-style-type: none;
            padding-left: 20px;
        }
        .file-tree li {
            margin: 4px 0;
        }
        .file-tree .folder {
            font-weight: bold;
            cursor: pointer;
            color: #9b59b6;
            display: flex;
            align-items: center;
        }
        .folder-toggle {
            display: inline-block;
            margin-right: 5px;
            width: 15px;
            text-align: center;
        }
        .folder-toggle::before {
            content: "▶";
        }
        .folder.open .folder-toggle::before {
            content: "▼";
        }
        .file-tree .file {
            display: flex;
            align-items: center;
        }
        .file-tree .file input[type="checkbox"],
        .file-tree .folder input[type="checkbox"] {
            margin-right: 5px;
        }
        .checkbox-container {
            margin-bottom: 10px;
        }
        .button-container {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        button {
            background-color: #9b59b6;
            color: white;
            padding: 10px;
            border: none;
            cursor: pointer;
            border-radius: 4px;
        }
        button:hover {
            background-color: #8e44ad;
        }

        /* Loading Animation Styles */
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
        }
        .loader {
            width: 48px;
            height: 48px;
            border: 5px solid #9b59b6;
            border-bottom-color: transparent;
            border-radius: 50%;
            animation: rotation 1s linear infinite;
            margin-bottom: 15px;
        }
        @keyframes rotation {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
}