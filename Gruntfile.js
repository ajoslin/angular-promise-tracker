module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    dist: 'dist',
    pkgFile: 'bower.json',
    pkg: grunt.file.readJSON('bower.json'),

    watch: {
      scripts: {
        files: ['src/**/*.js', 'test/unit/**/*.js'],
        tasks: ['karma:watch:run']
      },
      gruntfile: {
        files: ['Gruntfile.js'],
        tasks: ['jshint']
      }
    },

    jshint: {
      all: ['Gruntfile.js', 'src/**/*.js'],
      options: {
        eqeqeq: true,
        globals: {
          angular: true
        }
      }
    },

    clean: ['demo/**/*'],

    karma: {
      watch: {
        configFile: 'test/karma.conf.js',
        background: true,
      },
      single: {
        configFile: 'test/karma.conf.js',
        singleRun: true,
        browsers: [process.env.TRAVIS ? 'Firefox' : 'Chrome'],
      }
    },

    changelog: {
      options: {
        dest: 'CHANGELOG.md'
      }
    },
  });

  grunt.registerTask('dev', ['karma:watch', 'watch']);

  grunt.registerTask('default', ['jshint', 'test']);
  grunt.registerTask('test', ['karma:single']);
};
