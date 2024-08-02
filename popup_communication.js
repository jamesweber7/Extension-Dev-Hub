
function popupReceivedMessage(message) {
    document.dispatchEvent(new CustomEvent(message.title, {
        detail: { content: message.content }
    }));
    switch (message.title) {

    }
}

function sendMessageToTab(title, content={}) {
    let tabParameters = {
        active: true,
        currentWindow: true
    };
    chrome.tabs.query(tabParameters, onGotTabs);

    function onGotTabs(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            title: title,
            content: content,
            recipient: recipients.TAB
        });
    }
}

function requestDataFromTab(sendable_data_title, options={}) {
    configureDefaults(options, {
        content: {}
    });
    sendMessageToTab(message_titles.REQUEST, {
        sendable_data_title: sendable_data_title,
        content: options.content
    });
}

async function getDataFromActiveTab(sendable_data_title, options={}) {
    configureDefaults(options, {
        send_content: {},
        timeout: 0.1e3,
    })
    return new Promise((resolve, reject) => {
        setTimeout(reject, options.timeout);
        document.addEventListener(message_titles.RESPONSE, onreceiveevent);
        requestDataFromTab(sendable_data_title, options.send_content);

        function onreceiveevent(e) {
            if (e.detail.content.sendable_data_title !== sendable_data_title)
                return;
            document.removeEventListener(message_titles.RESPONSE, onreceiveevent);
            resolve(e.detail.content.data);
        }
    });
}