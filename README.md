[![New Relic Experimental header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/Experimental.png)](https://opensource.newrelic.com/oss-category/#new-relic-experimental)

# New Relic Dashboard Utility

The New Relic Dashboard Utility is an application utility that can be used
for bulk migration of NR1 dashboards from one account to another.

## Prerequisites

* You must have Node.JS and NPM installed.
  * Run both `node -v` and `npm -v` at a command line to test.

## Installation

1. Clone this repository

   ```sh
   git clone git@github.com:newrelic-experimental/nr-dashboard-utility.git
   ```

2. Run install at the command-line:

   ```sh
   npm install
   ```

## Usage

```sh
./main.js -c config-file [-o output-file] [-d] [-v]
```

### Options

| Option | Description | Example |
| --- | --- | --- |
| `-c / --config config-file` | YML configuration file | `-c config.yml` |
| `-o / --output-file output-file` | Output migrate status to `output-file` | `-o report.csv` |
| `-v` | Verbose mode - overrides `VERBOSE: true` in configuration file | `-v` |
| `-d` | Debug mode - overrides `DEBUG: true` in configuration file | `-d` |

### Configuration File

The format of the configuration file is as follows.

```yml
verbose: true
debug: false
userKey: 'L12345'
source:
  accountId: 12345
  userKey: 'NRAK-12345'
  dashboards:
  - name: 'Acme Telco Hosts'
  - guid: 'M234j1234k123y7W'
target:
  accountId: 3080153
  userKey: 'L56789'
```

`verbose`

Set to `true` to enable verbose output or `false` to disable. If set to `false`,
the tool is relatively silent. Using `-v` at the command line overrides this
value. The default is `true`.

`debug`

Set to `true` to enable debug output or `false` to disable. Using `-d` at the
command line overrides this value. The default is `false`.

`userKey`

The [user API key](https://docs.newrelic.com/docs/apis/get-started/intro-apis/new-relic-api-keys/#user-api-key)
to use on GraphQL calls. If both the source and target accounts can be accessed
using the same key, set this value. Otherwise, set inidividual keys in the
`source` or `target` section.

`source`

Source account information

`source.accountId`

The source account ID.

`source.userKey`

The [user API key](https://docs.newrelic.com/docs/apis/get-started/intro-apis/new-relic-api-keys/#user-api-key)
to use on GraphQL calls for the source account. Overrides the global `userKey`.

`source.dashboards`

The list of dashboards to migrate. Each element of this list represents a single
dashboard to migrate. Use the `name` key to specify a dashboard to migrate by
name.  Use the `guid` key to specify a dashboard to migrate by GUID. Do not
specify both `name` and `guid`.

`target`

Target account information

`target.accountId`

The target account ID.

`target.userKey`

The [user API key](https://docs.newrelic.com/docs/apis/get-started/intro-apis/new-relic-api-keys/#user-api-key)
to use on GraphQL calls for the target account. Overrides the global `userKey`.

## Support

New Relic hosts and moderates an online forum where customers can interact with
New Relic employees as well as other customers to get help and share best
practices. Like all official New Relic open source projects, there's a related
Community topic in the New Relic Explorers Hub. You can find this project's
topic/threads here:

[https://discuss.newrelic.com/c/build-on-new-relic](https://discuss.newrelic.com/c/build-on-new-relic)

## Contribute

We encourage your contributions to improve the New Relic Dashboard Utility! Keep
in mind that when you submit your pull request, you'll need to sign the CLA via
the click-through using CLA-Assistant. You only have to sign the CLA one time
per project.

If you have any questions, or to execute our corporate CLA (which is required if
your contribution is on behalf of a company), drop us an email at
opensource@newrelic.com.

**A note about vulnerabilities**

As noted in our [security policy](../../security/policy), New Relic is committed
to the privacy and security of our customers and their data. We believe that
providing coordinated disclosure by security researchers and engaging with the
security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of
New Relic's products or websites, we welcome and greatly appreciate you
reporting it to New Relic through [HackerOne](https://hackerone.com/newrelic).

If you would like to contribute to this project, review [these guidelines](./CONTRIBUTING.md).

To all contributors, we thank you!  Without your contribution, this project
ould not be what it is today.

## License
The New Relic Dashboard Utility is licensed under the [Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt)
License.
The New Relic Dashboard Utility also uses source code from third-party
libraries. You can find full details on which libraries are used and the terms
under which they are licensed in the third-party notices document.
