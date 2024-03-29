"use strict";
/**
 * @module login
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLoggedIn = exports.startLogin = exports.awaitLoginContainer = exports.startLoginContainer = exports.createLoginUrl = exports.createOAuthUrl = exports.AuthMethod = exports.LoginFlowError = exports.LoginFlowErrorType = void 0;
const options = __importStar(require("./options.js"));
const login_container_js_1 = __importStar(require("./login-container.js"));
const util_js_1 = require("./util.js");
var LoginFlowErrorType;
(function (LoginFlowErrorType) {
    LoginFlowErrorType["Unknown"] = "Unknown";
    LoginFlowErrorType["ClosedByUser"] = "ClosedByUser";
})(LoginFlowErrorType = exports.LoginFlowErrorType || (exports.LoginFlowErrorType = {}));
/**
 * Error thrown by {@link startLogin}
 */
class LoginFlowError extends Error {
    /**
     *
     * @param message message
     * @param type type {@link LoginFlowErrorType}
     */
    constructor(message, type) {
        super(message);
        this.type = type;
    }
}
exports.LoginFlowError = LoginFlowError;
/**
 * Supported authentication methods.
 */
var AuthMethod;
(function (AuthMethod) {
    AuthMethod["google"] = "google";
    AuthMethod["email"] = "email";
})(AuthMethod = exports.AuthMethod || (exports.AuthMethod = {}));
/**
 * Creates a URL to the OAuth flow which in turn redirects to
 * the provided loginUrl after successful OAuth.
 *
 * @param provId auth method
 * @param loginUrl login url
 * @returns url for
 */
function createOAuthUrl(provId, loginUrl) {
    const url = new URL('/initial-auth/' + provId, options.get().api);
    url.searchParams.set('loginUrl', loginUrl.href);
    return url;
}
exports.createOAuthUrl = createOAuthUrl;
/**
 * Creates a login url based on the realm and the provided options.
 *
 * @param loginOptions {@link main.LoginOptions}
 *
 * @returns URL
 */
function createLoginUrl(loginOptions = {}) {
    loginOptions = (0, util_js_1.removeUndefined)(Object.assign({ client: 'Web', appId: options.get().appId, userClass: 'users_default', callbackUrl: options.get().callbackUrl }, loginOptions));
    const provId = loginOptions.authMethod;
    const loginUrl = new URL(options.get().realm);
    for (const [k, v] of Object.entries(loginOptions)) {
        loginUrl.searchParams.set(k, v);
    }
    if (provId === 'email' || !provId) {
        return loginUrl;
    }
    else {
        return createOAuthUrl(provId, loginUrl);
    }
}
exports.createLoginUrl = createLoginUrl;
/**
 * Starts the login process.
 * Returns a promise that resolves as soon as the popup closes.
 *
 * @param loginOptions containing the userClass
 * @param buildLoginWindow optional container to render the login flow in
 *
 * @returns Promise<void>
 *
 * @throws error {@link LoginFlowError}
 */
function startLoginContainer(loginOptions = {}, buildLoginWindow) {
    const url = createLoginUrl(loginOptions);
    const loginWindow = buildLoginWindow ?
        buildLoginWindow(url) :
        new login_container_js_1.LoginWindowPopup({
            url,
            title: 'unolog·in',
        });
    return login_container_js_1.default.start(loginWindow);
}
exports.startLoginContainer = startLoginContainer;
/**
 * Wraps login container in a promise.
 *
 * @param container container
 *
 * @returns Promise<void>
 *
 * @throws LoginFlowError {@link LoginFlowError}
 */
function awaitLoginContainer(container) {
    return new Promise((resolve, reject) => {
        container.onLogin(({ success }) => {
            container.close();
            if (success) {
                resolve();
            }
            else {
                reject(new LoginFlowError('Unknown cause.', LoginFlowErrorType.Unknown));
            }
        });
        container.onClosed(() => reject(new LoginFlowError('Login flow closed by user.', LoginFlowErrorType.ClosedByUser)));
    });
}
exports.awaitLoginContainer = awaitLoginContainer;
/**
 * Starts the login process and creates a promise around it.
 * Returns a promise that resolves as soon as the popup closes.
 *
 * @param loginOptions containing the userClass
 * @param buildLoginWindow optional container to render the login flow in
 *
 * @returns Promise<void>
 *
 * @throws LoginFlowError {@link LoginFlowError}
 */
function startLogin(loginOptions = {}, buildLoginWindow) {
    const container = startLoginContainer(loginOptions, buildLoginWindow);
    return awaitLoginContainer(container);
}
exports.startLogin = startLogin;
/**
 * Check if the user *appears* to be logged in from the client side.
 * *Do NOT use for authentication* as the result may be tempered with.
 *
 * @param documentCookie Optional cookie string (for testing).
 * @returns true if the user *appears* to be logged in.
 */
function isLoggedIn(documentCookie) {
    const appId = options.get().appId;
    const cookieName = appId ?
        `_uno_loginState_${appId}` :
        '_uno_loginState';
    return !!((documentCookie || document.cookie).match(RegExp('(?:^|;\\s*)' + cookieName + '=([^;]*)')));
}
exports.isLoggedIn = isLoggedIn;
