# Newman <sup>beta</sup>

### Why?

Newman v3.0 Beta is a complete rewrite of Newman from the ground up, which works well with other Node libraries, and
allows flexibility for future features such as parallel collection runs, or performing parallel requests within the
same run. Above all, Newman now uses [Postman Runtime](https://github.com/postmanlabs/postman-runtime/) in order to
provide a consistent experience on Postman Apps and on CLI.

Keeping in mind long standing issues such as
[#381](https://github.com/postmanlabs/newman/issues/381),
[#47](https://github.com/postmanlabs/newman/issues/347),
[#290](https://github.com/postmanlabs/newman/issues/290),
[#168](https://github.com/postmanlabs/newman/issues/168) and a few others, a complete rewrite was the best solution.

### General overview of features

1. More informative terminal output with colourful details of what went wrong, and most importantly, where it went
   wrong.
2. Ability to load environment, globals, collections as well as iteration data from urls.
3. Friendlier usage as a library. A lot of use-cases depend on the use of Newman as a Node library, and v3.0 is written
   with a library-first mindset.
4. Internally things (by things, we usually mean code) have been better organised to allow faster implementation of
   features.

### Todo

It is still a work in progress, so there are a few features that are pending
implementation:

1. -Support for CSV data files-
2. Support for test reports:
    1. JUnit XML
    2. HTML
3. Exporting of environment, globals and collection
4. Support for stopping a run on failures

### Migrating from v2.x

Migrating to Newman v3.x for most simple use cases is a trivial affair. We have taken care to support older CLI options.
Which means, if you upgrade, it should just work! Having said that, we would soon discontinue the older CLI options and
you should start using the new ones. Furthermore, the new features are only available via the new CLI options.

Since Newman 3.x is a complete rewrite, expect it to have subtle behavioural differences when compared with Newman v2.x,
your reports will look a bit different, the CLI output is a complete overhaul, your collection runs will inherit all the
qualities of the new Postman Runtime (jQuery deprecation, discontinuation of DOM), etc.

As such, if there is something specific that not working with respect to v2.x or any workaround that you were doing,
we will be glad to chat and find out if they can still be done. Simply join the #newman channel in our Slack
Community.
