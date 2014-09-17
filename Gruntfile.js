module.exports = function(grunt) {
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
					reporter: 'spec'
				},
				src: ["tests/**/*.js"]
			}
		},
		run: {
			integTest: {
      			exec: 'bin/newman -c tests/integ_tests/tc2.json -d tests/integ_tests/d2.json -e tests/integ_tests/e2.json -s &&' +
					' bin/newman -c tests/integ_tests/tc3.json -d tests/integ_tests/d3.json -e tests/integ_tests/e3.json -g tests/integ_tests/g3.json -s && ' +
					'bin/newman -c tests/integ_tests/tc4.json -s && ' +
					'bin/newman -c tests/integ_tests/randomIntC.json'
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
	grunt.registerTask('test', ['mochaTest', 'jshint','run:*']);
	grunt.registerTask('integ_test',['run:*'])
	grunt.registerTask('docs', 'jsdoc');
}
