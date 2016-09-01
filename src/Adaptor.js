import { execute as commonExecute, expandReferences } from 'language-common';
import request from 'request'
import { resolve as resolveUrl } from 'url';
import Adaptor from 'language-http';
const { get, post } = Adaptor;
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
export function execute(...operations) {
  const initialState = {
    references: [],
    data: null
  }

  return state => {
    state.configuration.authType = 'digest';
    state.configuration.baseUrl = "https://".concat(state.configuration.instanceName, ".surveycto.com/api/v1")
    return commonExecute(...operations)({ ...initialState, ...state })
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
export function fetchSubmissions(formId, afterDate, postUrl) {
  return get(`forms/data/wide/json/${ formId }`, {
    query: function(state) {
      console.log(state.configuration.baseUrl)
      return { date: state.lastSubmissionDate || afterDate }
    },
    callback: function(state) {
      // Pick submissions out in order to avoid `post` overwriting `response`.
      var submissions = state.response.body;
      // return submissions
      return submissions.reduce(function(acc, item) {
        // tag submissions as part of the "pula_household" form
        item.formId = formId;
        return acc.then(
          post( postUrl, { body: item })
        )
      }, Promise.resolve(state))
        .then(function(state) {
          state.lastSubmissionDate = submissions[submissions.length-1].SubmissionDate
          return state;
        })
        .then(function(state) {
          delete state.response
          return state;
        })
    }
  })
}

export {
  field, fields, sourceValue, fields, alterState,
  merge, dataPath, dataValue, lastReferenceValue
} from 'language-common';
