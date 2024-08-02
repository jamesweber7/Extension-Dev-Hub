

async function getUrl() {
    try {
        return await getDataFromActiveTab(message_titles.sendable_data.URL);
    } catch {
        return '';
    }
}

async function isActiveScript(script_id) {
    const active_scripts = await getActiveScripts();
    return active_scripts.some(active_script => active_script.id === script_id);
}

async function getActiveScripts() {
    try {
        return await getDataFromActiveTab(message_titles.sendable_data.ACTIVE_SCRIPTS);
    } catch {
        return [];
    }
}
