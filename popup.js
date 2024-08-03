
/*----------  Public  ----------*/
setup();

async function setup() {
    await setupUI();
    setupEventListeners();
}

async function setupUI() {
    await setUIToScriptsList();
}

function setupEventListeners() {
    const header = document.querySelector('header a');
    openLinkInNewTabOnClick(header);
}

function openLinkInNewTabOnClick(a) {
    a.addEventListener('click', e => {
        e.preventDefault();
        window.open(a.href, '_blank');
    });
}

async function setUIToViewScript(script_id) {
    const script_data = await getScript(script_id);

    const content = getContent();
    content.innerHTML = ''; // clear content section

    const editor = document.createElement('div');
    editor.className = 'editor';
    editor.setAttribute('script-id', script_data.id);
    content.append(editor);

    const toprow = document.createElement('div');
    toprow.classList.add('toprow', 'buttonrow');
    editor.append(toprow);

    const back_button = document.createElement('button');
    back_button.className = 'back';
    back_button.title = 'Go Back to Home'
    back_button.innerText = '🔙';
    back_button.addEventListener('click', setUIToScriptsList);
    toprow.append(back_button);

    // duplicate
    const duplicate_button = document.createElement('button');
    duplicate_button.title = 'Duplicate Extension'
    duplicate_button.className = 'duplicate';
    duplicate_button.innerText = '📋';
    duplicate_button.addEventListener('click', duplicateOpenExtension);
    toprow.append(duplicate_button);

    // upload
    const hidden_file_upload = document.createElement('input');
    hidden_file_upload.type = "file";
    hidden_file_upload.accept = '.js';
    hidden_file_upload.className = 'hidden';
    hidden_file_upload.addEventListener('change', uploadScriptToOpenExtension);
    toprow.append(hidden_file_upload);

    const upload_button = document.createElement('button');
    upload_button.title = 'Upload Script'
    upload_button.className = 'duplicate';
    upload_button.innerText = '📂';
    upload_button.addEventListener('click', () => {hidden_file_upload.click();});
    toprow.append(upload_button);

    const save_button = document.createElement('button');
    save_button.title = 'Download Extension'
    save_button.className = 'save';
    save_button.innerText = '💾';
    save_button.addEventListener('click', downloadOpenExtension);
    toprow.prepend(save_button);

    const delete_button = document.createElement('button');
    delete_button.title = 'Delete Extension'
    delete_button.className = 'delete';
    delete_button.innerText = '🗑️';
    delete_button.addEventListener('click', () => {
        if (confirm("This will permanently delete the extension")) {
            deleteScript(script_id).then(() => {
                back_button.click();
            })
        }
    });
    toprow.prepend(delete_button);

    const title_container = document.createElement('div');
    title_container.className = 'title-container';
    editor.append(title_container);
    
    const title = document.createElement('textarea');
    title.className = 'title';
    title.title = `Extension Name [Max ${max_chars.TITLE} characters]`;
    title.placeholder = `Extension Name [${max_chars.TITLE} characters]`;
    title.maxLength = max_chars.TITLE;
    title.value = script_data.title;
    title.rows = 1;
    title.addEventListener('input', extension_changed);
    resizeOnInput(title);
    title_container.append(title);

    const is_enabled = script_data.settings.enabled;
    // enabled switch
    const enabled_switch = document.createElement('label');
    enabled_switch.className = 'switch';
    if (is_enabled) {
        enabled_switch.title = 'Enabled';
    } else {
        enabled_switch.title = 'Disabled';
    }
    title_container.prepend(enabled_switch); // I really don't understand this css bit but for some reason this will be pushed below the title if it comes after it

    const checkbox_input = document.createElement('input');
    checkbox_input.className = 'enabled-input-checkbox';
    checkbox_input.checked = is_enabled;
    checkbox_input.type = 'checkbox';
    checkbox_input.addEventListener('change', () => {
        enableChanged(script_data, enabled_switch);
    });
    enabled_switch.append(checkbox_input);

    const slider = document.createElement('span');
    slider.className = 'slider';
    enabled_switch.append(slider);

    const site_match_container = document.createElement('div');
    site_match_container.className = 'site-match-container';
    editor.append(site_match_container);

    const runs_on_container = document.createElement('div');
    runs_on_container.className = 'runs-on-container';
    site_match_container.append(runs_on_container);

    const some_sites_control_container = document.createElement('div');
    
    const runs_on_message = document.createElement('span');
    runs_on_message.innerText = 'Runs on:';
    runs_on_container.append(runs_on_message);

    const all_sites_button = document.createElement('button');
    all_sites_button.innerText = 'All Sites';
    if (runsOnAllSites(script_data))
        all_sites_button.className = 'selected';
    all_sites_button.addEventListener('click', () => {
        setSiteMatchAllSites(script_id);
        some_sites_control_container.classList.add('hidden');
    })
    runs_on_container.append(all_sites_button);

    const some_sites_button = document.createElement('button');
    some_sites_button.innerText = 'Some Sites';
    if (!runsOnAllSites(script_data))
        some_sites_button.className = 'selected';
    some_sites_button.addEventListener('click', async () => {
        await setSiteMatchSomeSites(script_id);
        some_sites_control_container.classList.remove('hidden');
        await updateExistingMatchPatternsContainer();
    })
    runs_on_container.append(some_sites_button);

    // Not implementing this into manifest rn
    // const only_when_clicked_button = document.createElement('button');
    // only_when_clicked_button.innerText = 'Only When Clicked';
    // if (runsOnlyWhenClicked(script_data))
    //     only_when_clicked_button.className = 'selected';
    // only_when_clicked_button.addEventListener('click', () => {
    //     clearSiteMatch(script_id);
    //     some_sites_control_container.classList.add('hidden');
    // })
    // runs_on_container.append(only_when_clicked_button);

    onlyOneSelected(all_sites_button, some_sites_button);

    site_match_container.append(some_sites_control_container);
    some_sites_control_container.className = 'some-sites-control-containter';
    if (!some_sites_button.classList.contains('selected'))
        some_sites_control_container.classList.add('hidden');

    const site_match_pattern_container = document.createElement('div');
    site_match_pattern_container.className = 'site-match-pattern-container';
    updateExistingMatchPatternsContainer();
    some_sites_control_container.append(site_match_pattern_container);

    const new_site_input_container = document.createElement('div');
    new_site_input_container.className = 'new-site-input-containter';
    some_sites_control_container.append(new_site_input_container);

    const new_site_input = document.createElement('input');
    new_site_input.type = 'text';
    new_site_input.placeholder = 'URL or match pattern'
    new_site_input.title = 'URL or match pattern'
    new_site_input.value = await getUrl();
    new_site_input.className = 'new-site-match-pattern';
    new_site_input_container.append(new_site_input);

    const starts_with_button = document.createElement('button');
    starts_with_button.className = 'site-starts-with';
    starts_with_button.innerText = 'Starts With';
    starts_with_button.classList.add('selected');
    new_site_input_container.append(starts_with_button);

    const matches_exactly_button = document.createElement('button');
    matches_exactly_button.className = 'site-matches-exactly';
    matches_exactly_button.innerText = 'Exact match pattern';
    matches_exactly_button.title = 'Match URLs that match this match pattern exactly. Note that the kleene star (*) will still act as a match all pattern'
    new_site_input_container.append(matches_exactly_button);

    const includes_button = document.createElement('button');
    includes_button.className = 'site-includes';
    includes_button.innerText = 'Includes';
    new_site_input_container.append(includes_button);

    const add_site_button = document.createElement('button');
    add_site_button.className = 'add-site';
    add_site_button.title = 'Add match pattern';
    add_site_button.innerText = '+';
    add_site_button.addEventListener('click', addSiteClicked);
    new_site_input.addEventListener('keydown', e => {
        if (e.key === 'Enter')
            add_site_button.click();
    });
    new_site_input_container.append(add_site_button);

    onlyOneSelected(starts_with_button, matches_exactly_button, includes_button);

    const kleene_star_tip = document.createElement('span');
    kleene_star_tip.className = 'tip';
    kleene_star_tip.innerText = 'Tip: Use * to match any text. For example, https://example.com/*/ex will match any URLs starting with https://example.com/ and ending with /ex.\nMore Information on match patterns '
    const match_patterns_link = document.createElement('a');
    match_patterns_link.href = 'https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns';
    match_patterns_link.innerText = 'here';
    openLinkInNewTabOnClick(match_patterns_link);
    kleene_star_tip.append(match_patterns_link);
    new_site_input_container.append(kleene_star_tip);
    
    const description = document.createElement('textarea');
    description.className = 'description';
    description.title = `Description [Max ${max_chars.DESCRIPTION} characters]`;
    description.placeholder = `Description [Max ${max_chars.DESCRIPTION} characters]`;
    description.maxLength = max_chars.DESCRIPTION;
    description.value = script_data.description;
    description.rows = 1;
    description.addEventListener('input', extension_changed);
    resizeOnInput(description);
    editor.append(description);

    const code = document.createElement('textarea');
    code.className = 'code';
    code.spellcheck = false;
    code.title = 'Extension Code';
    code.placeholder = 'Write Code Here...';
    code.value = script_data.content;
    code.addEventListener('input', extension_changed);
    code.addEventListener('keydown', code_keydown);
    resizeOnInput(code);
    editor.append(code);

    const run_button = document.createElement('button');
    run_button.addEventListener('click', () => {
        executeScriptOnTab(script_data.id);
    })
    run_button.classList.add('run', 'fixed-corner-button');
    run_button.innerText = '🚀';
    run_button.title = 'Launch on Active Tab'
    editor.append(run_button);

    async function addSiteClicked() {
        const input = new_site_input.value;
        if (!input)
            return;
        let match_pattern;
        if (starts_with_button.classList.contains('selected')) {
            match_pattern = `${input}*`;
        } else if (matches_exactly_button.classList.contains('selected')) {
            match_pattern = input;
        } else if (includes_button.classList.contains('selected')) {
            match_pattern = `*${input}*`;
        }
        let pattern_added = await addMatchPattern(script_id, match_pattern);
        if (pattern_added) {
            new_site_input.value = '';
            addMatchPatternButton(pattern_added);
        }
    }
    
    async function updateExistingMatchPatternsContainer() {
        site_match_pattern_container.innerHTML = '';
        const site_match = await getSiteMatch(script_id);
        site_match.forEach(match_pattern => {
            addMatchPatternButton(match_pattern);
        })
    }

    function addMatchPatternButton(match_pattern) {
        const existing_match_pattern_container = document.createElement('div');
        existing_match_pattern_container.className = 'match-pattern-button-container';
        existing_match_pattern_container.setAttribute('match-pattern', match_pattern);
        site_match_pattern_container.append(existing_match_pattern_container);

        const site_span = document.createElement('span');
        site_span.className = 'existing-match-pattern';
        site_span.innerText = matchPatternToReadable(match_pattern);
        existing_match_pattern_container.append(site_span);

        const del_btn = document.createElement('button');
        del_btn.className = 'delete-match-pattern-button';
        del_btn.title = 'Delete Match Pattern';
        del_btn.innerText = '×';
        del_btn.addEventListener('click', () => {
            existing_match_pattern_container.remove();
            updateMatchPatternsFromUI();
        })
        existing_match_pattern_container.append(del_btn);
    }

    function updateMatchPatternsFromUI() {
        const match_pattern_containers = [...document.querySelectorAll('.match-pattern-button-container')];
        const matches = [];
        match_pattern_containers.forEach(container => {
            matches.push(container.getAttribute('match-pattern'));
        })
        setSiteMatch(script_id, matches);
    }
}

async function setUIToScriptsList() {
    const data = await getData();
    const scripts = data.scripts;
    const active_scripts = await getActiveScripts();

    const content = getContent();
    content.innerHTML = ''; // clear content section

    const scripts_container = document.createElement('div');
    scripts_container.className = 'scripts-container'
    content.append(scripts_container);
    
    for (const script_data of scripts) {
        const active = active_scripts.some(active_script => active_script.id === script_data.id);
        const script_section = await createScriptSection(script_data, { active: active });
        scripts_container.append(script_section);
    }

    const add_button = document.createElement('button');
    add_button.classList.add('add', 'fixed-corner-button');
    add_button.innerText = '➕';
    add_button.title = 'Create new extension'
    add_button.addEventListener('click', async () => {
        const new_script = await createNewScript();
        setUIToViewScript(new_script.id);
    })
    content.append(add_button);
}

async function createScriptSection(script_data, options={}) {
    const script_id = script_data.id;
    if (!isBoolean(options.active)) // do this outside of configureDefaults so isActiveScript doesn't get called when not necessary
        options.active = await isActiveScript(script_data.id);
    configureDefaults(options, {
    })
    const script_section = document.createElement('section');
    script_section.className = 'script';
    script_section.setAttribute('script-id', script_data.id);

    const title_container = document.createElement('div');
    title_container.className = 'title-container';
    script_section.append(title_container);

    const title = document.createElement('span');
    title.className = 'title';
    title.innerText = script_data.title;
    title_container.append(title);

    const active_icon = document.createElement('span');
    active_icon.className = 'active-icon';
    updateActiveIcon(options.active);
    title.append(active_icon);

    const is_enabled = script_data.settings.enabled;
    // enabled switch
    const enabled_switch = document.createElement('label');
    enabled_switch.className = 'switch';
    if (is_enabled) {
        enabled_switch.title = 'Enabled';
    } else {
        enabled_switch.title = 'Disabled';
    }
    title_container.append(enabled_switch);

    const checkbox_input = document.createElement('input');
    checkbox_input.className = 'enabled-input-checkbox';
    checkbox_input.checked = is_enabled;
    checkbox_input.type = 'checkbox';
    checkbox_input.addEventListener('change', () => {
        enableChanged(script_data, enabled_switch);
    });
    enabled_switch.append(checkbox_input);

    const slider = document.createElement('span');
    slider.className = 'slider';
    enabled_switch.append(slider);


    const site_match_pattern = document.createElement('span');
    site_match_pattern.className = 'site-match';
    site_match_pattern.innerText = parseSiteMatchesAsReadableString(script_data.site_match);
    script_section.append(site_match_pattern);

    const description = document.createElement('span');
    description.className = 'description';
    description.innerText = script_data.description;
    script_section.append(description);

    const buttonrow = document.createElement('div');
    buttonrow.className = 'buttonrow';
    script_section.append(buttonrow);

    const run_button = document.createElement('button');
    run_button.addEventListener('click', () => {
        executeScriptOnTab(script_data.id);
        updateActiveIcon(true);
    })
    run_button.className = 'run';
    run_button.innerText = '🚀';
    run_button.title = 'Launch on Active Tab'
    buttonrow.append(run_button);

    const view_button = document.createElement('button');
    view_button.addEventListener('click', () => {
        viewScript(script_id);
    })
    view_button.className = 'view';
    view_button.innerText = '🔎';
    view_button.title = 'View and Edit Extension'
    buttonrow.append(view_button);

    // duplicate
    const duplicate_button = document.createElement('button');
    duplicate_button.title = 'Duplicate Extension'
    duplicate_button.className = 'duplicate';
    duplicate_button.innerText = '📋';
    duplicate_button.addEventListener('click', async () => {
        await duplicateExtension(script_id);
        await setUIToScriptsList();
    });
    buttonrow.append(duplicate_button);

    // download
    const save_button = document.createElement('button');
    save_button.title = 'Download Extension'
    save_button.className = 'save';
    save_button.innerText = '💾';
    save_button.addEventListener('click', () => {
        downloadExtension(script_id);
    });
    buttonrow.append(save_button);


    return script_section;

    function updateActiveIcon(active) {
        if (active) {
            active_icon.classList.add('active');
            active_icon.title = 'Actively running on tab';
        } else {
            active_icon.classList.remove('active');
            active_icon.title = 'Not actively running on tab';
        }
    }
}

function getContent() {
    return document.querySelector('main content');
}

async function enableChanged(script_data, enabled_switch) {
    const script = await getScript(script_data.id);
    script.settings.enabled = enabled_switch.querySelector('.enabled-input-checkbox').checked;
    await updateScript(script);
    if (script.settings.enabled) {
        enabled_switch.title = 'Enabled';
    } else {
        enabled_switch.title = 'Disabled';
    }
}

function executeScriptOnTab(script_id) {
    sendMessageToTab(message_titles.EXECUTE_SCRIPT, script_id);
}

function viewScript(script_id) {
    setUIToViewScript(script_id);
}

async function extension_changed(e) {
    const script_data = await parseOpenScript();

    if (e.ctrlKey) {
        switch (e.key) {
            case 'Enter':
                return executeScriptOnTab(script_data);
        }
    }

    // save script
    await updateScript(script_data);
}

// control tab and ctrl+l
function code_keydown(e) {
    if (!(e.key === 'Tab' && !e.ctrlKey)
    &&  !(e.key === 'l' && e.ctrlKey)
    &&  !(e.key === 'Enter' && !e.ctrlKey))
        return;

    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selection = value.substring(start, end);

    // Helper function to get the start of the line
    const getLineStart = (index) => {
        let lineStart = value.lastIndexOf('\n', index - 1);
        return lineStart === -1 ? 0 : lineStart + 1;
    };

    // Helper function to get the end of the line
    const getLineEnd = (index) => {
        let lineEnd = value.indexOf('\n', index);
        return lineEnd === -1 ? value.length : lineEnd;
    };

    if (e.key === 'Tab') {
        e.preventDefault();
        if (e.ctrlKey) {
            if (selection.length === 0) { // No selection, remove indent from the current line
                const lineStart = getLineStart(start);
                const beforeLine = value.substring(0, lineStart);
                const lineContent = value.substring(lineStart, end);
                const afterLine = value.substring(end);

                if (lineContent.startsWith('\t')) {
                    textarea.value = beforeLine + lineContent.substring(1) + afterLine;
                    textarea.selectionStart = textarea.selectionEnd = start - 1;
                }

            } else { // Selection exists, remove indent from all selected lines
                const lineStart = getLineStart(start);
                const lineEnd = getLineEnd(end);
                const selectedText = value.substring(lineStart, lineEnd);
                const lines = selectedText.split('\n');
                let removedTabsCount = 0;

                const unindentedLines = lines.map(line => {
                    if (line.startsWith('\t')) {
                        removedTabsCount++;
                        return line.substring(1);
                    }
                    return line;
                }).join('\n');

                const starts_with_tab = lines[0].startsWith('\t')

                textarea.value = value.substring(0, lineStart) + unindentedLines + value.substring(lineEnd);
                textarea.selectionStart = start - (starts_with_tab ? 1 : 0);
                textarea.selectionEnd = end - removedTabsCount;
            }
        } else {
            if (selection.length === 0) { // No selection, just indent the current position
                const beforeCursor = value.substring(0, start);
                const afterCursor = value.substring(start);

                textarea.value = beforeCursor + '\t' + afterCursor;
                textarea.selectionStart = textarea.selectionEnd = start + 1;
            } else { // Selection exists, indent all selected lines
                const lineStart = getLineStart(start);
                const lineEnd = getLineEnd(end);
                const selectedText = value.substring(lineStart, lineEnd);
                const lines = selectedText.split('\n');
                const indentedLines = lines.map(line => '\t' + line).join('\n');

                textarea.value = value.substring(0, lineStart) + indentedLines + value.substring(lineEnd);
                textarea.selectionStart = start+1;
                textarea.selectionEnd = end + lines.length; // Adjust end selection position
            }
        }
    } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        const lineStart = getLineStart(start);
        const lineEnd = getLineEnd(start);

        textarea.selectionStart = lineStart;
        textarea.selectionEnd = lineEnd+1;
    } else if (e.key === 'Enter' && !e.ctrlKey) {
        textarea.addEventListener('input', addIndent);
        return;

        function addIndent() {
            const lineStart = getLineStart(start);
            let i = lineStart;
            while (i < textarea.value.length && i < start && textarea.value[i] === '\t') {
                i++;
                textarea.value = `${textarea.value.substring(0, start+1)}\t${textarea.value.substring(start+1)}`;
            }
            textarea.removeEventListener('input', addIndent);
        }
    }
    extension_changed(e);
}


async function parseOpenScript() {
    const script_id = getOpenScriptId();
    const script_data = await getScript(script_id);

    const title_el = document.querySelector('.editor .title');
    title_el.value = title_el.value.replaceAll(`"`, `'`);
    script_data.title = title_el.value;

    const description_el = document.querySelector('.editor .description');
    description_el.value = description_el.value.replaceAll(`"`, `'`);
    script_data.description = description_el.value;

    script_data.content = document.querySelector('.editor .code').value;
    
    return script_data;
}

async function downloadOpenExtension() {
    const script_id = getOpenScriptId();
    return await downloadExtension(script_id);
}

async function duplicateOpenExtension() {
    const script_id = getOpenScriptId();
    const duplicate = await duplicateExtension(script_id);
    await setUIToViewScript(duplicate.id);
    return duplicate;
}

function uploadScriptToOpenExtension() {
    if (!this.files.length) {
        return;
    }
    const file = this.files[0];
    const fr=new FileReader();
    fr.onload = async () => {
        await setOpenExtensionScript(fr.result);
        // just reload extension page
        setUIToViewScript(getOpenScriptId());
    }
    fr.readAsText(file);
}

async function setOpenExtensionScript(script_content) {
    const script_id = getOpenScriptId();
    return await setExtensionScript(script_id, script_content);
}

function getOpenScriptId() {
    return document.querySelector('.editor').getAttribute('script-id');
}

// uses external libraries JSZip and FileSaver
async function downloadExtension(script_id) {
    // use JSZip to create zip file
    const zip = new JSZip();
    const script_data = await getScript(script_id);
    await incrementVersion(script_id);

    let icons_added;
    try {
        if (!script_data.title)
            script_data.title = 'Untitled Extension';
        const icon_blobs = await createIconBlobs(script_data.title[0]);
        zip.file("icon128.png", icon_blobs["128"]);
        zip.file("icon48.png", icon_blobs["48"]);
        zip.file("icon16.png", icon_blobs["16"]);
        icons_added = true;
    } catch {
        icons_added = false;
    }
    try {
        zip.file("manifest.json", getManifestContent(script_data, icons_added));
    } catch {
        alert("Something went wrong trying to create your extension's manifest.json file, so it unfortunately cannot be downloaded with the rest of your files.");
        return;
    }
    zip.file("content.js", getFullDownloadedExtensionContent(script_data));
    const readme = getReadmeContent(script_data);
    zip.file("README.md", readme);
    zip.file("Extension_Dev_Hub.md", readme);

    const zip_content = await zip.generateAsync({ type: "blob" });

    // Use FileSaver to save file
    saveAs(zip_content, getExtensionZipFileName(script_data));
}

function getManifestContent(script_data, icons_added) {
    return formatJSONString(`{
        "manifest_version": 3,
        "version": "${getVersionString(script_data)}",
        "name": "${script_data.title}",
        "description": "${script_data.description}",
        "host_permissions": ${getMatchPatternsForManifest(script_data.site_match)},
        "content_scripts": [
            {
                "matches": ${getMatchPatternsForManifest(script_data.site_match)},
                "js": ["content.js"]
            }
        ],
        "icons": {
            ${iconsManifestText()}
        }
    }`);

    function iconsManifestText() {
        if (!icons_added)
            return '';
        return `"16" : "icon16.png",
                "48" : "icon48.png",
                "128": "icon128.png"`
    }
}

function getMatchPatternsForManifest(site_match) {
    let matches = "[";
    site_match.forEach(match => {
        matches += `"${match}", `;    
    });
    if (matches.endsWith(", "))
        matches = matches.substring(0, matches.lastIndexOf(", "));
    matches += "]";
    return matches;
}

function getReadmeContent(script_data) {
    return trimWhitespaceAroundNewlines(`
    # ${script_data.title}
    ### ${script_data.description}

    Created in part with [Extension Dev Hub](https://github.com/jamesweber7/Extension-Dev-Hub)

    Version ${getVersionString(script_data)}
    `);
}

function getFullDownloadedExtensionContent(script_data) {
    return script_data.content;
}

function getVersionString(script_data) {
    return `0.0.${script_data.version}`;
}

function getExtensionZipFileName(script_data) {
    const title = script_data.title.replaceAll(' ', '_');
    return `${title}${getVersionString(script_data)}.zip`;
}

async function createIconBlobs(char) {
    const blobs = {};
    const sizes = [16, 48, 128];
    for (const size of sizes) {
        blobs[size] = await createIconBlob(char, size);
    }
    return blobs;
}

async function createIconBlob(char, size) {
    return new Promise((resolve, reject) => {
        // const canvas = document.getElementById('canvas');
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const img = new Image(size, size);
        img.src = `icon_no_text${size}.png`;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        
            // Add text on top of the image
            ctx.font = `${100/128*size}px 'lucida console'`;
            ctx.fillStyle = '#2196F3';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let x_center, y_center;
            // the different sizes look better with different offsets
            if (size === 128) {
                x_center = canvas.width * 0.4;
                y_center = canvas.height * 0.62;
            } else if (size === 48) {
                x_center = canvas.width * 0.36;
                y_center = canvas.height * 0.65;
            } else if (size === 16) {
                x_center = canvas.width * 0.37;
                y_center = canvas.height * 0.62;
            }
            ctx.fillText(char, x_center, y_center);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas to Blob conversion failed'));
                }
            });

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
        }
    });
}