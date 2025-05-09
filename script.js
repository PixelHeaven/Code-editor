document.addEventListener('DOMContentLoaded', function() {
    // Create auto-save indicator
    function createAutoSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        indicator.textContent = 'Saving...';
        indicator.style.position = 'fixed';
        indicator.style.bottom = '10px';
        indicator.style.right = '10px';
        indicator.style.backgroundColor = 'rgba(0, 120, 215, 0.8)';
        indicator.style.color = 'white';
        indicator.style.padding = '5px 10px';
        indicator.style.borderRadius = '3px';
        indicator.style.fontSize = '12px';
        indicator.style.transition = 'opacity 0.3s';
        indicator.style.opacity = '0';
        indicator.style.zIndex = '9999';
        document.body.appendChild(indicator);
        
        return {
            show: function() {
                indicator.style.opacity = '1';
                setTimeout(() => {
                    indicator.style.opacity = '0';
                }, 1000);
            }
        };
    }
    const autoSaveIndicator = createAutoSaveIndicator();

    // Notification system
    function createNotification(message, type = 'default', duration = 3000) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.color = 'white';
        notification.style.fontSize = '14px';
        notification.style.zIndex = '10000';
        notification.style.transition = 'opacity 0.3s, transform 0.3s';
        
        // Set background color based on type
        if (type === 'error') {
            notification.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
        } else if (type === 'success') {
            notification.style.backgroundColor = 'rgba(40, 167, 69, 0.9)';
        } else if (type === 'warning') {
            notification.style.backgroundColor = 'rgba(255, 193, 7, 0.9)';
        } else {
            notification.style.backgroundColor = 'rgba(0, 123, 255, 0.9)';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, duration);
    }

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

    // Function to refresh all editors
    function refreshAllEditors() {
        setTimeout(() => {
            if (htmlEditor) htmlEditor.refresh();
            if (cssEditor) cssEditor.refresh();
            if (jsEditor) jsEditor.refresh();
        }, 10);
    }

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
                setTimeout(() => {
                    if (panelId === 'html') htmlEditor.refresh();
                    else if (panelId === 'css') cssEditor.refresh();
                    else if (panelId === 'js') jsEditor.refresh();
                }, 10);
            } else {
                console.error(`Panel with ID ${panelId}-panel not found`);
            }
        });
    });

    // Run code function
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
                const preview = newFrame.contentDocument || (newFrame.contentWindow && newFrame.contentWindow.document);
                
                if (!preview) {
                    throw new Error('Cannot access iframe document');
                }
                
                preview.open();
                preview.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Preview</title>
                        <style type="text/css">
                            ${css}
                        </style>
                        <style>
                            /* Error display styling */
                            .error-display {
                                background-color: #ffeeee;
                                color: #dd0000;
                                padding: 10px;
                                border-radius: 4px;
                                font-family: monospace;
                                white-space: pre-wrap;
                                margin: 10px 0;
                                border: 1px solid #ffaaaa;
                            }
                        </style>
                    </head>
                    <body>
                        ${html}
                        <script>
                            // Error handling for console methods
                            (function() {
                                const originalConsoleError = console.error;
                                const originalConsoleLog = console.log;
                                const originalConsoleWarn = console.warn;
                                const originalConsoleInfo = console.info;
                                
                                function displayError(args, type) {
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'error-display';
                                    errorDiv.textContent = Array.from(args).join(' ');
                                    errorDiv.dataset.type = type;
                                    document.body.appendChild(errorDiv);
                                }
                                
                                console.error = function() {
                                    displayError(arguments, 'error');
                                    originalConsoleError.apply(console, arguments);
                                };
                                
                                console.log = function() {
                                    originalConsoleLog.apply(console, arguments);
                                };
                                
                                console.warn = function() {
                                    displayError(arguments, 'warning');
                                    originalConsoleWarn.apply(console, arguments);
                                };
                                
                                console.info = function() {
                                    originalConsoleInfo.apply(console, arguments);
                                };
                                
                                window.addEventListener('error', function(e) {
                                    console.error('JavaScript Error:', e.message);
                                    e.preventDefault();
                                });
                            })();
                            
                            // User JS code
                            try {
                                ${js}
                            } catch (error) {
                                console.error('JavaScript Error:', error.message);
                            }
                        </script>
                    </body>
                    </html>
                `);
                preview.close();
            } catch (error) {
                console.error('Error updating preview:', error);
                // Display error in preview
                const preview = newFrame.contentDocument || (newFrame.contentWindow && newFrame.contentWindow.document);
                if (preview) {
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
            }
        }, 50);
    }

    const runBtn = document.getElementById('run-btn');
    if (runBtn) {
        runBtn.addEventListener('click', function() {
            updatePreview();
            createNotification('Code executed successfully!', 'success');
        });
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

    // Simplified resizable panels
    function setupResizablePanels() {
        const container = document.querySelector('.container');
        const editorContainer = document.querySelector('.editor-container');
        const previewContainer = document.querySelector('.preview-container');
        const resizeHandle = document.querySelector('.resize-handle');
        
        if (!container || !editorContainer || !previewContainer || !resizeHandle) {
            console.error('One or more resizing elements not found');
            return;
        }
        
        // Set initial width
        if (!editorContainer.style.width || !previewContainer.style.width) {
            editorContainer.style.width = '50%';
            previewContainer.style.width = '50%';
        }
        
        // Remove any flex properties that might interfere with resizing
        editorContainer.style.flex = 'none';
        previewContainer.style.flex = 'none';
        
        let isResizing = false;
        
        function startResize(e) {
            // Prevent default to avoid text selection
            e.preventDefault();
            isResizing = true;
            document.body.classList.add('resizing');
        }
        
        function endResize() {
            if (!isResizing) return;
            isResizing = false;
            document.body.classList.remove('resizing');
            
            // Refresh editors after resize
            setTimeout(refreshAllEditors, 50);
        }
        
        function doResize(e) {
            if (!isResizing) return;
            
            let position;
            if (e.type === 'mousemove') {
                position = e.clientX;
            } else if (e.type === 'touchmove' && e.touches[0]) {
                position = e.touches[0].clientX;
                e.preventDefault(); // Prevent scrolling during touch resize
            } else {
                return;
            }
            
            const containerRect = container.getBoundingClientRect();
            let percentage = (position - containerRect.left) / containerRect.width * 100;
            
            // Ensure reasonable limits (20-80%)
            percentage = Math.max(20, Math.min(80, percentage));
            
            editorContainer.style.width = percentage + '%';
            previewContainer.style.width = (100 - percentage) + '%';
        }
        
                // Mouse events
                resizeHandle.addEventListener('mousedown', startResize);
                document.addEventListener('mousemove', doResize);
                document.addEventListener('mouseup', endResize);
                
                // Touch events
                resizeHandle.addEventListener('touchstart', startResize, { passive: false });
                document.addEventListener('touchmove', doResize, { passive: false });
                document.addEventListener('touchend', endResize);
                document.addEventListener('touchcancel', endResize);
                
                // Ensure resize state is always cleared
                window.addEventListener('blur', endResize);
                document.addEventListener('mouseleave', endResize);
            }
            
            // Call the setup function
            setupResizablePanels();
        
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
                    
                    // Save theme preference
                    localStorage.setItem('editorTheme', isDarkMode ? 'dark' : 'light');
                });
                
                // Load saved theme preference
                const savedTheme = localStorage.getItem('editorTheme');
                if (savedTheme) {
                    const isDarkMode = savedTheme === 'dark';
                    if ((isDarkMode && !document.body.classList.contains('dark-mode')) || 
                        (!isDarkMode && document.body.classList.contains('dark-mode'))) {
                        themeToggle.click(); // Toggle to the saved theme
                    }
                }
            }
        
            // Save to localStorage function
            function saveToLocalStorage() {
                try {
                    const autoSaveData = {
                        html: htmlEditor.getValue(),
                        css: cssEditor.getValue(),
                        js: jsEditor.getValue(),
                        timestamp: new Date().toISOString()
                    };
                    
                    localStorage.setItem('autoSave', JSON.stringify(autoSaveData));
                    autoSaveIndicator.show();
                } catch (error) {
                    console.error('Error auto-saving to localStorage:', error);
                }
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
                        
                        // Check if name already exists
                        const existingIndex = savedSnippets.findIndex(s => s.name === snippetName);
                        if (existingIndex !== -1) {
                            const overwrite = confirm(`A snippet named "${snippetName}" already exists. Do you want to overwrite it?`);
                            if (overwrite) {
                                savedSnippets[existingIndex] = snippet;
                            } else {
                                return; // User cancelled
                            }
                        } else {
                            savedSnippets.push(snippet);
                        }
                        
                        localStorage.setItem('codeSnippets', JSON.stringify(savedSnippets));
                        createNotification('Snippet saved successfully!', 'success');
                    } catch (error) {
                        console.error('Error saving snippet:', error);
                        createNotification('Failed to save snippet', 'error');
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
                            createNotification('No saved snippets found', 'warning');
                            return;
                        }
                        
                        // Sort snippets by last modified date (newest first)
                        savedSnippets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                        
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
                        createNotification('Failed to load snippets', 'error');
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
                            createNotification(`Loaded snippet: ${snippet.name}`, 'success');
                        } else if (e.target.classList.contains('delete-snippet-btn')) {
                            const index = parseInt(e.target.getAttribute('data-index'));
                            if (isNaN(index) || index < 0 || index >= savedSnippets.length) {
                                console.error('Invalid snippet index');
                                return;
                            }
                            
                            if (confirm('Are you sure you want to delete this snippet?')) {
                                const deleted = savedSnippets.splice(index, 1)[0];
                                localStorage.setItem('codeSnippets', JSON.stringify(savedSnippets));
                                e.target.closest('li').remove();
                                
                                if (savedSnippets.length === 0) {
                                    savedSnippetsModal.style.display = 'none';
                                }
                                
                                createNotification(`Deleted snippet: ${deleted.name}`, 'warning');
                            }
                        }
                    } catch (error) {
                        console.error('Error handling snippet action:', error);
                        createNotification('An error occurred', 'error');
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
            
            // Close modal with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.style.display = 'none';
                    });
                }
            });
        
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
                        
                        // Web Share API if available (mobile)
                        if (navigator.share) {
                            const webShareBtn = document.createElement('button');
                            webShareBtn.textContent = 'Share via device';
                            webShareBtn.className = 'web-share-btn';
                            webShareBtn.style.marginTop = '10px';
                            
                            const container = copyLinkBtn.parentElement;
                            if (!container.querySelector('.web-share-btn')) {
                                container.appendChild(webShareBtn);
                            }
                            
                            webShareBtn.addEventListener('click', async () => {
                                try {
                                    await navigator.share({
                                        title: 'Check out my code',
                                        text: 'I created this with TouchCode Editor',
                                        url: shareUrl
                                    });
                                    createNotification('Shared successfully!', 'success');
                                } catch (error) {
                                    console.error('Error sharing:', error);
                                    // User probably cancelled, so we don't show an error
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Error creating share link:', error);
                        createNotification('Failed to create share link', 'error');
                    }
                });
                
                copyLinkBtn.addEventListener('click', function() {
                    try {
                        shareLink.select();
                        document.execCommand('copy');
                        
                        // Alternative method for newer browsers
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(shareLink.value);
                        }
                        
                        const originalText = this.textContent;
                        this.textContent = 'Copied!';
                        
                        setTimeout(() => {
                            this.textContent = originalText;
                        }, 2000);
                        
                        createNotification('Link copied to clipboard!', 'success');
                    } catch (error) {
                        console.error('Error copying to clipboard:', error);
                        createNotification('Failed to copy to clipboard', 'error');
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
                            if (!decompressed) {
                                throw new Error('Could not decompress code data');
                            }
                            
                            const codeData = JSON.parse(decompressed);
                            
                            htmlEditor.setValue(codeData.html || '');
                            cssEditor.setValue(codeData.css || '');
                            jsEditor.setValue(codeData.js || '');
                            
                            updatePreview();
                            
                            // Clean URL without reloading
                            window.history.replaceState({}, document.title, window.location.pathname);
                            
                            createNotification('Shared code loaded successfully!', 'success');
                        } catch (error) {
                            console.error('Failed to load shared code:', error);
                            createNotification('Invalid or corrupted shared code', 'error');
                        }
                    }
                } catch (error) {
                    console.error('Error in loadSharedCode:', error);
                }
            }
            
            // Load from local storage
            function loadFromLocalStorage() {
                try {
                    const savedData = localStorage.getItem('autoSave');
                    
                    if (savedData) {
                        try {
                            const data = JSON.parse(savedData);
                            
                            // Only prompt if there's actual content
                            const hasContent = 
                                (data.html && data.html.trim() !== '') || 
                                (data.css && data.css.trim() !== '') || 
                                (data.js && data.js.trim() !== '');
                            
                            // Check if data was saved in the last 24 hours
                            const saved = new Date(data.timestamp);
                            const now = new Date();
                            const hoursDiff = (now - saved) / (1000 * 60 * 60);
                            
                            if (hoursDiff < 24 && hasContent && !window.location.search.includes('code=')) {
                                if (confirm('Would you like to restore your previous session?')) {
                                    htmlEditor.setValue(data.html || '');
                                    cssEditor.setValue(data.css || '');
                                    jsEditor.setValue(data.js || '');
                                    updatePreview();
                                    createNotification('Previous session restored', 'success');
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
            
            // Check for shared code first, then check for auto-save data
            loadSharedCode();
            if (!window.location.search.includes('code=')) {
                loadFromLocalStorage();
            }
        
            // Handle tablet keyboard appearing/disappearing
            function setupResponsiveHandling() {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                
                window.addEventListener('resize', () => {
                    // Update viewport height custom property
                    const vh = window.innerHeight * 0.01;
                    document.documentElement.style.setProperty('--vh', `${vh}px`);
                    
                                // Refresh CodeMirror instances to prevent display issues
            setTimeout(() => {
                refreshAllEditors();
            }, 100);
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
    }
    
    setupResponsiveHandling();

    // Improved offline support notification
    function setupOfflineSupport() {
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        function updateOnlineStatus() {
            const status = navigator.onLine ? 'online' : 'offline';
            
            if (status === 'offline') {
                createNotification('You are currently offline. Your changes will be saved locally.', 'warning', 5000);
            } else {
                createNotification('You are back online!', 'success', 3000);
            }
        }
        
        // Initial check
        if (!navigator.onLine) {
            setTimeout(() => {
                updateOnlineStatus();
            }, 2000);
        }
    }
    
    setupOfflineSupport();

    // Enhanced mobile/tablet support
    function setupForTouchDevices() {
        // Detect if using a touch device
        if ('ontouchstart' in window || navigator.maxTouchPoints) {
            document.body.classList.add('touch-device');
            
            // Add extra padding to CodeMirror for better touch target
            document.querySelectorAll('.CodeMirror').forEach(editor => {
                editor.style.fontSize = '16px';
                editor.style.lineHeight = '1.5';
            });
            
            // Improve keyboard experience on iOS
            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                document.querySelectorAll('.CodeMirror').forEach(editor => {
                    editor.style.webkitUserSelect = 'text';
                });
            }
            
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
                            <li>Your code autosaves as you type</li>
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

    // Prevent accidental navigation away with improved checking
    window.addEventListener('beforeunload', function(e) {
        // Save before leaving
        saveToLocalStorage();
        
        // Show confirmation dialog if there are unsaved changes
        const defaultHtml = `<!DOCTYPE html>\n<html>\n<head>\n  <title>My Code</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>Start coding here</p>\n</body>\n</html>`;
        const defaultCss = `body {\n  font-family: Arial, sans-serif;\n  background-color: #f0f0f0;\n  margin: 0;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n}`;
        const defaultJs = `// Your JavaScript code here\nconsole.log('Hello from JavaScript!');`;
        
        const isHTMLModified = htmlEditor.getValue().trim() !== defaultHtml.trim();
        const isCSSModified = cssEditor.getValue().trim() !== defaultCss.trim();
        const isJSModified = jsEditor.getValue().trim() !== defaultJs.trim();
        
        if (isHTMLModified || isCSSModified || isJSModified) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });

    // Run the code once when the page loads
    setTimeout(updatePreview, 1000);
    
    // Initial auto-save to ensure session persistence
    setTimeout(saveToLocalStorage, 2000);
    
    // Add cleanup function to prevent memory leaks
    window.addEventListener('beforeunload', function() {
        clearInterval(autoSaveInterval);
    });
    
    // Add proper CSS to fix the resize handle
    function addResizeCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Resizing styles */
            body.resizing {
                user-select: none !important;
                -webkit-user-select: none !important;
                cursor: col-resize !important;
                pointer-events: none;
            }
            
            body.resizing .resize-handle {
                pointer-events: auto !important;
                background-color: var(--dark-accent) !important;
            }
            
            body.resizing * {
                cursor: inherit !important;
            }
            
            /* Mobile resizing */
            @media (max-width: 768px) {
                body.resizing {
                    cursor: row-resize !important;
                }
            }
            
            /* Improve resize handle visibility */
            .container {
                position: relative;
            }
            
            .resize-handle {
                position: relative;
                width: 12px;
                background-color: rgba(128, 128, 128, 0.3);
                transition: background-color 0.2s;
                z-index: 10;
                cursor: col-resize;
            }
            
            .resize-handle:hover {
                background-color: var(--dark-accent);
            }
            
            /* Better editor and preview container sizing */
            .editor-container, .preview-container {
                height: 100%;
                overflow: hidden;
                min-width: 20%;
            }
            
            /* Mobile layout */
            @media (max-width: 768px) {
                .container {
                    flex-direction: column;
                }
                
                .editor-container, .preview-container {
                    width: 100% !important;
                    height: auto;
                }
                
                .resize-handle {
                    width: 100%;
                    height: 12px;
                    cursor: row-resize;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    addResizeCSS();
    
    // For testing only - add a reset button
    function addResetButton() {
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset Layout';
        resetBtn.style.marginLeft = '10px';
        
        const actionDiv = document.querySelector('.actions');
        if (actionDiv) {
            actionDiv.appendChild(resetBtn);
            
            resetBtn.addEventListener('click', function() {
                const editorContainer = document.querySelector('.editor-container');
                const previewContainer = document.querySelector('.preview-container');
                
                if (editorContainer && previewContainer) {
                    editorContainer.style.width = '50%';
                    previewContainer.style.width = '50%';
                    refreshAllEditors();
                }
            });
        }
    }
    
    // Uncomment this line if you want to add a reset button
    // addResetButton();
});
