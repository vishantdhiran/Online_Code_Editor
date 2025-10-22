// Code cache for API requests
const codeCache = new Map();

// Initialize CodeMirror editor
let editor;
let darkMode = false;
let currentCode = '';

// Code execution settings
const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com/submissions';
const API_KEY = 'c58bd7f596mshce8439c81aef1bfp10f713jsn0ebd104abcb7';

// Example starter code templates
const starterTemplates = {
    "htmlmixed": '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Web Page</title>\n  <style>\n    /* CSS styles here */\n  </style>\n</head>\n<body>\n  <h1>Hello World!</h1>\n  \n  <script>\n    // JavaScript here\n  </script>\n</body>\n</html>',
    "javascript": '// JavaScript Example\nconsole.log("Hello, World!");\n\n// Define a function\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\n// Call the function\nlet message = greet("Coder");\nconsole.log(message);',
    "css": '/* CSS Example */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background-color: #f0f0f0;\n}\n\nh1 {\n  color: navy;\n  text-align: center;\n}\n\n.container {\n  max-width: 800px;\n  margin: 0 auto;\n  background: white;\n  padding: 20px;\n  border-radius: 5px;\n  box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n}',
    "python": '# Python Example\n\ndef main():\n    print("Hello, World!")\n    \n    # Variables and types\n    name = "Coder"\n    age = 25\n    pi = 3.14159\n    \n    print(f"Name: {name}, Age: {age}, Pi: {pi}")\n    \n    # Lists\n    colors = ["red", "green", "blue"]\n    print("Colors:", colors)\n    \n    # Conditional\n    if age > 18:\n        print("Adult")\n    else:\n        print("Minor")\n\nif __name__ == "__main__":\n    main()',
    "text/x-csrc": '/* C Example */\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    \n    // Variables\n    int age = 25;\n    float pi = 3.14159;\n    char name[] = "Coder";\n    \n    printf("Name: %s, Age: %d, Pi: %.2f\\n", name, age, pi);\n    \n    // Conditional\n    if (age > 18) {\n        printf("Adult\\n");\n    } else {\n        printf("Minor\\n");\n    }\n    \n    return 0;\n}',
    "text/x-java": '/* Java Example */\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        \n        // Variables\n        String name = "Coder";\n        int age = 25;\n        double pi = 3.14159;\n        \n        System.out.println("Name: " + name + ", Age: " + age + ", Pi: " + pi);\n        \n        // Conditional\n        if (age > 18) {\n            System.out.println("Adult");\n        } else {\n            System.out.println("Minor");\n        }\n    }\n}'
};

// Error messages
const ERROR_MESSAGES = {
    API_ERROR: "API connection error. Please try again later.",
    EXECUTION_TIMEOUT: "Code execution timed out. Your code may have an infinite loop.",
    GENERAL_ERROR: "An error occurred while running your code."
};

document.addEventListener("DOMContentLoaded", function () {
    initializeEditor();
    setupEventListeners();
    loadSettings();
    showWelcomeMessage();
});

function showWelcomeMessage() {
    const outputContainer = document.getElementById("outputContainer");
    outputContainer.innerHTML = `
        <div class="welcome-message">
            <h2>Welcome to Vishant's Code Editor</h2>
            <p>Select a language, write or load code, and click Run to execute!</p>
            <p>Features:</p>
            <ul>
                <li>Multiple language support</li>
                <li>Theme customization</li>
                <li>Code saving/loading</li>
                <li>Live preview for web languages</li>
            </ul>
        </div>
    `;
}

function initializeEditor() {
    editor = CodeMirror.fromTextArea(document.getElementById("codeEditor"), {
        mode: "htmlmixed",
        theme: localStorage.getItem("editorTheme") || "default",
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        extraKeys: { "Ctrl-Space": "autocomplete" },
        autofocus: true
    });

    // Set the dropdown value to the stored theme
    document.getElementById("themeSelect").value = localStorage.getItem("editorTheme") || "default";

    // Set initial font size
    const savedFontSize = localStorage.getItem("fontSize") || "14";
    document.getElementById("fontSizeSelect").value = savedFontSize;
    updateEditorFontSize(savedFontSize);

    // Load initial template if no code is loaded
    const savedCode = localStorage.getItem("savedCode");
    if (savedCode) {
        editor.setValue(savedCode);
    } else {
        loadLanguageTemplate();
    }
}

// Set up event listeners
function setupEventListeners() {
    document.getElementById("runButton").addEventListener("click", runCode);
    document.getElementById("darkModeToggle").addEventListener("change", toggleDarkMode);
    document.getElementById("themeSelect").addEventListener("change", changeEditorTheme);
    document.getElementById("languageSelect").addEventListener("change", handleLanguageChange);
    document.getElementById("fontSizeSelect").addEventListener("change", function () {
        updateEditorFontSize(this.value);
    });
    document.getElementById("saveButton").addEventListener("click", saveCode);
    document.getElementById("loadButton").addEventListener("click", loadCode);
    document.getElementById("clearButton").addEventListener("click", clearEditor);
    document.getElementById("copyButton").addEventListener("click", copyToClipboard);
    document.getElementById("clearOutputButton").addEventListener("click", clearOutput);

    // Add keyboard shortcuts
    document.addEventListener("keydown", function (e) {
        // Ctrl+Enter to run code
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            runCode();
        }

        // Ctrl+S to save code
        if (e.ctrlKey && e.key === "s") {
            e.preventDefault();
            saveCode();
        }
    });
}

function handleLanguageChange() {
    updateEditorMode();
    if (editor.getValue().trim() === '' || confirm("Load template for the selected language? This will replace your current code.")) {
        loadLanguageTemplate();
    }
}

function loadLanguageTemplate() {
    const language = document.getElementById("languageSelect").value;
    if (starterTemplates[language]) {
        editor.setValue(starterTemplates[language]);
    }
}

function updateEditorFontSize(size) {
    const cmElements = document.querySelectorAll('.CodeMirror');
    cmElements.forEach(el => {
        el.style.fontSize = `${size}px`;
    });
    localStorage.setItem("fontSize", size);
}

function saveCode() {
    const code = editor.getValue();
    if (code.trim() === '') {
        showNotification("Nothing to save", "warning");
        return;
    }

    const language = document.getElementById("languageSelect").value;
    localStorage.setItem("savedCode", code);
    localStorage.setItem("savedLanguage", language);
    showNotification("Code saved successfully!");
}

function loadCode() {
    const savedCode = localStorage.getItem("savedCode");
    const savedLanguage = localStorage.getItem("savedLanguage");

    if (savedCode) {
        editor.setValue(savedCode);
        if (savedLanguage) {
            document.getElementById("languageSelect").value = savedLanguage;
            updateEditorMode();
        }
        showNotification("Code loaded successfully!");
    } else {
        showNotification("No saved code found", "warning");
    }
}

function clearEditor() {
    if (confirm("Are you sure you want to clear the editor?")) {
        editor.setValue("");
        showNotification("Editor cleared");
    }
}

function copyToClipboard() {
    const code = editor.getValue();
    if (code.trim() === '') {
        showNotification("Nothing to copy", "warning");
        return;
    }

    navigator.clipboard.writeText(code)
        .then(() => showNotification("Code copied to clipboard!"))
        .catch(err => showNotification("Failed to copy code", "error"));
}

function clearOutput() {
    document.getElementById("outputContainer").innerHTML = "";
}

function updateEditorMode() {
    const language = document.getElementById("languageSelect").value;
    const modes = {
        htmlmixed: "htmlmixed",
        javascript: "javascript",
        css: "css",
        python: "python",
        "text/x-csrc": "text/x-csrc",
        "text/x-java": "text/x-java"
    };
    editor.setOption("mode", modes[language]);
}

function showNotification(message, type = "success") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to body
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.opacity = "1";
        notification.style.transform = "translateY(0)";
    }, 10);

    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateY(-20px)";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Run code inside iframe
async function runCode() {
    const code = editor.getValue();
    const language = document.getElementById("languageSelect").value;
    const outputContainer = document.getElementById("outputContainer");

    if (code.trim() === '') {
        outputContainer.innerHTML = '<div class="error-message">No code to execute. Please write some code first.</div>';
        return;
    }

    // Show loading indicator
    outputContainer.innerHTML = '<div class="loading">Executing code</div>';

    try {
        // Web Languages (HTML/CSS/JS)
        if (language === "htmlmixed") {
            const iframe = document.createElement("iframe");
            iframe.sandbox = "allow-scripts allow-modals";
            iframe.style = "width:100%; height:300px; border:1px solid #ccc;";
            outputContainer.innerHTML = '';
            outputContainer.appendChild(iframe);

            // Set timeout for iframe load
            const iframeLoadTimeout = setTimeout(() => {
                if (outputContainer.querySelector('iframe')) {
                    showNotification("Preview may have issues loading", "warning");
                }
            }, 5000);

            // Handle iframe load event
            iframe.onload = () => clearTimeout(iframeLoadTimeout);

            iframe.srcdoc = code; // Directly render full HTML pages
        }
        // Pure JavaScript - THIS IS THE FIXED PART
        // Fix for the JavaScript execution part in runCode() function
        else if (language === "javascript") {
            const iframe = document.createElement("iframe");
            iframe.sandbox = "allow-scripts allow-modals";
            iframe.style = "width:100%; height:300px; border:1px solid #ccc;";
            outputContainer.innerHTML = '';
            outputContainer.appendChild(iframe);

            // Create a console logger
            const consoleOutput = document.createElement("div");
            consoleOutput.className = "console-output";
            consoleOutput.innerHTML = '<h4>Console Output:</h4>';
            outputContainer.appendChild(consoleOutput);

            // Fixed version - preventing console recursion
            iframe.srcdoc = `
        <!DOCTYPE html>
        <body>
            <div id="output"></div>
            <script>
                // Store original console methods
                const originalConsole = {
                    log: console.log,
                    error: console.error,
                    warn: console.warn
                };
                
                // Override console methods with safe versions
                console.log = function() {
                    // Format the arguments
                    const content = Array.from(arguments).map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ');
                    
                    // Use the original method without recursion
                    originalConsole.log.apply(originalConsole, arguments);
                    
                    // Send to parent
                    window.parent.postMessage({
                        type: 'log',
                        content: content
                    }, '*');
                };
                
                console.error = function() {
                    // Format the arguments
                    const content = Array.from(arguments).map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ');
                    
                    // Use the original method without recursion
                    originalConsole.error.apply(originalConsole, arguments);
                    
                    // Send to parent
                    window.parent.postMessage({
                        type: 'error',
                        content: content
                    }, '*');
                };
                
                console.warn = function() {
                    // Format the arguments
                    const content = Array.from(arguments).map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ');
                    
                    // Use the original method without recursion
                    originalConsole.warn.apply(originalConsole, arguments);
                    
                    // Send to parent
                    window.parent.postMessage({
                        type: 'warn',
                        content: content
                    }, '*');
                };
                
                try {
                    ${code}
                } catch(err) {
                    console.error('Error: ' + err.message);
                }
            <\/script>
        </body>
    `;

            // Listen for messages from iframe
            window.addEventListener('message', function (event) {
                if (event.data && event.data.type) {
                    const logEntry = document.createElement("div");
                    logEntry.className = `log-entry log-${event.data.type}`;
                    logEntry.textContent = event.data.content;
                    consoleOutput.appendChild(logEntry);
                }
            });
        }

        // CSS only
        else if (language === "css") {
            const iframe = document.createElement("iframe");
            iframe.sandbox = "allow-same-origin";
            iframe.style = "width:100%; height:300px; border:1px solid #ccc;";
            outputContainer.innerHTML = '';
            outputContainer.appendChild(iframe);

            iframe.srcdoc = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>${code}</style>
                </head>
                <body>
                    <h1>CSS Preview</h1>
                    <div class="container">
                        <h2>Heading Example</h2>
                        <p>This is a paragraph to demonstrate your CSS styling.</p>
                        <div class="box">This is a div with "box" class</div>
                        <button>Button Example</button>
                        <ul>
                            <li>List item 1</li>
                            <li>List item 2</li>
                            <li>List item 3</li>
                        </ul>
                    </div>
                </body>
                </html>
            `;
        }
        // Server-side languages
        else {
            const result = await executeCode(language, code);
            displayServerResult(result, outputContainer);
        }
    } catch (err) {
        outputContainer.innerHTML = `<div class="error-message">
            <h4>Error:</h4>
            <pre>${err.message}</pre>
        </div>`;
    }
}

function displayServerResult(result, outputContainer) {
    outputContainer.innerHTML = ''; // Clear loading indicator

    if (result.error) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "result-error";
        errorDiv.innerHTML = `<h4>Error:</h4><pre>${result.error}</pre>`;
        outputContainer.appendChild(errorDiv);
        return;
    }

    // Create result container
    const resultContainer = document.createElement("div");
    resultContainer.className = "result-container";

    // Add stdout if available
    if (result.stdout && result.stdout.trim() !== '') {
        const stdoutDiv = document.createElement("div");
        stdoutDiv.className = "result-stdout";
        stdoutDiv.innerHTML = `<h4>Output:</h4><pre>${escapeHtml(result.stdout)}</pre>`;
        resultContainer.appendChild(stdoutDiv);
    }

    // Add stderr if available
    if (result.stderr && result.stderr.trim() !== '') {
        const stderrDiv = document.createElement("div");
        stderrDiv.className = "result-error";
        stderrDiv.innerHTML = `<h4>Error Output:</h4><pre>${escapeHtml(result.stderr)}</pre>`;
        resultContainer.appendChild(stderrDiv);
    }

    // Add compile output if available
    if (result.compile_output && result.compile_output.trim() !== '') {
        const compileDiv = document.createElement("div");
        compileDiv.className = "result-error";
        compileDiv.innerHTML = `<h4>Compile Output:</h4><pre>${escapeHtml(result.compile_output)}</pre>`;
        resultContainer.appendChild(compileDiv);
    }

    // Add execution info
    const infoDiv = document.createElement("div");
    infoDiv.className = "result-info";
    infoDiv.innerHTML = `<p>Status: ${result.status || 'Unknown'}</p>`;

    if (result.time) {
        infoDiv.innerHTML += `<p>Execution Time: ${result.time}s</p>`;
    }

    if (result.memory) {
        infoDiv.innerHTML += `<p>Memory Usage: ${result.memory} KB</p>`;
    }

    resultContainer.appendChild(infoDiv);
    outputContainer.appendChild(resultContainer);

    // If no content was added, show a message
    if (resultContainer.children.length === 1) {
        const noOutputDiv = document.createElement("div");
        noOutputDiv.className = "result-info";
        noOutputDiv.innerHTML = "<p>Code executed successfully with no output.</p>";
        resultContainer.insertBefore(noOutputDiv, infoDiv);
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Add new API execution function
async function executeCode(language, code) {
    const cacheKey = `${language}-${code}`;
    if (codeCache.has(cacheKey)) {
        return codeCache.get(cacheKey);
    }

    const languageIds = {
        "python": 71,
        "text/x-csrc": 50,
        "text/x-java": 62,
        "javascript": 63,
        "htmlmixed": 71,
        "css": 51
    };

    try {
        // Submit code
        const response = await fetch(JUDGE0_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            },
            body: JSON.stringify({
                source_code: code,
                language_id: languageIds[language],
                stdin: '',
                cpu_time_limit: 5,
                memory_limit: 512000,
                encode: false
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.token) {
            return { error: "No submission token received" };
        }

        // Get result with exponential backoff
        let result;
        let attempts = 0;
        let waitTime = 1000; // Start with 1 second wait

        do {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            // Double the wait time for next attempt (exponential backoff)
            waitTime = Math.min(waitTime * 2, 8000); // Cap at 8 seconds

            const resultResponse = await fetch(`${JUDGE0_API}/${data.token}`, {
                headers: {
                    'X-RapidAPI-Key': API_KEY,
                    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
                }
            });

            if (!resultResponse.ok) {
                throw new Error(`Result fetch error: ${resultResponse.status}`);
            }

            result = await resultResponse.json();
            attempts++;
        } while (attempts < 5 && (!result.status || result.status.id <= 2));

        // Process final result
        const output = {
            stdout: result.stdout || '',
            stderr: result.stderr || '',
            compile_output: result.compile_output || '',
            message: result.message || '',
            status: result.status?.description || 'Unknown status',
            time: result.time || '0',
            memory: result.memory || '0'
        };

        // Cache the result
        codeCache.set(cacheKey, output);
        return output;

    } catch (error) {
        return {
            error: `Execution failed: ${error.message}`,
            status: 'Error'
        };
    }
}

// Toggle dark mode
function toggleDarkMode() {
    darkMode = document.getElementById("darkModeToggle").checked;
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", darkMode);
}

// Change CodeMirror theme
function changeEditorTheme() {
    let newTheme = document.getElementById("themeSelect").value;
    editor.setOption("theme", newTheme);
    localStorage.setItem("editorTheme", newTheme);
}

// Load settings from storage
function loadSettings() {
    // Load dark mode setting
    if (localStorage.getItem("darkMode") === "true") {
        document.getElementById("darkModeToggle").checked = true;
        document.body.classList.add("dark-mode");
    }

    // Load editor theme
    if (localStorage.getItem("editorTheme")) {
        editor.setOption("theme", localStorage.getItem("editorTheme"));
        document.getElementById("themeSelect").value = localStorage.getItem("editorTheme");
    }

    // Load language
    if (localStorage.getItem("savedLanguage")) {
        document.getElementById("languageSelect").value = localStorage.getItem("savedLanguage");
        updateEditorMode();
    }
}