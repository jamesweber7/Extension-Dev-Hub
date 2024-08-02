const recipients = {
    TAB : 'TAB',
    POPUP : 'POPUP',
}

var message_titles = {
    REQUEST: 'REQUEST',
    RESPONSE: 'RESPONSE',
    EXECUTE_SCRIPT : 'EXECUTE_SCRIPT',
    sendable_data : {
        URL: 'URL',
        ACTIVE_SCRIPTS: 'ACTIVE_SCRIPTS'
    }
}

chrome.runtime.onMessage.addListener(receivedMessage);

function receivedMessage(message) {
    switch (message.recipient) {
        case recipients.TAB:
            return tabReceivedMessage(message);
        case recipients.POPUP:
            return popupReceivedMessage(message);
    }
}