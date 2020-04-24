"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.execute = execute;
exports.fetchSubmissions = fetchSubmissions;
Object.defineProperty(exports, "field", {
  enumerable: true,
  get: function get() {
    return _languageCommon.field;
  }
});
Object.defineProperty(exports, "fields", {
  enumerable: true,
  get: function get() {
    return _languageCommon.fields;
  }
});
Object.defineProperty(exports, "sourceValue", {
  enumerable: true,
  get: function get() {
    return _languageCommon.sourceValue;
  }
});
Object.defineProperty(exports, "alterState", {
  enumerable: true,
  get: function get() {
    return _languageCommon.alterState;
  }
});
Object.defineProperty(exports, "merge", {
  enumerable: true,
  get: function get() {
    return _languageCommon.merge;
  }
});
Object.defineProperty(exports, "dataPath", {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataPath;
  }
});
Object.defineProperty(exports, "dataValue", {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataValue;
  }
});
Object.defineProperty(exports, "lastReferenceValue", {
  enumerable: true,
  get: function get() {
    return _languageCommon.lastReferenceValue;
  }
});

var _languageCommon = require("language-common");

var _request = _interopRequireDefault(require("request"));

var _url = require("url");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
  for (var _len = arguments.length, operations = new Array(_len), _key = 0; _key < _len; _key++) {
    operations[_key] = arguments[_key];
  }

  var initialState = {
    references: [],
    data: null
  };
  return function (state) {
    state.configuration.baseUrl = 'https://'.concat(state.configuration.instanceName, '.surveycto.com/api/v1');
    return _languageCommon.execute.apply(void 0, operations)(_objectSpread({}, initialState, {}, state));
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
  return function (state) {
    var _state$configuration = state.configuration,
        baseUrl = _state$configuration.baseUrl,
        username = _state$configuration.username,
        password = _state$configuration.password,
        instanceName = _state$configuration.instanceName;
    return new Promise(function (resolve, reject) {
      (0, _request["default"])({
        url: "".concat(baseUrl, "/forms/data/wide/json/").concat(formId),
        method: 'GET',
        auth: {
          username: username,
          password: password,
          sendImmediately: false
        },
        headers: {
          'Content-Type': 'application/json'
        },
        query: {
          date: state.lastSubmissionDate || afterDate
        }
      }, function (error, response, body) {
        if (error) {
          return console.error('fetch failed:', error);
        }

        console.log('Fetch successful!'); // Pick submissions out in order to avoid `post` overwriting `response`.

        var submissions = JSON.parse(response.body); // return submissions

        return submissions.reduce(function (acc, item) {
          // tag submissions as part of the identified form
          item.formId = formId;
          return acc.then((0, _request["default"])({
            url: postUrl,
            method: 'POST',
            json: item
          }));
        }, Promise.resolve(state)).then(function (state) {
          if (submissions.length) {
            state.lastSubmissionDate = submissions[submissions.length - 1].SubmissionDate;
          }

          return state;
        }).then(function (state) {
          delete state.response;
          console.log('fetchSubmissions succeeded.');
          return state;
        });
      });
    });
  };
}
