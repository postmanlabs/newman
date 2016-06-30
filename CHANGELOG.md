##CHANGELOG

####2.1.2 (June 30, 2016)
* Latest version of the transformer
* Fixed a bug where requests containing files from the Cloud API were not handled correctly

####2.1.1 (June 07, 2016)
* Latest version of the transformer
* Fixed #402 (Newman breaks if header is empty)
* Update lodash version, fixes #418
* Fixed #406 (Newman breaks with underscore 1.5.2)

####2.1.0 (May 26, 2016)
* Added support for cloud APIs

####2.0.9 (April 22, 2016)
* Fixed a bug where OAuth1 helper failed with URLs containing variables. (postman-app-support#2011) 

####2.0.8 (April 18, 2016)
* Better handling of Request timeouts (@ramblinwreck35)
* Fixed errors with HEAD requests on Node v5
* Support for "deflate" encoding

####2.0.7 (April 13, 2016)
* Fixed #377 (Function variables in the request body not being replaced)

####2.0.6 (April 05, 2016)
* Fixed redirect behavior (redirects on POST requests are now followed by default)
* Added an option to replace Unicode symbols with text (for older terminals)

####2.0.5 (March 24, 2016)
* Fixed Postman.GH#1903 (request.data object inside the sandbox)
* Fixed #361 (Better formatting of HTML report)
* Fixed a bug in Hawk Auth, where nonce generation resulted in an error

####2.0.4 (March 24, 2016)
* Allow PATCH and DELETE requests to have a request body, fixes GH#360

####2.0.3 (March 18, 2016)
* Fixed listeners not being removed after a collection
* Added support for postman.setNextRequest

####2.0.2 (March 15, 2016)
* removed check for empty strings from CSV to be consistent with Postman (by @bwolski)
* Fixed AWS Auth with raw body (Github #345)

####2.0.1 (March 01, 2016)
* Added support for custom ports in AWS Signature v4 auth (by @harshavardhana)
* Updated postman-collection-transformer version

####2.0.0 (February 25, 2016)
* Dropped support for Node v0.10 and v0.12
* Added support for running collections in the new collection format (Details: schema.getpostman.com)
* Bugfix for AWS Auth with a service name [User contributed]

####1.3.0 (February 17, 2016)
* Added support for console.* functions (error, warn)
* Fixed a bug which caused a crash when the request data is empty

####1.2.29 (February 02, 2016)
* Fixed #310 (Better error messages)
* Fixed #311 (Response body logging in verbose output)
* Fixed #320 (Variable replacement for special variables "{{$guid}}" etc)

####1.2.28 (January 08, 2016)
* Fixed handling of null values to be compatible with Postman
* Fixed a bug in handling of OAuth

####1.2.27 (December 18, 2015)
* Set default service name to API Gateway for AWS Authentication

####1.2.26 (December 18, 2015)
* Fixed json traversal https://github.com/postmanlabs/newman/issues/301
* Added support for AWS Signature v4 authentication

####1.2.25 (December 01, 2015)
* Added support for Hawk Authentication

####1.2.24 (November 27, 2015)
* Added `name` and `description` to request object in the Sandbox
* Fixed null OAuth params https://github.com/postmanlabs/postman-app-support/issues/1543
* Fixed a bug where GZip requests failed for no reason

####1.2.23 (October 20, 2015)
* Empty data array fields don't cause errors

####1.2.22 (October 18, 2015)
* Adding option to limit recursive resolution depth

####1.2.21 (September 24, 2015)
* Adding --whiteScreen flag
* Adding option to print all requests and responses in a file

####1.2.20 (September 24, 2015)
* Adding -R option to block redirects
* Adding sugarJS number prototype
* Adding clearVariables sandbox function

####1.2.19 (September 14, 2015)
* Fix for https://github.com/postmanlabs/postman-app-support/issues/1329 (Backslashes in variables)
* JSON.parse shows parsing errors, if any

####1.2.18 (August 7, 2015)
* When used as a library, the callback returns the exit code correctly
* Form fields that are disabled are not sent
* CryptoJS (https://code.google.com/p/crypto-js/) available in the test/pre-request script sandbox
* Repository link updated in CLI

####1.2.17 (July 1, 2015)
* -x / --exitCode works correctly in standalone/library mode

####1.2.16 (June 18, 2015)
* Custom paths to export environment/global files after the run
* Support for custom request timeouts
* Jenkins-compatible JUnit output

####1.2.15 (March 19, 2015)
* Support for authentication helpers (Basic, Digest, OAuth1.0)

####1.2.14 (March 13, 2015)
* Removing dead code for BOM-removal. This also fixes zero-length body cases
* Adding support for commas in data file fields, and double-quotes to surround fields (in line with Postman)

####1.2.13 (February 24, 2015)
* Set Jsdom version to 3.x.x for NodeJS-compatibility

####1.2.11/12 (February 13, 2015)
* Node v0.12.0 supported

####1.2.10 (February 13, 2015)
* Incorrect rawModeData being handled properly
* New sandbox method - xml2Json added. Compatible with POSTMAN
* Envs and Globals set in scripts are available in the env and global arrays instantly

####1.2.9 (February 2, 2015)
* SugarJS object definitions working as expected - https://github.com/a85/Newman/issues/176

####1.2.8 (January 30, 2015)
* Spaces in variable names working

####1.2.7 (January 20, 2015)
* Accepting truthy/falsy values as test results

####1.2.6 (January 17, 2015)
* Fixing tests for different names across iterations

####1.2.5 (January 14, 2015)
* Correcting jUnit export format
* Test results are now parsed consistently (truthy/falsy values are accepted)

####1.2.4 (December 20, 2014)
* Fixed command-line flag for HTML report

####1.2.3 (December 16, 2014)
* Fixed jQuery dependecny issue

####1.2.1 (December 8, 2014)
* Added HTML reporting capability

####1.2.0 (December 2, 2014)
* Adding option for jUnit-style output of test runs - Courtesy @pal-thomassen (BETA)
* Configurable SSL/TLS behavior while running collections - Courtesy @gituser4

####1.1.9 (November 4, 2014)
* Summary correctly shown for folder-only runs

####1.1.8 (November 4, 2014)
* Iteration-wise summary is shown by default

####1.1.7 (October 23, 2014)
* postman.clearEnvironmentVariables() and postman.clearGlobalVariables() available to clear environment and global variables
* postman.getResponseHeader(headerKey) available to get response headers in a case-insensitive manner

####1.1.6 (September 30, 2014)
* Postman backup files can now be imported

####1.1.5 (September 22, 2014)
* Test cases with semicolons in them work properly
* HttpStatusCodes and descriptions are in-line with Postman

####1.1.4 (September 18, 2014)
* Corrected version nummber

####1.1.3 (September 17, 2014)
* {{$randomInt}} works as expected
* {{$guid}} functionality added
* atob and btoa functions now available in tests and pre-request scripts
* Added an option to exit with code=1 if any test in the collection fails

####1.1.2 (September 13, 2014)
* Ability to add a delay between requests

####1.1.1 (September 2, 2014)
* Newman handles the latest version of Postman collections

####1.1.0 (August 19, 2014)
* If used as a library, the exit code is now passed to the callback function


####1.0.9 (July 29, 2014)
* Header names are now converted to title case (Content-Type, instead of content-type)
* An explicit iteration count overrides the data-file
* No separate global file is needed to use global variables


####1.0.7 (July 7, 2014)
* Https requests are now handled by newman.
* Form data can now be taken from data files
* No separate environment file needs to be specified to use env. variables
* Wrong env file paths print a human-readable error message
* "http://" is prefixed to urls without (if not already present)
* Data files do not overwrite all env properties
* Can run only folders by specifying -f
* Pre-Request scripting
