##CHANGELOG

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