module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-ngmin');

  grunt.initConfig({
    dist: '.',
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '* <%= pkg.homepage %>\n' +
        '* Created by <%= pkg.author.name %>; ' +
        ' Licensed under <%= pkg.license %> \n*/'
    },
    delta: {
      scripts: {
        files: ['src/**/*.js', 'test/unit/**/*.js'],
        tasks: ['jshint', 'karma:watchold:run', 'karma:watchnew:run']
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
    concat: {
      dist: {
        options: {
          banner: "<%= meta.banner %>"
        },
        files: {
          '<%= dist %>/promise-tracker.js': ['src/**/*.js', '!src/**/*.spec.js']
        }
      }
    },
    ngmin: {
      dist: {
        files: {
          //Have ngmin just create a .min file, that will then be actually mind
          '<%= dist %>/promise-tracker.min.js': '<%= dist %>/promise-tracker.js'
        }
      }
    },
    uglify: {
      dist: {
        files: {
          //Actually minify our ngmin'd file
          '<%= dist %>/promise-tracker.min.js': '<%= dist %>/promise-tracker.min.js'
        }
      }
    },
    karma: {
      watchold: {
        configFile: 'test/karma-oldangular.conf.js',
        background: true
      },
      watchnew: {
        configFile: 'test/karma-newangular.conf.js',
        background: true
      },
      continuousold: {
        configFile: 'test/karma-oldangular.conf.js',
        singleRun: true,
        browsers: ['Chrome']
      },
      continuousnew: {
        configFile: 'test/karma-newangular.conf.js',
        singleRun: true,
        browsers: ['Chrome']
      }
    }
  });

  //Rename watch to delta so we can run a couple task before grunt watch starts
  grunt.renameTask('watch', 'delta');
  grunt.registerTask('watch', ['karma:watchold', 'karma:watchnew', 'delta']);

  grunt.registerTask('default', ['jshint', 'test', 'build']);
  grunt.registerTask('test', ['karma:continuousold', 'karma:continuousnew']);
  grunt.registerTask('build', ['concat', 'ngmin', 'uglify']);
};
