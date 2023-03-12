// https://atomiks.github.io/tippyjs/

import tippy from "tippy.js";

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away-extreme.css';
import 'tippy.js/themes/material.css';

export function Tooltip(el, content) {
    return tippy(el, {
        content: `<div style="font-size: 14px; font-weight: normal">${content}</div>`,
        animation: 'shift-away-extreme',
        theme: 'material',
        allowHTML: true,
    })
}