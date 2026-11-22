function getTextarea() {
    return document.querySelector('#send_textarea');
}

function dispatchInput(textarea) {
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
}

export function appendToInput(text) {
    const textarea = getTextarea();
    if (!textarea) throw new Error('未找到 SillyTavern 输入框 #send_textarea');

    const current = textarea.value ?? '';
    const separator = current.trim().length ? '\n' : '';
    textarea.value = `${current}${separator}${text}`;
    dispatchInput(textarea);
}

export function removeFromInput(text) {
    const textarea = getTextarea();
    if (!textarea) return;

    const current = textarea.value ?? '';
    if (!current.includes(text)) return;

    const next = current
        .replace(`\n${text}`, '')
        .replace(`${text}\n`, '')
        .replace(text, '')
        .replace(/^\n+|\n+$/g, '');

    textarea.value = next;
    dispatchInput(textarea);
}
