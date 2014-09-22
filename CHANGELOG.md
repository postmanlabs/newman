##CHANGELOG

1.1.4 (September 18, 2014)
===============
* Version number fix

1.1.5 (September 22, 2014)
===============
* Test cases with semicolons in them work properly
* HttpStatusCodes and descriptions are in-line with Postman

1.1.4 (September 18, 2014)
===============
* Corrected version nummber

1.1.3 (September 17, 2014)
===============
* {{$randomInt}} works as expected
* {{$guid}} functionality added
* atob and btoa functions now available in tests and pre-request scripts
* Added an option to exit with code=1 if any test in the collection fails

1.1.2 (September 13, 2014)
===============
* Ability to add a delay between requests

1.1.1 (September 2, 2014)
================
* Newman handles the latest version of Postman collections

1.1.0 (August 19, 2014)
================
* If used as a library, the exit code is now passed to the callback function


1.0.9 (July 29, 2014)
================
* Header names are now converted to title case (Content-Type, instead of content-type)
* An explicit iteration count overrides the data-file
* No separate global file is needed to use global variables


1.0.7 (July 7, 2014)
================
* Https requests are now handled by newman.
* Form data can now be taken from data files
* No separate environment file needs to be specified to use env. variables
* Wrong env file paths print a human-readable error message
* "http://" is prefixed to urls without (if not already present)
* Data files do not overwrite all env properties
* Can run only folders by specifying -f
* Pre-Request scripting