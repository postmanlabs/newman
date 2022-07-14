# Bug 2712 Reproducer
This bug happens while using newman as a library with a data file containing multiple iterations. 

## About this reproducer
This reproducer uses docker-compose to run a node.js script which uses newman library so it can write to a file (failures.csv) The `echoRunner.postman_collection.json` hits the `https://postman-echo.com/post` endpoint once for each iteration using the data provided in the datafile.  Failures are contrived mathmatically to produce some failures which will be written to the failures.csv file.

## Running this reproducer 
* Prerequisites: docker-compose, docker
To run a quick sanity check with a data file with one iteration do the following
```
export DATAFILE=data/one.csv; docker-compose up --build
```

To reproduce the bug, set the `$DATAFILE` env variable to the `uids.csv` containing multple iterations.  This reproducer will run out of heap space at approximately iteration 32200

```
export DATAFILE=data/uids.csv; docker-compose up --build
```
```
. . . 
newman_1  | Iteration 32173/121209
newman_1  | 
newman_1  | → echo
newman_1  |   POST https://postman-echo.com/post 
newman_1  | SUCCESS: uid: 315769, size: undefined
newman_1  | [200 OK, 1.02kB, 25ms]
newman_1  |   ✓  Status code is 200
newman_1  |   ✓  Check uid % 50 > 7
newman_1  | 
newman_1  | <--- Last few GCs --->
newman_1  | 
newman_1  | [1:0x7fa9d36693b0]  1605430 ms: Mark-sweep 981.7 (1058.0) -> 968.6 (1058.3) MB, 691.6 / 0.1 ms  (average mu = 0.369, current mu = 0.348) task scavenge might not succeed
newman_1  | [1:0x7fa9d36693b0]  1606491 ms: Mark-sweep 982.0 (1058.3) -> 968.8 (1058.5) MB, 652.4 / 0.1 ms  (average mu = 0.377, current mu = 0.385) task scavenge might not succeed
newman_1  | [1:0x7fa9d36693b0]  1607515 ms: Mark-sweep 982.2 (1058.5) -> 969.0 (1058.8) MB, 632.9 / 0.1 ms  (average mu = 0.379, current mu = 0.382) task scavenge might not succeed
newman_1  | 
newman_1  | 
newman_1  | <--- JS stacktrace --->
newman_1  | 
newman_1  | FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
echorunner_newman_1 exited with code 139
```