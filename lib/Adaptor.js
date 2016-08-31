'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lastReferenceValue = exports.dataValue = exports.dataPath = exports.merge = exports.alterState = exports.sourceValue = exports.fields = exports.field = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.execute = execute;
exports.fetchSubmissions = fetchSubmissions;
exports.post = post;
exports.get = get;

var _languageCommon = require('language-common');

Object.defineProperty(exports, 'field', {
  enumerable: true,
  get: function get() {
    return _languageCommon.field;
  }
});
Object.defineProperty(exports, 'fields', {
  enumerable: true,
  get: function get() {
    return _languageCommon.fields;
  }
});
Object.defineProperty(exports, 'sourceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.sourceValue;
  }
});
Object.defineProperty(exports, 'fields', {
  enumerable: true,
  get: function get() {
    return _languageCommon.fields;
  }
});
Object.defineProperty(exports, 'alterState', {
  enumerable: true,
  get: function get() {
    return _languageCommon.alterState;
  }
});
Object.defineProperty(exports, 'merge', {
  enumerable: true,
  get: function get() {
    return _languageCommon.merge;
  }
});
Object.defineProperty(exports, 'dataPath', {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataPath;
  }
});
Object.defineProperty(exports, 'dataValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataValue;
  }
});
Object.defineProperty(exports, 'lastReferenceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.lastReferenceValue;
  }
});

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _url = require('url');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @module Adaptor */

/**
 * Execute a sequence of operations.
 * Wraps `language-common/execute`, and prepends initial state for http.
 * @example
 * execute(
 *   create('foo'),
 *   delete('bar')
 * )(state)
 * @constructor
 * @param {Operations} operations - Operations to be performed.
 * @returns {Operation}
 */
function execute() {
  for (var _len = arguments.length, operations = Array(_len), _key = 0; _key < _len; _key++) {
    operations[_key] = arguments[_key];
  }

  var initialState = {
    references: [],
    data: null
  };

  return function (state) {
    return _languageCommon.execute.apply(undefined, operations)(_extends({}, initialState, state));
  };
}

/**
 * Make a GET request and POST it somewhere else
 * @example
 * execute(
 *   fetch(params)
 * )(state)
 * @constructor
 * @param {object} params - data to make the fetch
 * @returns {Operation}
 */
function fetchSubmissions(formId, afterDate, postUrl) {

  // GET IT BACK INTO STATE!
  //   function(state) {
  //       return { "date": dataValue("_json[(@.length-1)].SubmissionDate")(state) }
  //   }

  return function (state) {
    var _expandReferences = (0, _languageCommon.expandReferences)(afterDate)(state);

    var afterDate = _expandReferences.afterDate;
    var _state$configuration = state.configuration;
    var username = _state$configuration.username;
    var password = _state$configuration.password;
    var instanceName = _state$configuration.instanceName;


    var baseUrl = "https://".concat(instanceName, ".surveycto.com/api/v1/forms/data/wide/json");

    var url = (0, _url.resolve)(baseUrl + '/', formId);

    console.log("Fetching submissions from URL: " + url);
    console.log("After: " + afterDate);

    return new Promise(function (resolve, reject) {

      (0, _request2.default)({
        url: url, //URL to hit
        method: 'GET', //Specify the method
        'auth': {
          'user': username,
          'pass': password,
          'sendImmediately': false
        }
      }, function (error, response, getResponseBody) {
        if ([200, 201, 202].indexOf(response.statusCode) == -1 || error) {
          console.log("GET failed.");
          // TODO: construct a useful error message, request returns a blank
          // error when the server responds, and the response object is massive
          // and unserializable.
          reject(error);
        } else {
          console.log("GET succeeded.");
          _request2.default.post({
            url: postUrl,
            json: JSON.parse(getResponseBody)
          }, function (error, response, postResponseBody) {
            if (error) {
              reject(error);
            } else {
              console.log("POST succeeded.");
              resolve(getResponseBody);
            }
          });
        }
      });
    });
  };
}

/**
 * Make a POST request
 * @example
 * execute(
 *   post(params)
 * )(state)
 * @constructor
 * @param {object} params - data to make the POST
 * @returns {Operation}
 */
function post(url, _ref) {
  var body = _ref.body;
  var callback = _ref.callback;


  return function (state) {

    return new Promise(function (resolve, reject) {
      _request2.default.post({
        url: url,
        json: body
      }, function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          console.log("POST succeeded.");
          resolve(body);
        }
      });
    }).then(function (data) {
      var nextState = _extends({}, state, { response: { body: data } });
      if (callback) return callback(nextState);
      return nextState;
    });
  };
}

/**
 * Make a GET request
 * @example
 * execute(
 *   get("my/endpoint", {
 *     callback: function(data, state) {
 *       return state;
 *     }
 *   })
 * )(state)
 * @constructor
 * @param {string} url - Path to resource
 * @param {object} params - callback and query parameters
 * @returns {Operation}
 */
function get(path, _ref2) {
  var query = _ref2.query;
  var callback = _ref2.callback;

  function assembleError(_ref3) {
    var response = _ref3.response;
    var error = _ref3.error;

    if ([200, 201, 202].indexOf(response.statusCode) > -1) return false;
    if (error) return error;

    return new Error('Server responded with ' + response.statusCode);
  }

  return function (state) {
    var _state$configuration2 = state.configuration;
    var username = _state$configuration2.username;
    var password = _state$configuration2.password;
    var baseUrl = _state$configuration2.baseUrl;
    var authType = _state$configuration2.authType;

    var _expandReferences2 = (0, _languageCommon.expandReferences)({ query: query })(state);

    var qs = _expandReferences2.query;


    var sendImmediately = authType != 'digest';

    var url = (0, _url.resolve)(baseUrl + '/', path);

    return new Promise(function (resolve, reject) {

      (0, _request2.default)({
        url: url, //URL to hit
        qs: qs, //Query string data
        method: 'GET', //Specify the method
        auth: {
          'user': username,
          'pass': password,
          'sendImmediately': sendImmediately
        }
      }, function (error, response, body) {
        error = assembleError({ error: error, response: response });
        if (error) {
          reject(error);
        } else {
          resolve(JSON.parse(body));
        }
      });
    }).then(function (data) {
      var nextState = _extends({}, state, { response: { body: data } });
      if (callback) return callback(nextState);
      return nextState;
    });
  };
}
