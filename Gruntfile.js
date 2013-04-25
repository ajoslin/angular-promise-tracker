var markdown = require('node-markdown').Markdown;

module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-ngmin');

  grunt.initConfig({
    dist: '.',
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
        options: {
          banner: "<%= meta.banner %>"
        },
        files: {
          //Actually minify our ngmin'd file
          '<%= dist %>/promise-tracker.min.js': '<%= dist %>/promise-tracker.min.js'
        }
      }
    },
    clean: ['demo/**/*'],
    copy: {
      demohtml: {
        options: {
          //process html files with gruntfile config
          processContent: grunt.template.process
        },
        files: [{
          expand: true,
          src: ["**/*.html"],
          cwd: "docs/site/",
          dest: "<%= demo %>"
        }]
      },
      demoassets: {
        files: [{
          expand: true,
          //Don't re-copy html files, we process those
          src: ["**/*", "!**/*.html"],
          cwd: "docs/site/",
          dest: "<%= demo %>"
        }]
      },
      buildfiles: {
        files: {
          "<%= demo %>/promise-tracker.js": "promise-tracker.js"
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

  grunt.registerTask('docs', 'build the docs', function() {
    var pages = ['getting-started'].map(function(pageName) {
      var folder = 'docs/pages/' + pageName;
      return {
        id: pageName,
        displayName: pageName.split('-').map(function(word) {
          return word.charAt(0).toUpperCase() + word.substr(1);
        }).join(" "),
        html: grunt.file.expand(folder + "/*.html")
          .map(grunt.file.read).join(''),
        js: grunt.file.expand(folder + "/*.js")
          .map(grunt.file.read).join(''),
        md: grunt.file.expand(folder + "/*.md")
          .map(grunt.file.read).map(markdown).join('')
      };
    });

    grunt.config('pages', pages);

    grunt.task.run(['clean', 'copy']);
  });
};
