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
    get namedAccountPromotionKeys () {
        return namedAccountPromotionKeys;
    },
    get singleAccountKeysToMove () {
        return singleAccountKeysToMove;
    }
});
const singleAccountKeysToMove = [
    "streaming"
];
const namedAccountPromotionKeys = [
    "botToken",
    "tokenFile"
];

//# sourceMappingURL=setup-contract.js.map