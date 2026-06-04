"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get formatGroupMembers () {
        return formatGroupMembers;
    },
    get noteGroupMember () {
        return noteGroupMember;
    }
});
const _textruntime = require("../../text-runtime.js");
function appendNormalizedUnique(entries, seen, ordered) {
    for (const entry of entries){
        const normalized = (0, _textruntime.normalizeE164)(entry) ?? entry;
        if (!normalized || seen.has(normalized)) {
            continue;
        }
        seen.add(normalized);
        ordered.push(normalized);
    }
}
function noteGroupMember(groupMemberNames, conversationId, e164, name) {
    if (!e164 || !name) {
        return;
    }
    const normalized = (0, _textruntime.normalizeE164)(e164);
    const key = normalized ?? e164;
    if (!key) {
        return;
    }
    let roster = groupMemberNames.get(conversationId);
    if (!roster) {
        roster = new Map();
        groupMemberNames.set(conversationId, roster);
    }
    roster.set(key, name);
}
function formatGroupMembers(params) {
    const { participants, roster, fallbackE164 } = params;
    const seen = new Set();
    const ordered = [];
    if (participants?.length) {
        appendNormalizedUnique(participants, seen, ordered);
    }
    if (roster) {
        appendNormalizedUnique(roster.keys(), seen, ordered);
    }
    if (ordered.length === 0 && fallbackE164) {
        const normalized = (0, _textruntime.normalizeE164)(fallbackE164) ?? fallbackE164;
        if (normalized) {
            ordered.push(normalized);
        }
    }
    if (ordered.length === 0) {
        return undefined;
    }
    return ordered.map((entry)=>{
        const name = roster?.get(entry);
        return name ? `${name} (${entry})` : entry;
    }).join(", ");
}

//# sourceMappingURL=group-members.js.map