document.addEventListener('DOMContentLoaded', function() {
    
    // --- DATA ---
    const rawToolsData = {
        "Popular Tools": [
            "PDF Multi Tool", "Merge PDF", "Split PDF", "Compress PDF", 
            "PDF Editor", "JPG to PDF", "Sign PDF", "Crop PDF", 
            "Extract Pages", "Duplicate & Organize", "Delete Pages"
        ],
        "Edit & Annotate": [
            "PDF Editor", "Edit Bookmarks", "Table of Contents", "Page Numbers", 
            "Header & Footer", "Invert Colors", "Background Color", "Change Text Color", 
            "Add Stamps", "Remove Annotations", "Crop PDF", "PDF Form Filler", 
            "Create PDF Form", "Remove Blank Pages"
        ],
        "Convert to PDF": [
            "Image to PDF", "JPG to PDF", "PNG to PDF", "WebP to PDF", 
            "SVG to PDF", "BMP to PDF", "HEIC to PDF", "TIFF to PDF", 
            "Text to PDF", "JSON to PDF"
        ],
        "Convert from PDF": [
            "PDF to JPG", "PDF to PNG", "PDF to WebP", "PDF to BMP", 
            "PDF to TIFF", "PDF to Greyscale", "PDF to JSON"
        ],
        "Organize & Manage": [
            "OCR PDF", "Merge PDF", "Altemate & Mix Pages", "Duplicate & Organize", 
            "Add Attachments", "Extract Attachments", "Edit Attachments", 
            "PDF Multi Tool", "Split PDF", "Divide Pages", "Extract Pages", 
            "Delete Pages", "Add Blank Page", "Reverse Pages", "Rotate PDF", 
            "N-Up PDF", "Combine to Single Page", "View Metadata", "Edit Metadata", 
            "PDFs to ZIP", "Compare PDFs", "Posterize PDF"
        ],
        "Optimize & Repair": [
            "Compress PDF", "Fix Page Size", "Linearize PDF", "Page Dimensions", 
            "Remove Restrictions", "Repair PDF"
        ],
        "Secure PDF": [
            "Encrypt PDF", "Sanitize PDF", "Decrypt PDF", "Flatten PDF", 
            "Remove Metadata", "Change Permissions"
        ]
    };

    // --- MAPPINGS ---
    const urlOverrides = {
        "pdf editor": "edit-pdf",
        "edit bookmarks": "bookmark",
        "header & footer": "header-footer",
        "change text color": "text-color",
        "pdf form filler": "form-filler",
        "create pdf form": "form-creator",
        "altemate & mix pages": "alternate-merge",
        "alternate & mix pages": "alternate-merge",
        "combine to single page": "combine-single-page",
        "pdfs to zip": "pdf-to-zip",
        "text to pdf": "txt-to-pdf",
        "duplicate & organize": "organize-pdf"
    };

    // --- STATE MANAGEMENT ---
    let userPrefs = { favorites: [], disabled: [] };
    // Using a different local storage key so prefs don't conflict with the other extension version
    const storedPrefs = localStorage.getItem('bentoComUserPrefs');
    if (storedPrefs) userPrefs = JSON.parse(storedPrefs);

    function savePrefs() {
        localStorage.setItem('bentoComUserPrefs', JSON.stringify(userPrefs));
        renderMainView();
    }

    // --- DOM ---
    const container = document.getElementById('main-container');
    const searchInput = document.getElementById('search-input');
    const homeBtn = document.getElementById('home-btn');
    const settingsBtn = document.getElementById('open-settings');
    const closeSettingsBtn = document.getElementById('close-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsContent = document.getElementById('settings-content');

    // --- NAVIGATION ---
    function navigateTo(url, event) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            const isNewTab = currentTab && currentTab.title && currentTab.title.includes("New Tab");
            const isModifierClick = event && (event.ctrlKey || event.metaKey || event.button === 1);

            if (isNewTab || isModifierClick) {
                chrome.tabs.update(currentTab.id, {url: url});
            } else {
                chrome.tabs.create({url: url});
            }
        });
    }

    function openUrl(path, event) {
        let slug;
        const lowerPath = path.toLowerCase();
        if (urlOverrides[lowerPath]) slug = urlOverrides[lowerPath];
        else slug = lowerPath.trim().split(' ').join('-');
        
        // UPDATED LOGIC: bentopdf.com and .html suffix
        const fullUrl = `https://bentopdf.com/${slug}.html`;
        navigateTo(fullUrl, event);
    }

    if (homeBtn) {
        // Home button points to root of bentopdf.com
        homeBtn.addEventListener('click', (e) => navigateTo('https://bentopdf.com/', e));
        homeBtn.addEventListener('auxclick', (e) => {
            if(e.button === 1) { e.preventDefault(); navigateTo('https://bentopdf.com/', e); }
        });
    }

    // --- RENDER MAIN ---
    function renderMainView(filterText = "") {
        container.innerHTML = "";
        const filter = filterText.toLowerCase();

        let displayData = {};
        if (userPrefs.favorites.length > 0) displayData["FAVORITES"] = userPrefs.favorites;

        for (const [cat, tools] of Object.entries(rawToolsData)) {
            const visibleTools = tools.filter(t => !userPrefs.disabled.includes(t));
            if (visibleTools.length > 0) displayData[cat] = visibleTools;
        }

        const allHeaders = [];
        const allGrids = [];

        for (const [category, tools] of Object.entries(displayData)) {
            const matchingTools = tools.filter(t => t.toLowerCase().includes(filter));
            if (filter && matchingTools.length === 0) continue;

            const section = document.createElement('div');
            const header = document.createElement('div');
            header.className = 'category-header';
            if (category === "FAVORITES") header.style.color = "#fbbf24";
            header.innerText = category;
            
            const grid = document.createElement('div');
            grid.className = 'tool-grid';
            grid.style.display = 'grid'; 
            grid.style.overflow = 'hidden';
            grid.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            const setClosedState = (el) => {
                el.classList.remove('show');
                el.style.maxHeight = '0px';
                el.style.opacity = '0';
                el.style.paddingTop = '0px';
                el.style.paddingBottom = '0px';
                el.style.marginTop = '0px';
            };

            const setOpenState = (el) => {
                el.classList.add('show');
                el.style.paddingTop = '10px';
                el.style.paddingBottom = '5px';
                el.style.marginTop = '0px';
                el.style.maxHeight = (el.scrollHeight + 500) + "px";
                el.style.opacity = '1';
            };

            setClosedState(grid);
            allHeaders.push(header);
            allGrids.push(grid);

            if (filter || category === "FAVORITES" || category === "Popular Tools") {
                setOpenState(grid);
                header.classList.add('active');
            }

            header.addEventListener('click', () => {
                const isCurrentlyOpen = grid.classList.contains('show');
                allGrids.forEach(g => setClosedState(g));
                allHeaders.forEach(h => h.classList.remove('active'));

                if (!isCurrentlyOpen) {
                    setOpenState(grid);
                    header.classList.add('active');
                }
            });

            matchingTools.forEach((toolName, index) => {
                const btn = document.createElement('button');
                btn.className = 'tool-btn';
                btn.innerText = toolName;
                btn.style.animationDelay = `${index * 20}ms`;

                if (userPrefs.favorites.includes(toolName) && category !== "FAVORITES") {
                    const star = document.createElement('span');
                    star.className = 'fav-marker';
                    star.innerHTML = '★';
                    btn.appendChild(star);
                }

                btn.addEventListener('click', (e) => openUrl(toolName, e));
                btn.addEventListener('auxclick', (e) => {
                    if (e.button === 1) { e.preventDefault(); openUrl(toolName, e); }
                });

                grid.appendChild(btn);
            });

            section.appendChild(header);
            section.appendChild(grid);
            container.appendChild(section);
        }
    }

    // --- RENDER SETTINGS ---
    function renderSettings() {
        settingsContent.innerHTML = "";
        
        for (const [category, tools] of Object.entries(rawToolsData)) {
            const catContainer = document.createElement('div');
            catContainer.className = 'settings-category';
            const catTitle = document.createElement('div');
            catTitle.className = 'settings-cat-title';
            catTitle.innerText = category;
            catContainer.appendChild(catTitle);

            tools.forEach(tool => {
                const row = document.createElement('div');
                row.className = 'setting-row';
                const name = document.createElement('span');
                name.className = 'setting-name';
                name.innerText = tool;

                const actions = document.createElement('div');
                actions.className = 'setting-actions';

                const favBtn = document.createElement('button');
                const isFav = userPrefs.favorites.includes(tool);
                favBtn.className = `action-btn ${isFav ? 'active-fav' : ''}`;
                favBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
                favBtn.onclick = () => {
                    if (isFav) userPrefs.favorites = userPrefs.favorites.filter(f => f !== tool);
                    else userPrefs.favorites.push(tool);
                    savePrefs();
                    renderSettings();
                };

                const visBtn = document.createElement('button');
                const isHidden = userPrefs.disabled.includes(tool);
                visBtn.className = `action-btn ${isHidden ? 'inactive-vis' : 'active-vis'}`;
                visBtn.innerHTML = isHidden 
                    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
                    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
                visBtn.onclick = () => {
                    if (isHidden) userPrefs.disabled = userPrefs.disabled.filter(d => d !== tool);
                    else userPrefs.disabled.push(tool);
                    savePrefs();
                    renderSettings();
                };

                actions.appendChild(favBtn);
                actions.appendChild(visBtn);
                row.appendChild(name);
                row.appendChild(actions);
                catContainer.appendChild(row);
            });
            settingsContent.appendChild(catContainer);
        }
    }

    settingsBtn.addEventListener('click', () => {
        renderSettings();
        settingsPanel.classList.add('open');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsPanel.classList.remove('open');
    });

    searchInput.addEventListener('input', (e) => renderMainView(e.target.value));

    renderMainView();
});