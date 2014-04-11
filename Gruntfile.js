module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

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

    concat: {
      dist: {
        options: {
          banner: '<%= meta.banner %>',
          footer: '<%= meta.footer %>'
        },
        files: {
          '<%= dist %>/promise-tracker.js': ['src/promise-tracker.js'],
          '<%= dist %>/promise-tracker-http-interceptor.js': ['src/http-interceptor.js']
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

    shell: {
      release: {
        command: [
          'grunt',
          'cp <%= dist %>/*.js .',
          'grunt changelog',
          'git commit -am "release(): v<%= pkg.version %>"',
          'git tag -f v<%= pkg.version %> -m v<%= pkg.version %>'
        ].join(' && ')
      }
    }
  });

  grunt.registerTask('dev', ['karma:watch', 'watch']);

  grunt.registerTask('default', ['jshint', 'test', 'build']);
  grunt.registerTask('test', ['karma:single']);
  grunt.registerTask('build', ['concat']);
};
