// ==UserScript==
// @name         Gemini 2 Markdown
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Copies Gemini conversations, including images, as Markdown. English and Español interface.
// @author       EdwarlyGamer999+
// @match        https://gemini.google.com/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @icon         https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original
// @license MIT
// ==/UserScript==

(function () {
    'use strict';

    const USER_PROMPT_PREFIX = '> ';
    const LANGUAGE_STORAGE_KEY = 'gemini-to-markdown-language';

    const translations = {
        en: {
            copyButton: 'Copy as Markdown',
            copied: 'Copied!',
            noContent: 'No conversation content or title detected!',
            uploadedImage: 'uploaded image',
            image: 'image',
            languageLabel: 'Language',
            toastSuccess: 'Gemini messages on screen copied' // <-- Texto actualizado
        },
        es: {
            copyButton: 'Copiar Markdown',
            copied: '¡Copiado!',
            noContent: '¡No se detectó contenido ni título de la conversación!',
            uploadedImage: 'imagen subida',
            image: 'imagen',
            languageLabel: 'Idioma',
            toastSuccess: 'Mensajes de Gemini en pantalla copiados' // <-- Texto actualizado
        }
    };

    // Leer el idioma guardado al iniciar
    let currentLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en';
    if (!translations[currentLanguage]) currentLanguage = 'en';

    function t(key) {
        return translations[currentLanguage][key] || translations.en[key];
    }

    function processCodeBlock(wrapperNode) {
        const languageElement = wrapperNode.querySelector('.code-language');
        const language = languageElement ? languageElement.textContent.trim().toLowerCase() : '';
        const codeElement = wrapperNode.querySelector('code');
        const codeContent = codeElement ? codeElement.textContent : '';
        return `\n\n\`\`\`${language}\n${codeContent.trim()}\n\`\`\`\n\n`;
    }

    function domToMarkdown(node) {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        if (node.nodeType !== Node.ELEMENT_NODE) return '';
        if (node.matches('div.code-block')) return processCodeBlock(node);

        let content = '';
        node.childNodes.forEach(child => content += domToMarkdown(child));

        const tagName = node.tagName.toLowerCase();
        switch (tagName) {
            case 'p': return `\n${content}\n`;
            case 'strong':
            case 'b': return `**${content}**`;
            case 'em':
            case 'i': return `*${content}*`;
            case 'ul': return `\n${content}\n`;
            case 'ol': {
                let orderedContent = '';
                const listItems = Array.from(node.children).filter(child => child.tagName.toLowerCase() === 'li');
                listItems.forEach((li, index) => orderedContent += `${index + 1}. ${domToMarkdown(li).trim()}\n`);
                return `\n${orderedContent}\n`;
            }
            case 'li':
                if (node.parentNode && node.parentNode.tagName.toLowerCase() === 'ol') return content;
                return `* ${content.trim()}\n`;
            case 'hr': return '\n\n---\n\n';
            case 'a': return `[${content}](${node.getAttribute('href')})`;
            case 'code':
                if (!node.closest('div.code-block')) return `\`${content}\``;
                return content;
            case 'img': {
                const altText = node.getAttribute('alt') || t('image');
                const srcUrl = node.getAttribute('src');
                return srcUrl ? `\n\n![${altText}](${srcUrl})\n\n` : '';
            }
            case 'h1': return `\n# ${content}\n`;
            case 'h2': return `\n## ${content}\n`;
            case 'h3': return `\n### ${content}\n`;
            case 'h4': return `\n#### ${content}\n`;
            case 'h5': return `\n##### ${content}\n`;
            case 'h6': return `\n###### ${content}\n`;
            default: return content;
        }
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = '#333';
        toast.style.color = '#fff';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '8px';
        toast.style.zIndex = '10000';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        toast.style.fontFamily = 'sans-serif';
        toast.style.fontSize = '14px';
        toast.style.transition = 'opacity 0.3s ease-in-out';
        toast.style.opacity = '0';

        document.body.appendChild(toast);

        // Efecto de aparición
        setTimeout(() => toast.style.opacity = '1', 10);

        // Desaparecer y eliminar
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    function copyConversationToClipboard() {
        const titleElement = document.querySelector('span.conversation-title.gds-title-m');
        const title = titleElement ? titleElement.textContent.trim() : '';
        let fullMarkdown = title ? `# ${title}\n\n` : '';

        const conversationTurns = document.querySelectorAll('message-content, user-query');
        if (!conversationTurns.length && !title) {
            alert(t('noContent'));
            return;
        }

        // Efecto visual: Resaltar temporalmente los mensajes
        conversationTurns.forEach(turn => {
            turn.style.transition = 'outline 0.3s ease-in-out';
            turn.style.outline = '2px solid #5B8CFFFF';
            turn.style.outlineOffset = '4px';
            turn.style.borderRadius = '8px';
        });

        // Quitar el resaltado después de 1.5 segundos
        setTimeout(() => {
            conversationTurns.forEach(turn => {
                turn.style.outline = 'none';
            });
        }, 1500);

        conversationTurns.forEach(turn => {
            const userQueryLines = turn.querySelectorAll('.query-text-line.ng-star-inserted');
            if (userQueryLines.length > 0) {
                let userText = '';
                userQueryLines.forEach(line => userText += line.textContent.trim() + '\n');
                fullMarkdown += `${USER_PROMPT_PREFIX}${userText.trim()}\n\n`;
            }

            // Handles user-uploaded images, which use a different DOM structure.
            const userImages = turn.querySelectorAll('img[data-test-id="uploaded-img"]');
            userImages.forEach(img => {
                const alt = img.getAttribute('alt') || t('uploadedImage');
                const src = img.getAttribute('src');
                if (src) fullMarkdown += `![${alt}](${src})\n\n`;
            });

            const geminiResponse = turn.querySelector('.markdown.markdown-main-panel');
            if (geminiResponse) {
                const responseMarkdown = domToMarkdown(geminiResponse);
                fullMarkdown += responseMarkdown.trim().replace(/\n{3,}/g, '\n\n') + '\n\n';
            }
        });

        GM_setClipboard(fullMarkdown.trim(), 'text');

        // Cambiar el botón brevemente y mostrar el Toast
        const button = document.getElementById('gemini-to-obsidian-button');
        const originalText = t('copyButton');
        button.textContent = t('copied');
        setTimeout(() => button.textContent = originalText, 2000);

        // Mostrar aviso de éxito con el nuevo texto
        showToast(t('toastSuccess'));
    }

    function updateInterfaceLanguage() {
        const button = document.getElementById('gemini-to-obsidian-button');
        const selector = document.getElementById('gemini-to-markdown-language');
        if (button) button.textContent = t('copyButton');
        if (selector) selector.setAttribute('aria-label', t('languageLabel'));
    }

    function createCopyControls() {
        if (document.getElementById('gemini-to-obsidian-controls')) return;

        const controls = document.createElement('div');
        controls.id = 'gemini-to-obsidian-controls';

        const selector = document.createElement('select');
        selector.id = 'gemini-to-markdown-language';
        selector.setAttribute('aria-label', t('languageLabel'));
        selector.title = t('languageLabel');

        const englishOption = document.createElement('option');
        englishOption.value = 'en';
        englishOption.textContent = 'English';

        const spanishOption = document.createElement('option');
        spanishOption.value = 'es';
        spanishOption.textContent = 'Español';

        selector.append(englishOption, spanishOption);
        selector.value = currentLanguage;

        selector.addEventListener('change', () => {
            currentLanguage = selector.value;
            localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
            updateInterfaceLanguage();
        });

        const button = document.createElement('button');
        button.id = 'gemini-to-obsidian-button';
        button.textContent = t('copyButton');
        button.addEventListener('click', copyConversationToClipboard);

        controls.append(selector, button);
        document.body.appendChild(controls);

        GM_addStyle(`
            #gemini-to-obsidian-controls {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 8px;
                align-items: flex-end;
            }
            #gemini-to-markdown-language,
            #gemini-to-obsidian-button {
                width: auto;
                min-width: 110px;
                padding: 8px 12px;
                font-size: 13px;
                white-space: nowrap;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                color: white;
            }
            #gemini-to-markdown-language {
                background: #5B8CFFFF;
            }
            #gemini-to-obsidian-button {
                background-color: #5B8CFFFF;
                transition: all 0.2s;
            }
            #gemini-to-obsidian-button:hover,
            #gemini-to-markdown-language:hover {
                background-color: #4A76D9;
            }
            #gemini-to-obsidian-button:hover {
                transform: translateY(-2px);
            }
            #gemini-to-obsidian-button:active {
                background-color: #3A5EB3;
                transform: translateY(0);
            }
        `);
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        createCopyControls();
    } else {
        window.addEventListener('DOMContentLoaded', createCopyControls);
    }
})();
