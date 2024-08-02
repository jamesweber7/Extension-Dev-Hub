const storage_keys = {
    head: 'extensions_dev_hub'
};

function isDataInitialized(data) {
    return !!Object.keys(data).length;
}

function getData() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([storage_keys.head], (data) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                if (isDataInitialized(data)) {
                    resolve(data[storage_keys.head]);
                } else {
                    initializeDefaultData().then(resolve).catch(reject);
                }
            }
        });
    });
}

async function setData(data) {
    let root = {};
    root[storage_keys.head] = data;
    return await chrome.storage.local.set(root);
}

async function clearData() {
    return await chrome.storage.local.clear();
}