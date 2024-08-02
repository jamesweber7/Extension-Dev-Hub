
function tabReceivedMessage(message) {
    switch (message.title) {
        case message_titles.REQUEST:
            return processRequest(message.content.sendable_data_title, message.content);
        case message_titles.EXECUTE_SCRIPT:
            return executeScript(message.content);
    }
}

function sendMessageToPopup(title, content={}) {
    chrome.runtime.sendMessage({
        title: title,
        content: content,
        recipient: recipients.POPUP
    });
}

function sendResponseDataToPopup(sendable_data_title, data) {
    sendMessageToPopup(message_titles.RESPONSE, {
        sendable_data_title: sendable_data_title,
        data: data,
    })
}

function sendUrlToPopup() {
    sendResponseDataToPopup(message_titles.sendable_data.URL, getCurrentTabUrl())
}

function sendActiveScriptsToPopup() {
    sendResponseDataToPopup(message_titles.sendable_data.ACTIVE_SCRIPTS, getActiveScripts())
}

function processRequest(sendable_data_title, content) {
    switch (sendable_data_title) {
        case message_titles.sendable_data.URL:
            return sendUrlToPopup();
        case message_titles.sendable_data.ACTIVE_SCRIPTS:
            return sendActiveScriptsToPopup();
    }
}