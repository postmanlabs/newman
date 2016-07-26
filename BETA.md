# Newman <sup>beta</sup>

### Why?
Newman v3.0 Beta is a complete rewrite of Newman from the ground up, which
works well with other Node libraries, and allows flexibility for future features such as 
parallel collection runs, or parallelizing requests within the same run. 

Keeping in mind long standing issues such as 
[#381](https://github.com/postmanlabs/newman/issues/381), 
[#47](https://github.com/postmanlabs/newman/issues/347), 
[#290](https://github.com/postmanlabs/newman/issues/290),
[#168](https://github.com/postmanlabs/newman/issues/168) and a few others, a complete 
rewrite was the best solution.


### Features
1. Better error handling (newman now shows error line numbers in the scripts too)
2. Ability to load environment, globals, collections as well as iteration data from
urls
3. Ability to customize Newman's output, by writing your own reporters
4. Consistency with the Postman App. Newman now runs on 
[Postman Runtime](https://github.com/postmanlabs/postman-runtime/), which will also be used by the App.
5. Friendlier usage as a library. A lot of use-cases depend on the use of Newman as a Node library,
and v3.0 is written with a library-first mindset.


### Todo
It is still a work in progress, so there are a few features that are pending 
implementation:

1. Support for CSV data files
2. Support for test reports:
    1. JUnit XML
    2. HTML
    3. JSON
3. Exporting of environment and globals
4. Support for stopping a run on failures
