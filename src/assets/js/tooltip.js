import tippy from "tippy.js";

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away-extreme.css';
import 'tippy.js/themes/material.css';

export function Tooltip(el, content) {
    tippy(el, {
        content: `<span style="font-size: 14px; font-weight: normal">${content}</span>`,
        animation: 'shift-away-extreme',
        theme: 'material',
        allowHTML: true,
    });
}