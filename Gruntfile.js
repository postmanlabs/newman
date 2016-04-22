module.exports = function (grunt) {
    // defining tasks
    grunt.initConfig({
        jshint: {
            all: ['src/*.js', 'src/**/*.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        jsdoc: {
            dist: {
                src: ['src/*.js', 'src/**/*.js', 'tests/**/*.js'],
                options: {
                    destination: 'docs'
                }
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    timeout: 200,
                    slow: 200
                },
                src: ["tests/**/*.js"]
            }
        },
        run: {
            integTest: {
                exec: 'node bin/newman -c tests/integ_tests/tc2.json -d tests/integ_tests/d2.json -e tests/integ_tests/e2.json -s && ' +
                'node bin/newman -c tests/integ_tests/tc3.json -d tests/integ_tests/d3.json -e tests/integ_tests/e3.json -g tests/integ_tests/g3.json -s && ' +
                'node bin/newman -c tests/integ_tests/tc4.json -s && ' +
                'node bin/newman -c tests/integ_tests/randomIntC.json -s && ' +
                'node bin/newman -c tests/integ_tests/semicolon_tests.json -s && ' +
                'node bin/newman -c tests/integ_tests/varReplacement.json -s && ' +
                'node bin/newman -c tests/integ_tests/clearVars.json -s && ' +
                'node bin/newman -c tests/integ_tests/helper.postman_collection -n 3 -s && ' +
                'node bin/newman -c tests/integ_tests/steph.json -s -d tests/integ_tests/steph_data.csv -n 2 -s && ' +
                'node bin/newman -c tests/integ_tests/caseInsenHeader.json -s && ' +
                'node bin/newman -c tests/integ_tests/CommaTest.json.postman_collection -d tests/integ_tests/csvComma.csv -s && ' +
                'node bin/newman -c tests/integ_tests/crypto-md5.json.postman_collection -s && ' +
                'node bin/newman -c tests/integ_tests/esc.postman_collection -e tests/integ_tests/esc.postman_environment -s && ' +
                'node bin/newman -c tests/integ_tests/prototypeCheck.json.postman_collection -s && ' +
                'node bin/newman -c tests/integ_tests/redirectTest.json.postman_collection -s -R && ' +
                'node bin/newman -c tests/integ_tests/requestNameInScript.json.postman_collection -s && ' +
                'node bin/newman -c tests/integ_tests/multipleFormValues.json.postman_collection -s &&' +
                'node bin/newman -c tests/integ_tests/randomIntC.json -s -W &&' +
                'node bin/newman -c tests/integ_tests/newmangziptest.json.postman_collection -s &&' +
                'node bin/newman -c tests/integ_tests/hawkAuthTest.json.postman_collection -s &&' +
                'node bin/newman -c tests/integ_tests/echo-v2.json -s &&' +
                'node bin/newman -c tests/integ_tests/multiValueData.json -s &&' +
                'node bin/newman -c tests/integ_tests/setNextRequest.json -s -n 2 &&' +
                'node bin/newman -c tests/integ_tests/headRequests.json -s &&' +
                'node bin/newman -c tests/integ_tests/function_var_replacement.postman_collection -s &&' +
                'node bin/newman -c tests/integ_tests/oauth1-var-in-url-params.json.postman_collection -s'
            }
        }
    });

    // plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-run');

    // register tasks
    grunt.registerTask('prepare_release', ['lint', 'mochaTest', 'jsdoc']);
    grunt.registerTask('default', ['mochaTest', 'jsdoc', 'jshint']);
    grunt.registerTask('test', ['mochaTest', 'jshint', 'run:*']);
    grunt.registerTask('integ_test', ['run:*']);
    grunt.registerTask('docs', 'jsdoc');
};
