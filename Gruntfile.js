var markdown = require('node-markdown').Markdown;

module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-release');

  grunt.initConfig({
    dist: 'dist',
    demo: 'demo',
    pkg: grunt.file.readJSON('component.json'),
    meta: {
      banner: 
        '/*\n'+ 
        ' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' * <%= pkg.homepage %>\n' +
        ' * Created by <%= pkg.author %>; Licensed under <%= pkg.license %>\n' +
        ' */\n'
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
          '<%= dist %>/promise-tracker.js': ['src/**/*.js']
        }
      }
    },

    uglify: {
      dist: {
        options: {
          banner: "<%= meta.banner %>"
        },
        files: {
          '<%= dist %>/promise-tracker.min.js': '<%= dist %>/promise-tracker.js'
        }
      }
    },

    clean: ['demo/**/*'],

    copy: {
      release: {
        files: {
          'promise-tracker.js': '<%= dist %>/promise-tracker.js',
          'promise-tracker.min.js': '<%= dist %>/promise-tracker.min.js'
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
    },
    changelog: {
      options: {
        dest: 'CHANGELOG.md'
      }
    },
    _release: {
      options: {
        bump: true,
        file: 'component.json',
        add: false,
        commit: true,
        tag: true,
        push: false,
        pushTags: false,
        commitMessage: 'release(): <%= version %>'
      }
    }
  });

  //Rename watch to delta so we can run a couple task before grunt watch starts
  grunt.renameTask('watch', 'delta');
  grunt.registerTask('watch', ['karma:watchold', 'karma:watchnew', 'delta']);

  grunt.registerTask('default', ['jshint', 'test', 'build']);
  grunt.registerTask('test', ['karma:continuousold', 'karma:continuousnew']);
  grunt.registerTask('build', ['concat', 'uglify']);

  grunt.renameTask('release', '_release');
  grunt.registerTask('release', 'Move build files and push them', function() {
    grunt.task.run(['default', 'copy:release', '_release']);
  });


};
