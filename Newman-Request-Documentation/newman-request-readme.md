## Table of contents

1. [Usage](#usage)
    1. [Using Newman Request](#using-newman-request)
    2. [Using Reporters with Newman](#using-reporters-with-newman)
2. [Newman Request Options](#command-line-options)
    1. [newman-request](#newman-request-request-file-source-options)
3. [API Reference](#api-reference)
    1. [Events emitted during a single request run](#newman-request-events)
4. [Reporters](#reporters)
    1. [Configuring Reporters](#configuring-reporters)
    2. [CLI Reporter](#cli-reporter)
    3. [JSON Reporter](#json-reporter)
    4. [JUnit Reporter](#junitxml-reporter)
    5. [HTML Reporter](#html-reporter)

## Usage

### Using Newman Request
The `newman request` command allows you to run a single-request from the command line. You can easily show the request/response on the command-line using the reporter of your choice.

```console
$ newman request -X POST https://postman-echo.com/post
```
```console
$ newman request -X GET https://google.com
```
For the complete list of options, refer the [Command Line Options](#command-line-options) section below.

![terminal demo]()



### Using Reporters with Newman
Reporters provide information about the current collection run in a format that is easy to both: disseminate and assimilate.
Reporters can be configured using the `-r` or `--reporters` options. Inbuilt reporters in newman are: `cli`, `json`, `junit`, `progress` and `emojitrain`.

CLI reporter is enabled by default when Newman is used as a CLI, you do not need to specifically provide the same as part of reporters option. However, enabling one or more of the other reporters will result in no CLI output. Explicitly enable the CLI option in such a scenario. Check the example given below using the CLI and JSON reporters:

```console
$ newman request -X POST https://postman-echo.com/post -r cli,json
```
[back to top](#table-of-contents)

## Newman Request Options


### `newman request <request-file-source> [options]`

- `-X <method>, --request <method>`<br />
  (HTTP) Specifies a custom request method to use when communicating with the HTTP server. The specified request method will be used instead of the method otherwise used (which defaults to GET).  

- `-H <header>, --header <header>`<br />
  (HTTP) Extra header to include in the request when sending HTTP to a server. You may specify any number of extra headers.
  
- `-A <agent>, --user-agent <agent>`<br />
  (HTTP) Specify the User-Agent string to send to the HTTP server. To encode blanks in the string, surround the string with single quote marks. This header can also be set with the  -H, --header  or the  --proxy-header options.

- `-d <data>, --data <data>`<br />
Sends the specified data in a POST request to the HTTP server, in the same way that a browser does when a user has filled in an HTML form and presses the submit button.

- `--data-raw <data>`<br />
This posts data similarly to  -d, --data  but without the special interpretation of the @ character. 

- `--data-urlencode <data>`<br />
This posts data, similar to the other  -d, --data  options with the exception that this performs URL-encoding. It sends the specified data to the server with type application/x-www-form-urlencoded

- `--data-binary <data>`<br />
This posts data exactly as specified with no extra processing whatsoever.

- `-F, --form <name=content>`<br />
For HTTP protocol family, this lets Newman Request to emulate a filled-in form in which a user has pressed the submit button. This causes Newman Request to POST data using the Content-Type multipart/form-data. 

- `-G, --get`<br />
Forces the request to be sent as GET, with the --data parameters appended to the query string.

- `-I, --head`<br />
Forces the request to be sent as HEAD, with the --data parameters appended to the query string.

- `-T, --upload-file <file>`<br />
This transfers the specified local file to the remote URL. If there is no file part in the specified URL, Newman Request will append the local file name.

- `-x, --suppress-exit-code`<br />
Specifies whether or not to override the default exit code for the current request.

- `--verbose`<br />
Show detailed information of the single request.

- `-r, --reporters [reporters]`<br />
Specifies the reporters to use for this run, default reporter is ‘CLI’.

- `--response-limit <integer>`<br />
Shows the limit of response-size, default limit is 10MB (1024*1024*10). It gives a warning if the response limit is exceeded and redirects the user to JSON reporter to download the output in an external file.


## API Reference

### newman.request~events


All events receive two arguments (1) `error` and (2) `args`. **The list below describes the properties of the second
argument object.**

| Event     | Description   |
|-----------|---------------|
| start                     | The start of the request run |
| beforeRequest             | Before an HTTP request is sent |
| request                   | After response of the request is received |
| done                      | This event is emitted when the request run has completed, with or without errors |

[back to top](#table-of-contents)

## Reporters

### Configuring Reporters

- `-r <reporter-name>`, `--reporters <reporter-name>`<br />
  Specify one reporter name as `string` or provide more than one reporter name as a comma separated list of reporter names. Available reporters are: `cli`, `json`, `junit`, `progress` and `emojitrain`.<br/><br/>
  Spaces should **not** be used between reporter names / commas whilst specifying a comma separated list of reporters. For instance:<br/><br/>
  :white_check_mark: `-r cli,json,junit`<br/>
  :x: `-r cli , json,junit`

- `--reporter-{{reporter-name}}-{{reporter-option}}`<br />
  When multiple reporters are provided, if one needs to specifically override or provide an option to one reporter, this
  is achieved by prefixing the option with `--reporter-{{reporter-name}}-`.<br /><br />
  For example, `... --reporters cli,json --reporter-cli-silent` would silence the CLI reporter only.

- `--reporter-{{reporter-options}}`<br />
  If more than one reporter accepts the same option name, they can be provided using the common reporter option syntax.
  <br /><br />
  For example, `... --reporters cli,json --reporter-silent` passes the `silent: true` option to both JSON and CLI
  reporter.

### CLI Reporter
The built-in CLI reporter supports the following options, use them with appropriate argument switch prefix. For example, the
option `no-summary` can be passed as `--reporter-no-summary` or `--reporter-cli-no-summary`.

CLI reporter is enabled by default when Newman is used as a CLI, you do not need to specifically provide the same as part of `--reporters` option.
However, enabling one or more of the other reporters will result in no CLI output. Explicitly enable the CLI option in
such a scenario.

| CLI Option  | Description       |
|-------------|-------------------|
| `--reporter-cli-silent`         | The CLI reporter is internally disabled and you see no output to terminal. |

| `--reporter-cli-show-timestamps` | This prints the local time for each request made. | 
| `--reporter-cli-no-summary`     | The statistical summary table is not shown. |
| `--reporter-cli-no-failures`    | This prevents the run failures from being separately printed. |
| `--reporter-cli-no-assertions`  | This turns off the output for request-wise assertions as they happen. |
| `--reporter-cli-no-success-assertions`  | This turns off the output for successful assertions as they happen. |
| `--reporter-cli-no-console`     | This turns off the output of `console.log` (and other console calls) from collection's scripts. |
| `--reporter-cli-no-banner`      | This turns off the `newman` banner shown at the beginning of each collection run. |

### JSON Reporter
The built-in JSON reporter is useful in producing a comprehensive output of the run summary. It takes the path to the
file where to write the report. The content of this file is exactly the same as the `summary` parameter sent to the callback
when Newman is used as a library.

To enable JSON reporter, provide `--reporters json` as a CLI option.

| CLI Option  | Description       |
|-------------|-------------------|
| `--reporter-json-export <path>` | Specify a path where the output JSON file will be written to disk. If not specified, the file will be written to `newman/` in the current working directory. If the specified path does not exist, it will be created. However, if the specified path is a pre-existing directory, the report will be generated in that directory. |

### JUNIT/XML Reporter
The built-in JUnit reporter can output a summary of the collection run to a JUnit compatible XML file. To enable the JUNIT reporter, provide
`--reporters junit` as a CLI option.

| CLI Option  | Description       |
|-------------|-------------------|
| `--reporter-junit-export <path>` | Specify a path where the output XML file will be written to disk. If not specified, the file will be written to `newman/` in the current working directory. If the specified path does not exist, it will be created. However, if the specified path is a pre-existing directory, the report will be generated in that directory. |

### HTML Reporter
An external reporter, maintained by Postman, which can be installed via `npm install -g newman-reporter-html`. This reporter was part of the Newman project but was separated out into its own project in V4.

The complete installation and usage guide is available at [newman-reporter-html](https://github.com/postmanlabs/newman-reporter-html#readme). Once the HTML reporter is installed you can provide `--reporters html` as a CLI option.

[back to top](#table-of-contents)

