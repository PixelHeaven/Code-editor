document.addEventListener('DOMContentLoaded', function() {
    // Check if LZString is available
    if (typeof LZString === 'undefined') {
        console.error('LZString library is missing! Please include it in your HTML file.');
        // Fallback implementation for LZString to prevent errors
        window.LZString = {
            compressToEncodedURIComponent: function(str) { return encodeURIComponent(str); },
            decompressFromEncodedURIComponent: function(str) { return decodeURIComponent(str); }
        };
    }

    // Initialize CodeMirror editors
    const htmlEditor = CodeMirror.fromTextArea(document.getElementById('html-editor'), {
        mode: 'htmlmixed',
        theme: 'dracula',
        lineNumbers: true,
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineWrapping: true,
        tabSize: 2,
        extraKeys: {
            'Tab': function(cm) {
                cm.replaceSelection('  ', 'end');
            }
        }
    });

    const cssEditor = CodeMirror.fromTextArea(document.getElementById('css-editor'), {
        mode: 'css',
        theme: 'dracula',
        lineNumbers: true,
        autoCloseBrackets: true,
        lineWrapping: true,
        tabSize: 2,
        extraKeys: {
            'Tab': function(cm) {
                cm.replaceSelection('  ', 'end');
            }
        }
    });

    const jsEditor = CodeMirror.fromTextArea(document.getElementById('js-editor'), {
        mode: 'javascript',
        theme: 'dracula',
        lineNumbers: true,
        autoCloseBrackets: true,
        lineWrapping: true,
        tabSize: 2,
        extraKeys: {
            'Tab': function(cm) {
                cm.replaceSelection('  ', 'end');
            }
        }
    });

    // Set default content
    htmlEditor.setValue(`<!DOCTYPE html>
<html>
<head>
  <title>My Code</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Start coding here</p>
</body>
</html>`);

    cssEditor.setValue(`body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  margin: 0;
  padding: 20px;
}

h1 {
  color: #333;
}`);

    // Fixed nested DOMContentLoaded
    jsEditor.setValue(`// Your JavaScript code here
console.log('Hello from JavaScript!');

// You can access DOM elements like this:
// const heading = document.querySelector('h1');
// heading.textContent = 'JavaScript is working!';`);

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const panelId = this.getAttribute('data-panel');
            
            // Remove active class from all buttons and panels
            tabBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked button and corresponding panel
            this.classList.add('active');
            const panel = document.getElementById(`${panelId}-panel`);
            if (panel) {
                panel.classList.add('active');
                
                // Refresh CodeMirror instance
                if (panelId === 'html') htmlEditor.refresh();
                else if (panelId === 'css') cssEditor.refresh();
                else if (panelId === 'js') jsEditor.refresh();
            } else {
                console.error(`Panel with ID ${panelId}-panel not found`);
            }
        });
    });

    // Properly refresh all editors function
    function refreshAllEditors() {
        setTimeout(() => {
            htmlEditor.refresh();
            cssEditor.refresh();
            jsEditor.refresh();
        }, 10);
    }

    // Run code - FIXED VERSION
    function updatePreview() {
        const html = htmlEditor.getValue();
        const css = cssEditor.getValue();
        const js = jsEditor.getValue();
        
        // Get the iframe
        const previewFrame = document.getElementById('preview');
        
        if (!previewFrame) {
            console.error('Preview iframe not found!');
            return;
        }
        
        // Clear the current iframe by removing and re-creating it
        const oldFrame = previewFrame;
        const newFrame = document.createElement('iframe');
        newFrame.id = 'preview';
        // Set sandbox attribute to allow JavaScript execution but maintain security
        newFrame.setAttribute('sandbox', 'allow-scripts allow-modals allow-same-origin');
        oldFrame.parentNode.replaceChild(newFrame, oldFrame);
        
        // Write to the new iframe with a try-catch block for error handling
        setTimeout(() => {
            try {
                const preview = newFrame.contentDocument || newFrame.contentWindow.document;
                preview.open();
                preview.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>${css}</style>
                    </head>
                    <body>
                        ${html}
                        <script>${js}<\/script>
                    </body>
                    </html>
                `);
                preview.close();
            } catch (error) {
                console.error('Error updating preview:', error);
                // Display error in preview
                const preview = newFrame.contentDocument || newFrame.contentWindow.document;
                preview.open();
                preview.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: sans-serif; margin: 20px; }
                            .error { color: red; background: #ffeeee; padding: 10px; border-radius: 5px; }
                        </style>
                    </head>
                    <body>
                        <div class="error">
                            <h3>Error in preview</h3>
                            <p>${error.message}</p>
                        </div>
                    </body>
                    </html>
                `);
                preview.close();
            }
        }, 50);
    }

    const runBtn = document.getElementById('run-btn');
    if (runBtn) {
        runBtn.addEventListener('click', updatePreview);
    } else {
        console.error('Run button not found!');
    }
    
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', updatePreview);
    }

    // Auto-update preview (with debounce)
    let updateTimeout;
    function debounceUpdate() {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updatePreview, 1000);
    }

    htmlEditor.on('change', debounceUpdate);
    cssEditor.on('change', debounceUpdate);
    jsEditor.on('change', debounceUpdate);

    // Initial preview render
    setTimeout(updatePreview, 500);

    // Resizable panels
    const container = document.querySelector('.container');
    const editorContainer = document.querySelector('.editor-container');
    const previewContainer = document.querySelector('.preview-container');
    const resizeHandle = document.querySelector('.resize-handle');
    
    if (!container || !editorContainer || !previewContainer || !resizeHandle) {
        console.error('One or more resizing elements not found');
    } else {
        let isResizing = false;
        
        resizeHandle.addEventListener('mousedown', function(e) {
            isResizing = true;
            document.body.classList.add('resizing');
            e.preventDefault(); // Prevent text selection during resize
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            
            const containerRect = container.getBoundingClientRect();
            
            if (window.innerWidth > 768) {
                // Horizontal resizing
                const containerWidth = containerRect.width;
                const mouseX = e.clientX - containerRect.left;
                const percentage = (mouseX / containerWidth) * 100;
                
                // Limit minimum width
                if (percentage > 20 && percentage < 80) {
                    editorContainer.style.width = `${percentage}%`;
                    previewContainer.style.width = `${100 - percentage}%`;
                    // Refresh editors after resize
                    refreshAllEditors();
                }
            } else {
                // Vertical resizing
                const containerHeight = containerRect.height;
                const mouseY = e.clientY - containerRect.top;
                const percentage = (mouseY / containerHeight) * 100;
                
                // Limit minimum height
                if (percentage > 20 && percentage < 80) {
                    editorContainer.style.height = `${percentage}%`;
                    previewContainer.style.height = `${100 - percentage}%`;
                    // Refresh editors after resize
                    refreshAllEditors();
                }
            }
        });
        
        document.addEventListener('mouseup', function() {
            if (isResizing) {
                isResizing = false;
                document.body.classList.remove('resizing');
                // Final refresh after resize is complete
                refreshAllEditors();
            }
        });

        // Touch event handling for resizing on iPad
        resizeHandle.addEventListener('touchstart', function(e) {
            isResizing = true;
            document.body.classList.add('resizing');
            e.preventDefault(); // Prevent scrolling during resize
        }, { passive: false });
        
        document.addEventListener('touchmove', function(e) {
            if (!isResizing || !e.touches[0]) return;
            
            const containerRect = container.getBoundingClientRect();
            
            if (window.innerWidth > 768) {
                // Horizontal resizing
                const containerWidth = containerRect.width;
                const touchX = e.touches[0].clientX - containerRect.left;
                const percentage = (touchX / containerWidth) * 100;
                
                if (percentage > 20 && percentage < 80) {
                    editorContainer.style.width = `${percentage}%`;
                    previewContainer.style.width = `${100 - percentage}%`;
                    // Refresh editors after resize
                    refreshAllEditors();
                }
            } else {
                // Vertical resizing
                const containerHeight = containerRect.height;
                const touchY = e.touches[0].clientY - containerRect.top;
                const percentage = (touchY / containerHeight) * 100;
                
                if (percentage > 20 && percentage < 80) {
                    editorContainer.style.height = `${percentage}%`;
                    previewContainer.style.height = `${100 - percentage}%`;
                    // Refresh editors after resize
                    refreshAllEditors();
                }
            }
        }, { passive: false });
        
        document.addEventListener('touchend', function() {
            if (isResizing) {
                isResizing = false;
                document.body.classList.remove('resizing');
                // Final refresh after resize is complete
                refreshAllEditors();
            }
        });
    }

    // Toggle theme
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('light-mode');
            
            const isDarkMode = document.body.classList.contains('dark-mode');
            const theme = isDarkMode ? 'dracula' : 'eclipse';
            
            htmlEditor.setOption('theme', theme);
            cssEditor.setOption('theme', theme);
            jsEditor.setOption('theme', theme);
            
            // Update icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-sun');
                icon.classList.toggle('fa-moon');
            }
        });
    }

    // Save snippet functionality
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const snippetName = prompt('Enter a name for your code snippet:');
            if (!snippetName) return;
            
            const snippet = {
                name: snippetName,
                html: htmlEditor.getValue(),
                css: cssEditor.getValue(),
                js: jsEditor.getValue(),
                timestamp: new Date().toISOString()
            };
            
            try {
                let savedSnippets = JSON.parse(localStorage.getItem('codeSnippets') || '[]');
                savedSnippets.push(snippet);
                localStorage.setItem('codeSnippets', JSON.stringify(savedSnippets));
                alert('Snippet saved successfully!');
            } catch (error) {
                console.error('Error saving snippet:', error);
                alert('Failed to save snippet. ' + error.message);
            }
        });
    }

    // Load snippet functionality
    const loadBtn = document.getElementById('load-btn');
    const savedSnippetsModal = document.getElementById('saved-snippets-modal');
    const snippetsList = document.getElementById('snippets-list');
    
    if (loadBtn && savedSnippetsModal && snippetsList) {
        loadBtn.addEventListener('click', function() {
            try {
                const savedSnippets = JSON.parse(localStorage.getItem('codeSnippets') || '[]');
                
                if (savedSnippets.length === 0) {
                    alert('No saved snippets found.');
                    return;
                }
                
                // Populate snippets list
                snippetsList.innerHTML = '';
                savedSnippets.forEach((snippet, index) => {
                    const li = document.createElement('li');
                    const date = new Date(snippet.timestamp).toLocaleString();
                    
                    li.innerHTML = `
                        <div>
                            <strong>${snippet.name}</strong>
                            <small>${date}</small>
                        </div>
                        <div>
                            <button class="load-snippet-btn" data-index="${index}">Load</button>
                            <button class="delete-snippet-btn" data-index="${index}">Delete</button>
                        </div>
                    `;
                    
                    snippetsList.appendChild(li);
                });
                
                savedSnippetsModal.style.display = 'block';
            } catch (error) {
                console.error('Error loading snippets:', error);
                alert('Failed to load snippets. ' + error.message);
            }
        });
        
        // Handle snippet actions
        snippetsList.addEventListener('click', function(e) {
            try {
                const savedSnippets = JSON.parse(localStorage.getItem('codeSnippets') || '[]');
                
                if (e.target.classList.contains('load-snippet-btn')) {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    if (isNaN(index) || index < 0 || index >= savedSnippets.length) {
                        console.error('Invalid snippet index');
                        return;
                    }
                    
                    const snippet = savedSnippets[index];
                    
                    htmlEditor.setValue(snippet.html || '');
                    cssEditor.setValue(snippet.css || '');
                    jsEditor.setValue(snippet.js || '');
                    
                    updatePreview();
                    savedSnippetsModal.style.display = 'none';
                } else if (e.target.classList.contains('delete-snippet-btn')) {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    if (isNaN(index) || index < 0 || index >= savedSnippets.length) {
                        console.error('Invalid snippet index');
                        return;
                    }
                    
                    if (confirm('Are you sure you want to delete this snippet?')) {
                        savedSnippets.splice(index, 1);
                        localStorage.setItem('codeSnippets', JSON.stringify(savedSnippets));
                        e.target.closest('li').remove();
                        
                        if (savedSnippets.length === 0) {
                            savedSnippetsModal.style.display = 'none';
                        }
                    }
                }
            } catch (error) {
                console.error('Error handling snippet action:', error);
                alert('An error occurred. ' + error.message);
            }
        });
    }

    // Close modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Auto-save functionality
    function saveToLocalStorage() {
        try {
            const autoSaveData = {
                html: htmlEditor.getValue(),
                css: cssEditor.getValue(),
                js: jsEditor.getValue(),
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('autoSave', JSON.stringify(autoSaveData));
            
            // Show auto-save indicator
            const indicator = document.querySelector('.auto-save-indicator');
            if (!indicator) {
                const newIndicator = document.createElement('div');
                newIndicator.className = 'auto-save-indicator';
                newIndicator.textContent = 'Auto-saved';
                document.body.appendChild(newIndicator);
                
                setTimeout(() => {
                    newIndicator.classList.add('show');
                    setTimeout(() => {
                        newIndicator.classList.remove('show');
                        setTimeout(() => newIndicator.remove(), 300);
                    }, 1500);
                }, 10);
            }
        } catch (error) {
            console.error('Error auto-saving to localStorage:', error);
        }
    }
    
    function loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('autoSave');
            
            if (savedData) {
                try {
                    const data = JSON.parse(savedData);
                    
                    // Check if data was saved in the last 24 hours
                    const saved = new Date(data.timestamp);
                    const now = new Date();
                    const hoursDiff = (now - saved) / (1000 * 60 * 60);
                    
                    if (hoursDiff < 24) {
                        if (confirm('Would you like to restore your previous session?')) {
                            htmlEditor.setValue(data.html || '');
                            cssEditor.setValue(data.css || '');
                            jsEditor.setValue(data.js || '');
                            updatePreview();
                        }
                    }
                } catch (error) {
                    console.error('Failed to parse auto-saved data:', error);
                    // Remove corrupted data
                    localStorage.removeItem('autoSave');
                }
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }
    
    // Auto-save every 30 seconds
    const autoSaveInterval = setInterval(saveToLocalStorage, 30000);
    
    // Check for auto-save data on load
    if (!window.location.search.includes('code=')) {
        loadFromLocalStorage();
    }

    // Handle tablet keyboard appearing/disappearing
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    window.addEventListener('resize', () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Refresh CodeMirror instances to prevent display issues
        refreshAllEditors();
    });

    // Prevent accidental navigation away
    window.addEventListener('beforeunload', function(e) {
        // Save before leaving
        saveToLocalStorage();
        
        // Show confirmation dialog if there are unsaved changes
        const defaultHtml = `<!DOCTYPE html>\n<html>\n<head>\n  <title>My Code</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>Start coding here</p>\n</body>\n</html>`;
        const defaultCss = `body {\n  font-family: Arial, sans-serif;\n  background-color: #f0f0f0;\n  margin: 0;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n}`;
        const defaultJs = `// Your JavaScript code here\nconsole.log('Hello from JavaScript!');`;
        
        const isHTMLModified = htmlEditor.getValue() !== defaultHtml;
        const isCSSModified = cssEditor.getValue() !== defaultCss;
        const isJSModified = jsEditor.getValue() !== defaultJs;
        
        if (isHTMLModified || isCSSModified || isJSModified) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });

    // Double tap prevention for iOS Safari
    let lastTap = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        const DOUBLE_TAP_THRESHOLD = 300;
        
        if (now - lastTap < DOUBLE_TAP_THRESHOLD) {
            e.preventDefault();
        }
        
        lastTap = now;
    }, { passive: false });

    // Offline support notification
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    function updateOnlineStatus() {
        const status = navigator.onLine ? 'online' : 'offline';
        
        if (status === 'offline') {
            const notification = document.createElement('div');
            notification.className = 'offline-notification';
            notification.innerHTML = 'You are currently offline. Your changes will be saved locally.';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, 5000);
        }
    }

    // Initialize Editors for iPad
    function setupForTouchDevices() {
        // Detect if using a touch device
        if ('ontouchstart' in window || navigator.maxTouchPoints) {
            document.body.classList.add('touch-device');
            
            // Add extra padding to CodeMirror for better touch target
            document.querySelectorAll('.CodeMirror').forEach(editor => {
                editor.style.fontSize = '16px';
                editor.style.lineHeight = '1.5';
            });
            
            // Show a hint for users on first visit
            if (!localStorage.getItem('touchHintShown')) {
                const hint = document.createElement('div');
                hint.className = 'touch-hint';
                hint.innerHTML = `
                    <div class="hint-content">
                        <h3>Touch Device Detected</h3>
                        <p>For the best experience:</p>
                        <ul>
                            <li>Use external keyboard if available</li>
                            <li>Tap and hold to select text</li>
                            <li>Double tap the editor to zoom in if needed</li>
                        </ul>
                        <button id="close-hint">Got it!</button>
                    </div>
                `;
                document.body.appendChild(hint);
                
                const closeHintBtn = document.getElementById('close-hint');
                if (closeHintBtn) {
                    closeHintBtn.addEventListener('click', function() {
                        hint.remove();
                        localStorage.setItem('touchHintShown', 'true');
                    });
                }
                
                // Auto-dismiss after 10 seconds
                setTimeout(() => {
                    if (document.body.contains(hint)) {
                        hint.remove();
                        localStorage.setItem('touchHintShown', 'true');
                    }
                }, 10000);
            }
        }
    }
    
    setupForTouchDevices();

    // File explorer functionality
    function setupAdvancedEditor() {
        const advancedBtn = document.getElementById('advanced-editor-btn');
        const container = document.querySelector('.container');
        const fileExplorer = document.querySelector('.file-explorer');
        const fileList = document.getElementById('file-list');
        const newFileBtn = document.getElementById('new-file-btn');
        
        // Files storage
        let files = {
            'index.html': {
                content: htmlEditor.getValue(),
                language: 'htmlmixed'
            },
            'styles.css': {
                content: cssEditor.getValue(),
                language: 'css'
            },
            'script.js': {
                content: jsEditor.getValue(),
                language: 'javascript'
            }
        };
        
        let currentFile = 'index.html';
        let currentEditor = htmlEditor;
        
        // Toggle advanced editor mode
        advancedBtn.addEventListener('click', function() {
            container.classList.toggle('advanced-mode');
            const isAdvanced = container.classList.contains('advanced-mode');
            
            if (isAdvanced) {
                fileExplorer.style.display = 'flex';
                advancedBtn.innerHTML = '<i class="fas fa-times"></i> Simple';
                
                // Save current editor content to files
                files['index.html'].content = htmlEditor.getValue();
                files['styles.css'].content = cssEditor.getValue();
                files['script.js'].content = jsEditor.getValue();
                
                // Show the file that was active before
                const activeTab = document.querySelector('.tab-btn.active');
                if (activeTab) {
                    const panelType = activeTab.getAttribute('data-panel');
                    if (panelType === 'html') currentFile = 'index.html';
                    else if (panelType === 'css') currentFile = 'styles.css';
                    else if (panelType === 'js') currentFile = 'script.js';
                }
                
                switchToFile(currentFile);
            } else {
                fileExplorer.style.display = 'none';
                advancedBtn.innerHTML = '<i class="fas fa-code"></i> Advanced';
                
                // Transfer content back to original editors
                htmlEditor.setValue(files['index.html'].content);
                cssEditor.setValue(files['styles.css'].content);
                jsEditor.setValue(files['script.js'].content);
                
                // Switch back to the appropriate tab
                const panelType = currentFile.endsWith('.html') ? 'html' : 
                                currentFile.endsWith('.css') ? 'css' : 
                                currentFile.endsWith('.js') ? 'js' : 'html';
                
                document.querySelector(`.tab-btn[data-panel="${panelType}"]`).click();
            }
            
            setTimeout(refreshAllEditors, 10);
        });
        
        // Switch between files
        function switchToFile(filename) {
            if (!files[filename]) return;
            
            // Save current file content
            if (currentFile && files[currentFile]) {
                files[currentFile].content = currentEditor.getValue();
            }
            
            // Update current file
            currentFile = filename;
            
            // Update active file in UI
            const fileItems = fileList.querySelectorAll('li');
            fileItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-file') === filename) {
                    item.classList.add('active');
                }
            });
            
            // Display the file content in the editor
            const fileData = files[filename];
            
            // Use the appropriate panel/editor
            let panel;
            if (filename.endsWith('.html')) {
                currentEditor = htmlEditor;
                panel = document.getElementById('html-panel');
            } else if (filename.endsWith('.css')) {
                currentEditor = cssEditor;
                panel = document.getElementById('css-panel');
            } else if (filename.endsWith('.js')) {
                currentEditor = jsEditor;
                panel = document.getElementById('js-panel');
            }
            
            if (panel) {
                // Show the correct panel
                document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
                panel.classList.add('active');
                
                // Set content and mode
                currentEditor.setValue(fileData.content);
                currentEditor.setOption('mode', fileData.language);
                
                setTimeout(() => currentEditor.refresh(), 10);
            }
        }
        
        // Handle file list clicks
        fileList.addEventListener('click', function(e) {
            const fileItem = e.target.closest('li');
            if (fileItem) {
                const filename = fileItem.getAttribute('data-file');
                if (filename) {
                    switchToFile(filename);
                }
            }
        });
        
        // New file functionality
        newFileBtn.addEventListener('click', function() {
            const filename = prompt('Enter the new file name (e.g. custom.js, page.html)');
            if (!filename) return;
            
            if (files[filename]) {
                alert('A file with this name already exists.');
                return;
            }
            
            // Determine file type from extension
            let language = 'text/plain';
            let icon = 'fa-file-code';
            if (filename.endsWith('.html') || filename.endsWith('.htm')) {
                language = 'htmlmixed';
                icon = 'fa-html5';
            } else if (filename.endsWith('.css')) {
                language = 'css';
                icon = 'fa-css3-alt';
            } else if (filename.endsWith('.js')) {
                language = 'javascript';
                icon = 'fa-js';
            } else if (filename.endsWith('.json')) {
                language = 'application/json';
                icon = 'fa-brackets-curly';
            }
            
            // Create new file
            files[filename] = {
                content: '',
                language: language
            };
            
            // Add to file list
            const li = document.createElement('li');
            li.className = 'file';
            li.setAttribute('data-file', filename);
            li.innerHTML = `<i class="fas ${icon}"></i> ${filename}
                                <div class="file-actions">
                    <button class="file-action-btn delete-file-btn" title="Delete file"><i class="fas fa-trash"></i></button>
                </div>`;
            
            fileList.appendChild(li);
            
            // Switch to the new file
            switchToFile(filename);
        });
        
        // Delete file functionality
        fileList.addEventListener('click', function(e) {
            if (e.target.closest('.delete-file-btn')) {
                const fileItem = e.target.closest('li');
                const filename = fileItem.getAttribute('data-file');
                
                // Don't allow deleting main files
                if (['index.html', 'styles.css', 'script.js'].includes(filename)) {
                    alert('You cannot delete the main files.');
                    return;
                }
                
                if (confirm(`Are you sure you want to delete ${filename}?`)) {
                    // Remove from files object
                    delete files[filename];
                    
                    // Remove from UI
                    fileItem.remove();
                    
                    // If current file was deleted, switch to index.html
                    if (currentFile === filename) {
                        switchToFile('index.html');
                    }
                }
                
                e.stopPropagation(); // Prevent triggering file switch
            }
        });
    }
    
    // Setup advanced editor if present
    if (document.getElementById('advanced-editor-btn')) {
        setupAdvancedEditor();
    }

    // Notification system
    function showNotification(message, type = 'default', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px) translateX(-50%)';
            
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    // Share functionality
    const shareBtn = document.getElementById('share-btn');
    const shareModal = document.getElementById('share-modal');
    const shareLink = document.getElementById('share-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    
    if (shareBtn && shareModal && shareLink && copyLinkBtn) {
        shareBtn.addEventListener('click', function() {
            try {
                // Create a compressed version of the code
                const codeData = {
                    html: htmlEditor.getValue(),
                    css: cssEditor.getValue(),
                    js: jsEditor.getValue()
                };
                
                const compressedData = LZString.compressToEncodedURIComponent(JSON.stringify(codeData));
                const shareUrl = `${window.location.origin}${window.location.pathname}?code=${compressedData}`;
                
                shareLink.value = shareUrl;
                shareModal.style.display = 'block';
            } catch (error) {
                console.error('Error creating share link:', error);
                showNotification('Failed to create share link: ' + error.message, 'error');
            }
        });
        
        copyLinkBtn.addEventListener('click', function() {
            try {
                shareLink.select();
                document.execCommand('copy');
                
                const originalText = this.textContent;
                this.textContent = 'Copied!';
                
                setTimeout(() => {
                    this.textContent = originalText;
                }, 2000);
                
                showNotification('Link copied to clipboard!', 'success', 2000);
            } catch (error) {
                console.error('Error copying to clipboard:', error);
                showNotification('Failed to copy to clipboard: ' + error.message, 'error');
            }
        });
    }
    
    // Load shared code from URL
    function loadSharedCode() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const compressedCode = urlParams.get('code');
            
            if (compressedCode) {
                try {
                    const decompressed = LZString.decompressFromEncodedURIComponent(compressedCode);
                    const codeData = JSON.parse(decompressed);
                    
                    htmlEditor.setValue(codeData.html || '');
                    cssEditor.setValue(codeData.css || '');
                    jsEditor.setValue(codeData.js || '');
                    
                    updatePreview();
                    
                    // Clean URL without reloading
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    showNotification('Shared code loaded successfully!', 'success');
                } catch (error) {
                    console.error('Failed to load shared code:', error);
                    showNotification('Invalid or corrupted shared code: ' + error.message, 'error');
                }
            }
        } catch (error) {
            console.error('Error in loadSharedCode:', error);
        }
    }
    
    loadSharedCode();

    // Run the code once when the page loads
    setTimeout(updatePreview, 1000);
    
    // Set up error handling for the entire application
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error || e.message);
        showNotification('An error occurred: ' + (e.error?.message || e.message), 'error');
    });
    
    // Add cleanup function to prevent memory leaks
    window.addEventListener('beforeunload', function() {
        // Clear intervals
        clearInterval(autoSaveInterval);
        // Remove event listeners if needed
    });
});
