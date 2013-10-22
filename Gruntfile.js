module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-karma');

  grunt.initConfig({
    dist: 'dist',
    pkgFile: 'bower.json',
    pkg: grunt.file.readJSON('bower.json'),
    meta: {
      banner:
        '/*\n'+
        ' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' * <%= pkg.homepage %>\n' +
        ' * Created by <%= pkg.author %>; Licensed under <%= pkg.license %>\n' +
        ' */\n' +
        '\n(function() {\n',
      footer: '\n}());'
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
          banner: '<%= meta.banner %>',
          footer: '<%= meta.footer %>'
        },
        files: {
          '<%= dist %>/promise-tracker.js': ['src/**/*.js']
        }
      }
    },

    uglify: {
      dist: {
        options: {
          banner: "<%= meta.banner %>",
          footer: '<%= meta.footer %>'
        },
        files: {
          '<%= dist %>/promise-tracker.min.js': ['src/**/*.js']
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

    shell: {
      release: {
        command: [
          'cp <%= dist %>/promise-tracker.js <%= dist %>/promise-tracker.min.js .',
          'git commit promise-tracker.js promise-tracker.min.js <%= pkgFile %> <%= changelog.options.dest %> -m "release(): v<%= pkg.version %>"',
          'git tag v<%= pkg.version %>',
          'git push --tags origin master'
        ].join(' && ')
      }
    }
  });

  //Rename watch to delta so we can run a couple task before grunt watch starts
  grunt.renameTask('watch', 'delta');
  grunt.registerTask('watch', ['karma:watchold', 'karma:watchnew', 'delta']);

  grunt.registerTask('default', ['jshint', 'test', 'build']);
  grunt.registerTask('test', ['karma:continuousold', 'karma:continuousnew']);
  grunt.registerTask('build', ['concat', 'uglify']);

  grunt.registerTask('release', 'Bump version, add tag, commit & push new build files', function() {
    var VERSION_REGEX = /([\'|\"]version[\'|\"][ ]*:[ ]*[\'|\"])([\d|.]*)([\'|\"])/i;
    var RELEASE_TYPES = {"minor":1, "major":1, "patch":1};

    var semver = require('semver');
    var releaseType = this.args[0];

    if (!(releaseType in RELEASE_TYPES) ) {
      grunt.fail.fatal("Release type not specified! Please specify one of the " +
                  "following: " + Object.keys(RELEASE_TYPES).join(', '));
    }

    var pkg = grunt.file.read(grunt.config('pkgFile'));
    var version;
    pkg = pkg.replace(VERSION_REGEX, function (match, left, center, right) {
      version = semver.inc(center, releaseType);
      return left + version + right;
    });
    grunt.file.write(grunt.config('pkgFile'), pkg);
    //Refresh config
    grunt.config('pkg', grunt.file.readJSON(grunt.config('pkgFile')));

    grunt.task.run(['build', 'changelog', 'shell:release']);

  });
};
