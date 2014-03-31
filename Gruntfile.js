module.exports = function(grunt) {
    // defining tasks
    grunt.initConfig({
        jsdoc: {
            dist: {
                src: ['src/*.js', 'tests/*.js', 'src/errors/*.js','src/runners/*.js',
                      'src/utilities/*.js', 'src/models/*.js', 'src/responseHandlers/*.js'],
                options: {
                    destination: 'docs'
                }
            }
        },
		mochaTest: {
			test: {
				src: ["tests/*.js"]
			}
		}
    });

    // plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-mocha-test');

    // register tasks
    grunt.registerTask('prepare_release', ['lint', 'mochaTest', 'jsdoc']);
	grunt.registerTask('default', ['mochaTest', 'jsdoc']);
	grunt.registerTask('test', 'mochaTest');
}
