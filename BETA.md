# Newman <sup>beta</sup>

## Why?

Newman v3.0 Beta is a complete rewrite of Newman from the ground up, which works well with other Node libraries, and
allows flexibility for future features such as parallel collection runs, or performing parallel requests within the
same run. Above all, Newman now uses [Postman Runtime](https://github.com/postmanlabs/postman-runtime/) in order to
provide a consistent experience on Postman Apps and on CLI.

Keeping in mind long standing issues such as
[#381](https://github.com/postmanlabs/newman/issues/381),
[#47](https://github.com/postmanlabs/newman/issues/347),
[#290](https://github.com/postmanlabs/newman/issues/290),
[#168](https://github.com/postmanlabs/newman/issues/168) and a few others, a complete rewrite was the best solution.

## General overview of features

1. More informative terminal output with colourful details of what went wrong, and most importantly, where it went
   wrong.
2. Ability to load environment, globals, collections as well as iteration data from urls.
3. Friendlier usage as a library. A lot of use-cases depend on the use of Newman as a Node library, and v3.0 is written
   with a library-first mindset.
4. Internally things (by things, we usually mean code) have been better organised to allow faster implementation of
   features.

## Todo

It is still a work in progress, so there are a few features that are pending
implementation:

1. -Support for CSV data files-
2. -Support for test reports:-
    1. -JUnit XML-
    2. -HTML-
3. -Exporting of environment, globals and collection-
4. Support for stopping a run on failures
5. Make generic and uncaught exceptions more readable in CLI
6. Better HTML and JUnit output formatting

## Migrating from v2.x

Migrating to Newman v3.x for most simple use cases is a trivial affair. We have taken care to support older CLI options.
Which means, if you upgrade, it should just work! Having said that, we would soon discontinue the older CLI options and
you should start using the new ones. Furthermore, the new features are only available via the new CLI options.

Since Newman 3.x is a complete rewrite, expect it to have subtle behavioural differences when compared with Newman v2.x,
your reports will look a bit different, the CLI output is a complete overhaul, your collection runs will inherit all the
qualities of the new Postman Runtime (jQuery deprecation, discontinuation of DOM), etc.

As such, if there is something specific that not working with respect to v2.x or any workaround that you were doing,
we will be glad to chat and find out if they can still be done. Simply join the #newman channel in our Slack
Community.

### HTML, XML and other outputs are now "reporters"
Newman v3 adopts a "reporter" model and as such features that were previously part of Newman core has now been moved
into reporters. Consequently, the CLI options for these features are now accessible via `--reporter-*` options. You
might also notice that some of the functionalities of reporters have been reduced even though the reporter outputs have
become more detailed. This is to offload non-essential codebase away from Newman core and be later made pluggable into
external reporter plugins.

### --no-color is automated
Newman now automatically detects lack of colour support and as such this flag does not need to be explicitly provided
any more. However, `--no-color` is still available to force not to use colors in terminal output.

### Discontinued CLI Options

#### --disable-unicode
This switch no longer has any effect. Newman v3 effectively handles unicode output on Windows Platform.

#### -p, --pretty
This switch used to render exported JSON files in newman v2 in a pretty format. Newman v3 always exports in pretty
format and as such, this switch is now not needed. If you want to use compressed export formats, run the exported files
through some JSON minifier.
