const newman = require('newman');
const yargs = require('yargs');
const figlet = require('figlet');
const fs = require('fs');

const failuresFile = 'failures.csv';
const writer = fs.createWriteStream(failuresFile);
var collection = 'postman/echoRunner.postman_collection.json';
var env = '';
var data = '';
const myRequest = 'echo';


const environmentVars = [];
const globalVars = [];
const failures = [];

figlet("echoRunner", function (err, banner) {
  if (err) {
    console.log('Something went wrong . . .');
    console.dir(err);
    return;
  }
  console.log(banner);
});

yargs.version('0.0.1');
const argv = yargs
    .option('env', {
        alias: 'e',
        description: 'Specify the postman environment.json file to use',
        type: 'string'
    })
    .option('collection', {
      alias: 'c',
      description: 'Specify the postman collection file to use',
      type: 'string'
  })
    .option('data', {
        alias: 'd',
        description: 'Specify the postman iteration-data.json file to use',
        type: 'string'
    })
    .help().alias('help','h').argv;

if (argv.env) {
  env = argv.env;
}
if (argv.collection) {
  collection = argv.collection;
}
if (argv['data']) {
    data = argv['data'];
}
if (argv.version) {
    yargs.showVersion('log');
}

console.log(`Using '${collection}' for collection`);
console.log(`Using '${env}' for environment`);
console.log(`Using '${data}' for iteration-data`);

const parseUid = (rawBody) => {
  const query = rawBody.replace('\\','');
  const queryStringObj = JSON.parse(query);
  const queryString = queryStringObj.queryString;
  const equalsIndex = queryString.indexOf('=');
  const start = queryString.indexOf('\'',equalsIndex)+1;
  const end = queryString.indexOf('\'', start);
  const myuid = queryString.substring(start, end).trim();
  return myuid;
};




writer.write('uid\n');
newman.run({
  collection: collection,
  iterationData: data,
  environment: env,
  envVar: environmentVars,
  globalVar: globalVars,
  reporters: 'cli'
}, function (err) {
if (err) { throw err; }
  console.log('collection run complete!');
})
.on('request', function (error, args) {
  if (args.item.name === myRequest) {
    if (error) {
      console.error(error);
    }
    else {
      var rawBody = args.response.stream, 
      body = rawBody.toString(); 
      try {
        
        const rawBody = args.request.body.raw
        const uid = parseUid(rawBody);
        
        const json = JSON.parse(body);
        console.log()  // bug: missing newline in previous output
        const size = json.length;
          if (Number(uid) % 50 <= 7) {
            console.log(`FAILED: uid: ${uid}`)
            failures.push(uid);
            writer.write(`${uid}\n`);
          } else {
            console.log(`SUCCESS: uid: ${uid}, size: ${size}`);
          }
      } catch (e) {
        console.error("Response was not json");
        console.error(e)
      }
    }
  }
})
.on('done', function (err, summary) {
  var jsonResults = JSON.stringify(failures, null, 4)
  // fs.writeFileSync('failures.json', jsonResults);
  // console.log(`failures: ${jsonResults}`);
  if (failures.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
