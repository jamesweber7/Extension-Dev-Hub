
async function executeScript(script_id) {
    const script_data = await getScript(script_id);
    configureDefaults(script_data, {
        content: '',
        title: 'Untitled Script'
    });
    try {
        new Function('', script_data.content)();
        await scriptUsed(script_data.id);
        active_scripts.push(script_data);
    } catch (e) {
        console.error(`Error Executing Script ${script_data.title}`);
        console.error(e);
    }
}

function getCurrentTabUrl() {
    return window.location.href;
}

function getActiveScripts() {
    return active_scripts;
}

async function runScriptsForCurrentUrl() {
    const url = getCurrentTabUrl();
    const scripts = await getActiveScriptsMatchingURL(url);
    scripts.forEach(script_data => {
        executeScript(script_data.id);
    });
}
