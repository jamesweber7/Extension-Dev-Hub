

function configureDefaults(options, default_vals, overwrite_vals) {
    Object.keys(default_vals).forEach(key => {
        options[key] = overwriteDefault(options[key], default_vals[key], overwrite_vals);
    })
    return options;
}

function overwriteDefault(param_val, default_val, overwrite_vals=[]) {
    return [undefined, ...overwrite_vals].includes(param_val) ? default_val : param_val;
}

function isBoolean(bool) {
    return typeof bool === "boolean";
}

// resizes textarea vertically when input enters new line
function resizeOnInput(textarea, options={}) {
    configureDefaults(options, {
        resize_on_init: true,
    })
    textarea.addEventListener('input', resizeTextarea)
    if (options.resize_on_init)
        setTimeout(resizeTextarea); // resize textarea at end of call stack

    function resizeTextarea(e) {
        const current_scrollY = window.scrollY;
        const current_scroll_offset = textarea.offsetTop - current_scrollY;

        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';

        window.scrollTo(0, textarea.offsetTop - current_scroll_offset);
    }
}

function onlyOneSelected(...buttons) {
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(button2 => {
                button2.classList.remove('selected');
            })
            button.classList.add('selected');
        })
    })
}

function formatJSONString(json_string) {
    return JSON.stringify(JSON.parse(json_string), null, 4);
}

function trimWhitespaceAroundNewlines(input) {
    return input
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim(); // also trim start and end of input
  }