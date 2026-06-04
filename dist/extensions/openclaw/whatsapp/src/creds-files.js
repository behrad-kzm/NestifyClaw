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
    get assertWebCredsPathRegularFileOrMissing () {
        return assertWebCredsPathRegularFileOrMissing;
    },
    get hasWebCredsRegularFileSync () {
        return hasWebCredsRegularFileSync;
    },
    get hasWebCredsSync () {
        return hasWebCredsSync;
    },
    get readWebCredsJsonRaw () {
        return readWebCredsJsonRaw;
    },
    get readWebCredsJsonRawSync () {
        return readWebCredsJsonRawSync;
    },
    get resolveWebCredsBackupPath () {
        return resolveWebCredsBackupPath;
    },
    get resolveWebCredsPath () {
        return resolveWebCredsPath;
    },
    get statWebCredsFileSync () {
        return statWebCredsFileSync;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _securityruntime = require("../../../../common/openclaw/plugin-sdk/security-runtime");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function resolveWebCredsPath(authDir) {
    return _nodepath.default.join(authDir, "creds.json");
}
function resolveWebCredsBackupPath(authDir) {
    return _nodepath.default.join(authDir, "creds.json.bak");
}
function resolveWebCredsParentCheck(filePath) {
    const dir = _nodepath.default.resolve(_nodepath.default.dirname(filePath));
    return {
        rootDir: _nodepath.default.parse(dir).root,
        targetPath: dir,
        allowMissing: true,
        allowRootChildSymlink: true,
        requireDirectories: true,
        messagePrefix: "WhatsApp credential file path"
    };
}
async function assertWebCredsParentPathSafe(filePath) {
    await (0, _securityruntime.assertNoSymlinkParents)(resolveWebCredsParentCheck(filePath));
}
function assertWebCredsParentPathSafeSync(filePath) {
    (0, _securityruntime.assertNoSymlinkParentsSync)(resolveWebCredsParentCheck(filePath));
}
async function assertWebCredsPathRegularFileOrMissing(filePath) {
    try {
        await assertWebCredsParentPathSafe(filePath);
        await (0, _securityruntime.statRegularFile)(filePath);
    } catch (error) {
        throw new Error(`WhatsApp credential file path is unsafe; creds.json must be a regular file or missing: ${filePath}`, {
            cause: error
        });
    }
}
function readWebCredsJsonRawSync(filePath) {
    try {
        assertWebCredsParentPathSafeSync(filePath);
        const { buffer, stat } = (0, _securityruntime.readRegularFileSync)({
            filePath
        });
        return stat.size > 1 ? buffer.toString("utf-8") : null;
    } catch  {
        return null;
    }
}
async function readWebCredsJsonRaw(filePath) {
    try {
        await assertWebCredsParentPathSafe(filePath);
        const { buffer, stat } = await (0, _securityruntime.readRegularFile)({
            filePath
        });
        return stat.size > 1 ? buffer.toString("utf-8") : null;
    } catch  {
        return null;
    }
}
function statWebCredsFileSync(filePath) {
    try {
        assertWebCredsParentPathSafeSync(filePath);
        const result = (0, _securityruntime.statRegularFileSync)(filePath);
        if (result.missing || result.stat.size <= 1) {
            return null;
        }
        return {
            mtimeMs: result.stat.mtimeMs,
            size: result.stat.size
        };
    } catch  {
        return null;
    }
}
function hasWebCredsRegularFileSync(authDir) {
    try {
        const credsPath = resolveWebCredsPath(authDir);
        assertWebCredsParentPathSafeSync(credsPath);
        return !(0, _securityruntime.statRegularFileSync)(credsPath).missing;
    } catch  {
        return false;
    }
}
function hasWebCredsSync(authDir) {
    return statWebCredsFileSync(resolveWebCredsPath(authDir)) !== null;
}

//# sourceMappingURL=creds-files.js.map