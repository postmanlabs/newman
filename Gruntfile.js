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
		}
	});

	// plugins
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-mocha-test');

	// register tasks
	grunt.registerTask('prepare_release', ['lint', 'mochaTest', 'jsdoc']);
	grunt.registerTask('default', ['mochaTest', 'jsdoc', 'jshint']);
	grunt.registerTask('test', ['mochaTest', 'jshint']);
	grunt.registerTask('docs', 'jsdoc');
}
