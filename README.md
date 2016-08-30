Language SurveyCTO
==================

Language Pack for building expressions and operations to make HTTP calls to
SurveyCTO.

Documentation
-------------
## fetchSubmissions

#### sample configuration
```js
{
  "username": "taylor@openfn.org",
  "password": "supersecret",
  "instanceName": "openfn_test"
}
```

### sample fetchSubmissions(formId, afterDate, postUrl) expression

```js
fetchSubmissions(
  "household_survey",
  sourceValue("$.lastSubmissionDate") || "Aug 29, 2016 4:44:26 PM",
  "https://www.openfn.org/inbox/secret-inbox-uuid"
)
```

[Docs](docs/index)


Development
-----------

Clone the repo, run `npm install`.

Run tests using `npm run test` or `npm run test:watch`

Build the project using `make`.
