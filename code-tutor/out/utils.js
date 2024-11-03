"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTokens = calculateTokens;
exports.isTextPart = isTextPart;
exports.calculateTokensFromParts = calculateTokensFromParts;
exports.trimHistoryIfNeeded = trimHistoryIfNeeded;
const constants_1 = require("./constants");
function calculateTokens(text) {
    return Math.ceil(text.length / constants_1.TOKEN_SIZE);
}
function isTextPart(part) {
    return 'text' in part && typeof part.text === 'string';
}
function calculateTokensFromParts(parts) {
    let totalLength = 0;
    for (const part of parts) {
        if (isTextPart(part)) {
            totalLength += part.value.length;
        }
    }
    return Math.ceil(totalLength / constants_1.TOKEN_SIZE);
}
function trimHistoryIfNeeded(history, newMessage, prompt) {
    let totalTokens = calculateTokens(prompt) + calculateTokens(newMessage);
    const trimmedHistory = [];
    for (let i = history.length - 1; i >= 0; i--) {
        const message = history[i];
        const messageTokens = calculateTokensFromParts(message.content);
        if (totalTokens + messageTokens > constants_1.MAX_TOKENS) {
            break;
        }
        totalTokens += messageTokens;
        trimmedHistory.unshift(message);
    }
    return trimmedHistory;
}
//# sourceMappingURL=utils.js.map