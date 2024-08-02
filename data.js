const reserved_names = {
    'GUEST': 'GUEST',
    'USER': 'USER',
};
const sorting_schemas = {
    'MAGIC': 'MAGIC',
    'LAST_CREATED': 'LAST_CREATED',
    'FIRST_CREATED': 'FIRST_CREATED',
    'LAST_MODIFIED': 'LAST_MODIFIED',
    'TITLE_A_TO_Z': 'TITLE_A_TO_Z',
    'TITLE_Z_TO_A': 'TITLE_Z_TO_A',
}
const filters = {
    'ACTIVE_ON_SITE': 'ACTIVE_ON_SITE',
}
const match_patterns = {
    'ALL_URLS': '<all_urls>'
}
var max_chars = {
    'DESCRIPTION': 132,
    'TITLE': 75,
}

let default_data = {
    name: reserved_names.GUEST,
    sorting_schema: sorting_schemas.MAGIC,
    popup_width: 400,
    scripts: [

    ],
}

async function getScripts() {
    const data = await getData();
    return data.scripts;
}

async function getScript(script_id) {
    const scripts = await getScripts();
    for (const script of scripts) {
        if (script.id === script_id)
            return script;
    }
    return null;
}

// returns true if script is found
async function updateScript(script_data, options={}) {
    configureDefaults(options, {
        update_last_modified: true
    });
    await fixScriptData(script_data);
    const data = await getData();
    for (const i in data.scripts) {
        const script = data.scripts[i];
        if (script.id === script_data.id) {
            if (options.update_last_modified)
                script_data.last_modified = Date.now();
            data.scripts[i] = script_data;
            await setData(data);
            return true;
        }
    } 
    return false;
}

// update last used without updating last modified
async function scriptUsed(script_id) {
    const script_data = await getScript(script_id);
    script_data.last_used = Date.now();
    return await updateScript(script_data, {
        update_last_modified: false
    });
}

async function fixScriptData(script_data) {
    script_data.title = script_data.title.replaceAll(`"`, `'`);
    script_data.description = script_data.description.replaceAll(`"`, `'`);
}

async function createNewScript() {
    const script_id = await getNewScriptUID();
    const now = Date.now();
    const author = await getUserName();
    const title = 'Untitled Extension';
    const description = '';
    const content = defaultScript();
    const site_match = [match_patterns.ALL_URLS];
    const settings = {
        enabled: true
    };
    const new_script = {
        id: script_id,
        date_created: now,
        last_modified: now,
        last_used: now,
        author: author,
        title: title,
        description: description,
        content: content,
        site_match: site_match,
        settings: settings,
        version: 1
    };
    const data = await getData();
    data.scripts.push(new_script);
    await setData(data);
    return new_script;

    async function getNewScriptUID() {
        const scripts = await getScripts();
        if (!scripts.length)
            return '0';
        let highest = 0;
        scripts.forEach(script => {
            if (/^\d+$/.test(script.id) && Number.parseInt(script.id) > highest)
                highest = Number.parseInt(script.id);
        })
        return (highest+1).toString();
    }
}

async function getUserName() {
    const data = await getData();
    return data.name;
}

function defaultScript() {
    return '/*============================\n======= Your Code Here =======\n============================*/\nconsole.log("Hello, World!");';
}

async function deleteScript(script_id) {
    const data = await getData();
    const deleted = [];
    for (let i = 0; i < data.scripts.length; i++)
        while (i < data.scripts.length && data.scripts[i].id === script_id)
            deleted.concat(data.scripts.splice(i, 1));
    await setData(data);
    return deleted;
}

// matches all_urls
async function setSiteMatchAllSites(script_id) {
    return await setSiteMatch(script_id, [match_patterns.ALL_URLS]);
}

// remove all_urls identifier
async function setSiteMatchSomeSites(script_id) {
    const site_match = await getSiteMatch(script_id);
    while (site_match.includes(match_patterns.ALL_URLS))
        site_match.splice(site_match.indexOf(match_patterns.ALL_URLS), 1);
    return await setSiteMatch(script_id, site_match);
}

async function clearSiteMatch(script_id) {
    const data = await getData();
    const script_index = getScriptIndex(data, script_id);
    data.scripts[script_index].site_match = [];
    return await setData(data);
}

async function setSiteMatch(script_id, site_match) {
    await clearSiteMatch(script_id);
    // prune sites matches
    for (let i = 0; i < site_match.length; i++) {
        await addMatchPattern(script_id, site_match[i]);
    }
}

function parseMatchPattern(unparsed_match_pattern) {
    let match_pattern = unparsed_match_pattern.trim();
    match_pattern = match_pattern.replaceAll(`"`, `'`);
    while (match_pattern.includes("**"))
        match_pattern = match_pattern.replaceAll("**", "*");
    if (match_pattern === match_patterns.ALL_URLS || /^\*$|^\*:\/\/\*$|^\*\/\*$|^\*:\/\/\*(\/\*)*$|^\*(\/\*)*$/.test(match_pattern))
        return match_patterns.ALL_URLS;
    if (!match_pattern)
        return;
    // <scheme>://<host>/<path>
    const scheme_delimeter = '://';
    if (!match_pattern.includes(scheme_delimeter))
        match_pattern = `*${scheme_delimeter}${match_pattern}`;

    const match_pattern_after_scheme = match_pattern.substring(match_pattern.indexOf(scheme_delimeter) + scheme_delimeter.length);

    // make sure scheme is valid
    const scheme = match_pattern.substring(0, match_pattern.indexOf(scheme_delimeter));
    const accepted_schemes = [
        'http',
        'https',
        '*',
        // I don't really feel like handling file edge case rn
    ]
    if (!accepted_schemes.includes(scheme)) {
        if (accepted_schemes.includes(scheme.replaceAll('*', ''))) { // may have had * added to scheme
            match_pattern = `${scheme.replaceAll('*', '')}${scheme_delimeter}${match_pattern_after_scheme}`;
        } else {
            match_pattern = `*${match_pattern.substring(match_pattern.indexOf('*'))}`;
        }
    }

    const path_delimeter = '/';
    if (!match_pattern_after_scheme.includes(path_delimeter)) {
        if (match_pattern.includes('?') || match_pattern.includes('&')) {
            const i = match_pattern.search(/[?&]/);
            let included_kleene_star = (i >= 1 && match_pattern[i-1] === '*') ? '*' : '';
            match_pattern = `${match_pattern.substring(0, i)}${included_kleene_star}${path_delimeter}${included_kleene_star}${match_pattern.substring(i)}`;
        }
        if (match_pattern.endsWith('*')) {
            match_pattern = `${match_pattern}${path_delimeter}*`;
        } else {
            match_pattern = `${match_pattern}${path_delimeter}`;
        }
    }
    return match_pattern;
}

async function getSiteMatch(script_id) {
    const data = await getData();
    const script_index = getScriptIndex(data, script_id);
    return data.scripts[script_index].site_match;
}

function getScriptIndex(data, script_id) {
    for (const i in data.scripts)
        if (data.scripts[i].id === script_id)
            return i;
    return -1;
}

function runsOnAllSites(script_data) {
    return script_data.site_match.length === 1 && script_data.site_match[0] === match_patterns.ALL_URLS;
}

function runsOnlyWhenClicked(script_data) {
    return !script_data.site_match.length;
}

function runsOnSomeSites(script_data) {
    return !runsOnAllSites(script_data) && !runsOnlyWhenClicked(script_data);
}

async function addMatchPattern(script_id, match_pattern) {
    match_pattern = parseMatchPattern(match_pattern);
    if (!match_pattern)
        return;
    const data = await getData();
    const script_index = getScriptIndex(data, script_id);
    if (script_index < 0)
        return;
    const matches = data.scripts[script_index].site_match;

    if (matches.includes(match_pattern))
        return;

    matches.push(match_pattern);

    if (matches.includes(match_patterns.ALL_URLS))
        data.scripts[script_index].site_match = [match_patterns.ALL_URLS];

    await setData(data);
    return match_pattern;
}


function parseSiteMatchesAsReadableString(site_match) {
    const sites = site_match.copyWithin();

    for (const i in sites)
        sites[i] = sites[i].trim();
    for (const i in sites)
        while (i < sites.length && !sites[i].length)
            sites.splice(i, 1);

    if (!sites.length)
        return "Does not have any associated URLs"

    let readable_strings = [];
    for (const site of sites) {
        if (site === match_patterns.ALL_URLS)
            return "Runs on All URLs";
        if (site[site.length-1] === '*') {
            readable_strings.push(`URLs that start with "${site.substring(0, site.length-1)}"`);
        } else {
            readable_strings.push(`URLs matching "${site}"`);
        }
    }
    let readable_string = "";
    readable_string = "Runs on "
    readable_strings.forEach(str => {
        readable_string += `${str}, `
    })
    if (readable_string.endsWith(', '))
        readable_string = readable_string.substring(0, readable_string.lastIndexOf(', '));
    return readable_string;
}

function matchPatternToReadable(match_pattern) {
    return match_pattern;
}

async function duplicateExtension(script_id) {
    const script = await getScript(script_id);
    const duplicate = await createNewScript();
    duplicate.title = `${script.title} (copy)`;
    if (duplicate.title.length > max_chars.TITLE)
        duplicate.title = duplicate.title.substring(0, max_chars.TITLE);
    duplicate.description = script.description;
    duplicate.content = script.content;
    duplicate.site_match = script.site_match.copyWithin();
    duplicate.settings.enabled = script.settings.enabled;
    await updateScript(duplicate);
    return duplicate;
}

async function setExtensionScript(script_id, script_content) {
    const script_data = await getScript(script_id);
    script_data.content = script_content;
    return await updateScript(script_data);
}

async function incrementVersion(script_id) {
    const script_data = await getScript(script_id);
    script_data.version ++;
    return await updateScript(script_data, {
        update_last_modified: false // don't update last_modified
    });
}

async function getActiveScriptsMatchingURL(url) {
    const scripts = await getScripts();
    const matching_scripts = [];
    scripts.forEach(script_data => {
        if (!script_data.settings.enabled)
            return;
        for (const match_pattern of script_data.site_match) {
            if (urlMatchesMatchPattern(url, match_pattern)) {
                matching_scripts.push(script_data);
                return;
            }
        }
    })
    return matching_scripts;
}

function urlMatchesMatchPattern(url, match_pattern) {
    if (match_pattern === match_patterns.ALL_URLS || match_pattern === '*')
        return true;
    if (match_pattern === "") 
        return url === "";
    if (url === "" && match_pattern !== "") {
        return match_pattern.split('').every(char => char === '*');
    }

    if (match_pattern[0] === '*') {
        return urlMatchesMatchPattern(url, match_pattern.substring(1)) || (url.length > 0 && urlMatchesMatchPattern(url.substring(1), match_pattern));
    } else if (match_pattern[0] === url[0]) {
        return urlMatchesMatchPattern(url.substring(1), match_pattern.substring(1));
    }

    return false;
}

async function initializeDefaultData() {
    await setData(default_data);
    await createHelloWorldScript();
    let a = await getData()
    return await getData();
}

async function createHelloWorldScript() {
    const script_data = await createNewScript();
    script_data.title = 'Hello, World!';
    script_data.description = 'A simple Hello World program';
    script_data.content = "alert('Hello, World!');"
    await updateScript(script_data);
    await clearSiteMatch(script_data.id);
    return await getScript(script_data.id);
}