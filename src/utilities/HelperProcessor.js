var jsface = require('jsface'),
    fs = require('fs'),
    Errors = require('./ErrorHandler'),
    Helpers = require('./Helpers'),
    CryptoJS = require('crypto-js'),
    OAuth = require('./oauth.js'),
    Hawk = require('hawk'),
    btoa = require("btoa"),
    aws4 = require('aws4'),
    url	 = require('url'),
    queryString = require('querystring'),
    _und = require('underscore'),
    _ = require('lodash');

/**
 * @name Helpers
 * @namespace
 * @classdesc Helper class to use Auth Helpers
 */
var HelperProcessor = jsface.Class({
    $singleton: true,

    _useAuthHelpers: function (request) {
        if (request.currentHelper === "normal") {
            return;
        }
        else if (request.currentHelper === "basicAuth") {
            this._useBasicAuth(request);
        }
        else if (request.currentHelper === "digestAuth") {
            this._useDigestAuth(request);
        }
        else if (request.currentHelper === "oAuth1") {
            this._useOAuth1(request);
        }
        else if (request.currentHelper === "hawkAuth") {
            this._useHawkAuth(request);
        }
        else if(request.currentHelper==="awsSigV4") {
			this._useAWSSigV4Auth(request)
		}
    },

    _useAWSSigV4Auth: function(request) {
        var properties = request.transformed.helperAttributes;
        var credentials = {
            accessKeyId: properties.accessKey,
            secretAccessKey: properties.secretKey
        };
        var parsedURL = url.parse(request.transformed.url);
        var allHeaders = Helpers.generateHeaderObj(request.transformed.headers);
        var body = this._getRequestBody(request);

        if (allHeaders['x-amz-date']) { // The AWS signing library hates lowercase header
            allHeaders['X-Amz-Date'] = allHeaders['x-amz-date'];
            delete allHeaders['x-amz-date'];
        }
        var signedParams = aws4.sign({
            host: parsedURL.hostname,
            protocol: parsedURL.protocol,
            port: parsedURL.port,
            path: parsedURL.path,
            service: properties.serviceName || properties.service || 'execute-api',
            region: properties.awsRegion || properties.region,
            method: request.method,
            body: body,
            headers: allHeaders
        }, credentials);

        var headerObj = _und.extend({}, Helpers.generateHeaderObj(request.transformed.headers), signedParams.headers);
        var finalHeaders = {};

        // Remove duplicate headers which may have difference cases, e.g: x-amx-date and X-Amz-Date
        var headerKeys = Object.keys(headerObj);
        headerKeys.forEach(function (key) {
            if (key.toLowerCase() !== 'host') {
                finalHeaders[key.toLowerCase()] = headerObj[key];
            }
        });
        request.transformed.headers = Helpers.generateHeaderStringFromObj(finalHeaders);
    },

    _useBasicAuth: function (request) {
        var authHeaderKey = "Authorization";
        var username = request.transformed.helperAttributes.username;
        var password = request.transformed.helperAttributes.password;

        var rawString = username + ":" + password;
        var encodedString = "Basic " + btoa(rawString);

        var headerObj = Helpers.generateHeaderObj(request.transformed.headers);
        headerObj[authHeaderKey] = encodedString;
        var headerString = Helpers.generateHeaderStringFromObj(headerObj);
        request.transformed.headers = headerString;
    },

    _useHawkAuth: function (request) {
        var authHeaderKey = "Authorization";
        var hawk_id = request.transformed.helperAttributes.hawk_id;
        var hawk_key = request.transformed.helperAttributes.hawk_key;
        var algorithm = request.transformed.helperAttributes.algorithm;
        var user = request.transformed.helperAttributes.user || undefined;
        var nonce = request.transformed.helperAttributes.nonce;
        var ext = request.transformed.helperAttributes.ext || undefined;
        var app = request.transformed.helperAttributes.app || undefined;
        var dlg = request.transformed.helperAttributes.dlg || undefined;
        var timestamp = request.transformed.helperAttributes.timestamp || undefined;

        var options = {
            credentials: {
                id: hawk_id,
                key: hawk_key,
                algorithm: algorithm
            },
            nonce: nonce,
            ext: ext,
            app: app,
            dlg: dlg,
            timestamp: timestamp,
            user: user
        };

        var result = Hawk.client.header(request.transformed.url, request.method, options);
        if (result.err) {
            Errors.requestError(request, new Error('Unable to compute Hawk Auth parameters: ' + result.err));
            return;
        }

        var headerObj = Helpers.generateHeaderObj(request.transformed.headers);
        headerObj[authHeaderKey] = result.field;
        request.transformed.headers = Helpers.generateHeaderStringFromObj(headerObj);
    },

    _useDigestAuth: function (request) {
        var authHeaderKey = "Authorization";
        var helperAttrs = request.transformed.helperAttributes;


        var algorithm = helperAttrs.algorithm;

        var username = helperAttrs.username;
        var realm = helperAttrs.realm;
        var password = helperAttrs.password;

        var method = request.method;

        var nonce = helperAttrs.nonce;
        var nonceCount = helperAttrs.nonceCount;
        var clientNonce = helperAttrs.clientNonce;

        var opaque = helperAttrs.opaque;
        var qop = helperAttrs.qop;
        var body = this._getRequestBody(request);

        var url = request.url;
        var urlParts = this._splitUrlIntoHostAndPath(url);
        var digestUri = urlParts.path;

        var a1;

        if (algorithm === "MD5-sess") {
            var a0 = CryptoJS.MD5(username + ":" + realm + ":" + password).toString();
            a1 = a0 + ":" + nonce + ":" + clientNonce;
        }
        else {
            a1 = username + ":" + realm + ":" + password;
        }

        var a2;

        if (qop === "auth-int") {
            a2 = method + ":" + digestUri + ":" + body;
        }
        else {
            a2 = method + ":" + digestUri;
        }


        var ha1 = CryptoJS.MD5(a1).toString();
        var ha2 = CryptoJS.MD5(a2).toString();

        var response;

        if (qop === "auth-int" || qop === "auth") {
            response = CryptoJS.MD5(ha1 + ":" + nonce + ":" + nonceCount + ":" + clientNonce + ":" + qop + ":" + ha2).toString();
        }
        else {
            response = CryptoJS.MD5(ha1 + ":" + nonce + ":" + ha2).toString();
        }

        var headerVal = "Digest ";
        headerVal += "username=\"" + username + "\", ";
        headerVal += "realm=\"" + realm + "\", ";
        headerVal += "nonce=\"" + nonce + "\", ";
        headerVal += "uri=\"" + digestUri + "\", ";

        if (qop === "auth" || qop === "auth-int") {
            headerVal += "qop=" + qop + ", ";
        }

        if (qop === "auth" || qop === "auth-int" || algorithm === "MD5-sess") {
            headerVal += "nc=" + nonceCount + ", ";
            headerVal += "cnonce=\"" + clientNonce + "\", ";
        }

        headerVal += "response=\"" + response + "\", ";
        headerVal += "opaque=\"" + opaque + "\"";

        var headerObj = Helpers.generateHeaderObj(request.transformed.headers);
        headerObj[authHeaderKey] = headerVal;
        var headerString = Helpers.generateHeaderStringFromObj(headerObj);
        request.transformed.headers = headerString;
    },

    _useOAuth1: function (request) {
        var i, j, count, length;
        var params = [], bodyParams = [];
        var urlParams = this._getUrlVars(request.transformed && request.transformed.url ? request.transformed.url :
                        request.url);

        var dataMode = request.dataMode;

        params = params.concat(urlParams);

        bodyParams = request.data || [];
        if (bodyParams.length !== 0) {
            params = params.concat(bodyParams);
        }

        params = this._removeOAuthKeys(params);

        var signatureKey = "oauth_signature";
        var oAuthParams = [];

        var helperAttrs = request.transformed.helperAttributes;
        helperAttrs.nonce = OAuth.nonce(6) + "";
        helperAttrs.timestamp = OAuth.timestamp() + "";

        var signatureParams = [
            { key: "oauth_consumer_key", value: helperAttrs.consumerKey },
            { key: "oauth_token", value: helperAttrs.token },
            { key: "oauth_signature_method", value: helperAttrs.signatureMethod },
            { key: "oauth_timestamp", value: helperAttrs.timestamp },
            { key: "oauth_nonce", value: helperAttrs.nonce },
            { key: "oauth_version", value: helperAttrs.version }
        ];

        for (i = 0; i < signatureParams.length; i++) {
            var param = signatureParams[i];
            oAuthParams.push(param);
        }

        var signature = this.generateSignature(request, helperAttrs);

        if (signature === null) {
            return;
        }

        oAuthParams.push({ key: signatureKey, value: signature });

        var addToHeader = helperAttrs.header;

        if (addToHeader) {
            var realm = helperAttrs.realm;
            var authHeaderKey = "Authorization";
            var rawString = "OAuth ";
            if (realm != null && realm.trim() !== "") {
                rawString += "realm=\"" + encodeURIComponent(realm) + "\",";
            }
            var len = oAuthParams.length;

            for (i = 0; i < len; i++) {
                if (oAuthParams[i].value === null || oAuthParams[i].value.trim() === "") {
                    continue;
                }
                rawString += encodeURIComponent(oAuthParams[i].key) + "=\"" + encodeURIComponent(oAuthParams[i].value) + "\",";
            }

            rawString = rawString.substring(0, rawString.length - 1);
            var headerObj = Helpers.generateHeaderObj(request.transformed.headers);
            headerObj[authHeaderKey] = rawString;
            var headerString = Helpers.generateHeaderStringFromObj(headerObj);
            request.transformed.headers = headerString;

        } else {
            params = params.concat(oAuthParams);
            var newParams = [];
            _und.map(params, function (param) {
                param.enabled = true;
                param.type = "text";
                newParams.push(param);
            });
            if (request.method.toLowerCase() !== "post" && request.method.toLowerCase() !== "put") {
                //console.log("Setting URL params", params);

                this.setUrlParamStringWithOptBlankValRemoval(request, params, null, true);
            } else {
                if (dataMode === 'urlencoded') {
                    if (!request.transformed.data || !(request.transformed.data instanceof Array)) {
                        request.transformed.data = [];
                    }
                    request.transformed.data = request.transformed.data.concat(newParams);
                }
                else if (dataMode === 'params') {
                    if (!request.transformed.data || !(request.transformed.data instanceof Array)) {
                        request.transformed.data = [];
                    }
                    request.transformed.data = request.transformed.data.concat(newParams);
                }
                else if (dataMode === 'raw') {
                    this.setUrlParamStringWithOptBlankValRemoval(request, params, null, true);
                }
            }
        }

    },

    _getRequestBody: function (request) {
        var numParams, params, retVal;
        var i;
        if (request.method.toLowerCase() === "post" || request.method.toLowerCase() === "put" ||
            request.method.toLowerCase() === "delete" || request.method.toLowerCase() === "patch") {
            if (request.dataMode === "urlencoded") {
                if (!request.transformed.data || (!request.transformed.data.length)) {
                    return '';
                }
                params = this._parseFormParams(request.transformed.data);
                return queryString.stringify(params);
            }
            else if (request.dataMode === "params") {
                if (!(request.transformed.data && !request.transformed.data.length)) {
                    return '';
                }
                numParams = request.transformed.data.length;
                params = request.transformed.data;
                retVal = this._getDummyFormDataBoundary();
                for (i = 0; i < numParams; i++) {
                    if (params[i].type === "text") {
                        retVal += '<br/>Content-Disposition: form-data; name="' + params[i].key + '"<br/><br/>';
                        retVal += params[i].value + "<br/>";
                    }
                    else if (params[i].type === "file") {
                        retVal += "<br/>Content-Disposition: form-data; name=\"" + params[i].key + "\"; filename=";
                        retVal += "\"" + params[i].value.name + "\"<br/>";
                        retVal += "Content-Type: " + params[i].value.type;
                        retVal += "<br/><br/><br/>";
                    }
                }
                retVal += this._getDummyFormDataBoundary();
                return retVal;
            }
            else if (request.dataMode === "raw") {
                return request.transformed.data;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    },

    // Fixed
    _getDummyFormDataBoundary: function () {
        var boundary = "----WebKitFormBoundaryE19zNvXGzXaLvS5C";
        return boundary;
    },

    _splitUrlIntoHostAndPath: function (url) {
        var path = "";
        var host;

        var parts = url.split('/');
        host = parts[2];
        var partsCount = parts.length;
        for (var i = 3; i < partsCount; i++) {
            path += "/" + parts[i];
        }

        var quesLocation = path.indexOf('?');
        var hasParams = quesLocation >= 0 ? true : false;

        if (hasParams) {
            parts = this.getUrlVars(path);
            var count = parts.length;
            var encodedPath = path.substr(0, quesLocation + 1);
            for (var j = 0; j < count; j++) {
                var value = parts[j].value;
                var key = parts[j].key;
                //value = encodeURIComponent(value);
                //key = encodeURIComponent(key);

                encodedPath += key + "=" + value + "&";
            }

            encodedPath = encodedPath.substr(0, encodedPath.length - 1);

            path = encodedPath;
        }

        return { host: host, path: path };
    },

    removeOAuthKeys: function (params) {
        var i, count;
        var oauthParams = [
            "oauth_consumer_key",
            "oauth_token",
            "oauth_signature_method",
            "oauth_timestamp",
            "oauth_nonce",
            "oauth_version",
            "oauth_signature"
        ];

        var newParams = [];
        var oauthIndexes = [];

        for (i = 0, count = params.length; i < count; i++) {
            var index = _und.indexOf(oauthParams, params[i].key);
            if (index < 0) {
                newParams.push(params[i]);
            }
        }

        return newParams;
    },

    process: function () {
        var request = this.get("request");
        this.processCustomRequest(request);
    },

    _getUrlVars: function (url, associative) {
        if (url === null) {
            return [];
        }

        var quesLocation = url.indexOf('?');
        var equalLocation = url.indexOf('=');

        if (equalLocation < 0) {
            return [];
        }

        if (quesLocation < 0) {
            quesLocation = -1;
            return [];
        }

        var vars = [], hash, varsAssoc = {};
        var hashes = url.slice(quesLocation + 1).split('&');
        var element;

        for (var i = 0; i < hashes.length; i++) {
            equalLocation = hashes[i].indexOf('=');

            if (equalLocation !== -1) {
                element = {
                    "key": hashes[i].slice(0, equalLocation),
                    "value": hashes[i].slice(equalLocation + 1)
                };
            }
            else {
                element = {
                    "key": hashes[i].slice(0, hashes[i].length),
                    "value": ""
                };
            }

            if (associative) {
                varsAssoc[element.key] = element.value;
            }
            else {
                vars.push(element);
            }
        }

        if (associative) {
            return varsAssoc;
        } else {
            return vars;
        }
    },

    setUrlParamStringWithOptBlankValRemoval: function (request, params, silent, removeBlankParams) {
        var paramArr = [];
        var url = _.get(request, 'transformed.url') ? request.transformed.url : request.url;

        for (var i = 0; i < params.length; i++) {
            var p = params[i];
            if (p.key && p.key !== "") {
                p.key = p.key.replace(/&/g, '%26');

                if (!p.value) {
                    p.value = "";
                }
                p.value = p.value.replace(/&/g, '%26');
                if (removeBlankParams === false || p.value !== "") {
                    paramArr.push(p.key + "=" + p.value);
                }
            }
        }

        var baseUrl = url.split("?")[0];
        if (paramArr.length > 0) {
            url = baseUrl + "?" + paramArr.join('&');
        }
        else {
            //Has key/val pair
            if (url.indexOf("?") > 0 && url.indexOf("=") > 0) {
                url = baseUrl;
            }
        }

        if (request.transformed) {
            request.transformed.url = url;
        }
        else {
            request.url = url;
        }

    },

    _removeOAuthKeys: function (params) {
        var i, count;
        var oauthParams = [
            "oauth_consumer_key",
            "oauth_token",
            "oauth_signature_method",
            "oauth_timestamp",
            "oauth_nonce",
            "oauth_version",
            "oauth_signature"
        ];

        var newParams = [];
        var oauthIndexes = [];

        for (i = 0, count = params.length; i < count; i++) {
            var index = _und.indexOf(oauthParams, params[i].key);
            if (index < 0) {
                newParams.push(params[i]);
            }
        }

        return newParams;
    },

    generateSignature: function (request, helperAttrs) {
        //Make sure the URL is urlencoded properly
        //Set the URL keyval editor as well. Other get params disappear when you click on URL params again
        var i;
        var url = request.transformed.url;

        var processedUrl;

        var realm = helperAttrs.realm;
        var method = request.method;
        var requestBody = request.body; //will this work? :S

        processedUrl = url;
        //processedUrl = ensureProperUrl(processedUrl);

        if (processedUrl.indexOf('?') > 0) {
            processedUrl = processedUrl.split("?")[0];
        }

        var message = {
            action: processedUrl,
            method: method,
            parameters: []
        };

        var signatureParams = [
            { key: "oauth_consumer_key", value: helperAttrs.consumerKey },
            { key: "oauth_token", value: helperAttrs.token },
            { key: "oauth_signature_method", value: helperAttrs.signatureMethod },
            { key: "oauth_timestamp", value: helperAttrs.timestamp },
            { key: "oauth_nonce", value: helperAttrs.nonce },
            { key: "oauth_version", value: helperAttrs.version }
        ];

        for (i = 0; i < signatureParams.length; i++) {
            var param = signatureParams[i];
            if (param.value !== "") {
                message.parameters.push([param.key, param.value]);
            }
        }

        //Get parameters
        var urlParams = this._getUrlVars(request.transformed && request.transformed.url ? request.transformed.url :
                        request.url);

        var bodyParams;

        if (method.toLowerCase() === "post" || method.toLowerCase() === "put") {
            bodyParams = request.transformed.data;

            if (typeof bodyParams === "undefined") {
                bodyParams = [];
            }
        }
        else {
            bodyParams = [];
        }

        var params = _und.union(urlParams, bodyParams);
        var param;
        var existingOAuthParams = _und.union(signatureParams, [{ key: "oauth_signature", value: "" }]);
        var pos;

        for (i = 0; i < params.length; i++) {
            param = params[i];
            if (param.key) {
                pos = Helpers.findPosition(existingOAuthParams, "key", param.key);
                if (pos < 0) {
                    if (param.value !== "") {
                        message.parameters.push([param.key, param.value]);
                    }
                }
            }
        }

        var accessor = {};
        if (helperAttrs.consumerSecret !== '') {
            accessor.consumerSecret = helperAttrs.consumerSecret;
        }
        if (helperAttrs.tokenSecret !== '') {
            accessor.tokenSecret = helperAttrs.tokenSecret;
        }

        return OAuth.SignatureMethod.sign(message, accessor);
    },

    htmlEscape: function (str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    _parseFormParams: function (reqData) {
        var params = {};
        reqData.sort(function (a, b) {
            return (a.key <= b.key) ? -1 : 1;
        });
        reqData.forEach(function (paramData) {
            if (paramData.enabled) {
                // Check if this is a duplicate
                if (params[paramData.key]) {
                    var original = params[paramData.key];
                    if (Array.isArray(original)) {
                        original.push(paramData.value);
                    } else {
                        params[paramData.key] = [original].concat(paramData.value);
                    }
                } else {
                    params[paramData.key] = paramData.value;
                }
            }
        });
        return params;
    }
});

module.exports = HelperProcessor;
