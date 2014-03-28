module.exports = function(grunt) {
    // defining tasks
    grunt.initConfig({
        jsdoc: {
            dist: {
                src: ['src/*.js', 'tests/*.js'],
                options: {
                    destination: 'docs'
                }
            }
        },
        test: {
        }
    });

    // plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsdoc');

    // register tasks
    grunt.registerTask('prepare_release', ['lint', 'test', 'jsdoc']);
}
