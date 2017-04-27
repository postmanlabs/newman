# Newman Changelog

#### v3.5.2 (Mar 17, 2017)
- Update `postman-runtime` to v5.0.0, which uses `CertificateList` for client side SSL

#### v3.5.1 (Mar 14, 2017)
- Fixed a bug which caused some test results to not be displayed (#949)
- Merged aggregation partial into base HTML reporter template
- Allowed `options.iterationData` to be specified as an array of objects in programmatic usage

#### v3.5.0 (Mar 07, 2017)
- Added support for multi level folders in the cli, html and junit reporters
- Updated `postman-collection` to v1.0.0, which contains helper methods for dealing with multi-level folders
- Updated many other non-critical packages

#### v3.4.3 (Jan 31, 2017)
- Updated `postman-runtime` to v4.0.3, which contains bugfixes for URL parameter encoding
- Updated `postman-collection` to v0.5.11, which contains bugfixes for UTF-8 encoded responses, and variables in URL hosts

#### v3.4.2 (Jan 09, 2017)
- Fixed a bug in the CLI reporter for Newman programmatic usage (#859)

#### v3.4.1 (Jan 06, 2017)
- Fixed Buffer compatibility issue for Node v4 
- HTML reporter works correctly for failed requests

#### v3.4.0 (Dec 29, 2016)
- Updated `postman-runtime` to v4.0, which has a lot of memory usage improvements
- HTML reporter now contains folder information
- Added `--color` option to force colored output in non-TTY environments

#### v3.3.1 (Dec 14, 2016)
- Added more details to the HTML reporter
- Updated `postman-collection` to the latest version which contains a bugfix for OAuth1 with realms
- Updated `postman-runtime` which has a few fixes for browser based workflows

#### v3.3.0 (Nov 21, 2016)
- Added options to provide client-side SSL certificates on the command line
- Updated the versions of `postman-runtime` and `postman-collection` libraries

#### v3.2.0 (Oct 18, 2016)
- Ensure that environment exports are consistent with the app
- Simplified the importing logic for environment and globals

#### v3.1.1 (Aug 25, 2016)

- Updated `postman-runtime`, `postman-collection` and `postman-collection-transformer` dependencies

#### v3.1.1 (Aug 25, 2016)

- Fixed a bug which caused HTML reporter statistics to be incorrect
- Added an option `--disable-unicode` to forcibly disable unicode symbols in the output
- File based options in newman.run (environments, data, globals) can now be specified as JSON objects as well
- Updated to the latest version of Postman Runtime, which contains a number of memory optimizations
- Specifying an iteration data file now results in the correct number of iteration runs

#### v3.1.0 (Aug 25, 2016)

- Fixed issue with environment and globals export format was using wrong property names (GH:553)
- Fixed issue where `--export-*` CLI option did not work with no parameters
- Added support for `postman.getResponseCookie` in the script sandbox
- Prettified HTML report template
- Added support for custom HTML report templates via `--reporter-html-template` flag
- Added file upload support
- Fixed a bug in the timeout request flag: #547
- Updated runtime dependency to 2.4.4
- Fixed a bug that caused incorrect iterationCount detection
- Better error messages
- Fixed a bug that caused incorrect exports of environment and global values
- The export parameters now default to `/newman/*`
- Added a new CLI option, `--silent` which ensures Newman does not write anything to the terminal

#### v3.0.1 (Aug 9, 2016)

- Updated Postman Runtime to v2.4.1
- Newman now exits with a non-zero status code on test failures or errors

#### v3.0.0 (Aug 9, 2016)

- First stable release of Newman v3.0
- Added ability to suppress exit code on failures
- Renamed the "--stop-on-error" option to "--bail", which ensures that Newman stops on test failures or errors

#### v3.0.0-rc.1 (Aug 8, 2016)

- Initial release of Newman v3. [Migration Guide](MIGRATION.md)

> To view changelog for older versions, refer to https://github.com/postmanlabs/newman/blob/release/2.x/CHANGELOG.md
