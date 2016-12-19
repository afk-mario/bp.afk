'use strict';

const gulp        = require('gulp');
const gutil       = require('gulp-util');
const source       = require('vinyl-source-stream');
const browserify  = require('browserify');
const babelify    = require('babelify');
const runSequence = require('run-sequence');
const bower       = require('main-bower-files');
const gulpif      = require('gulp-if');
const jshint      = require('gulp-jshint');
const uglify      = require('gulp-uglify');
const concat      = require('gulp-concat');
const flatten     = require('gulp-flatten');
const rename      = require('gulp-rename');
const gulpFilter  = require('gulp-filter');
const nib         = require('nib');
const stylus      = require('gulp-stylus');
const connect     = require('gulp-connect');
const imagemin    = require('gulp-imagemin');
const pngquant    = require('imagemin-pngquant');
const gifsicle    = require('imagemin-gifsicle');
const jpegtran    = require('imagemin-jpegtran');
const svgo        = require('imagemin-svgo');

const DEBUG = process.env.NODE_ENV === 'production' ? false : true;

// grab libraries files from bower_components, minify and push in /public
gulp.task('bower', function() {
    // var filter = {};
    var jsFilter = gulpFilter('**/*.js', {
        restore: true
    });
    var cssFilter = gulpFilter('*.css', {
        restore: true
    });
    var fontFilter = gulpFilter(['*.eot', '*.woff', '*.svg', '*.ttf']);
    var destPath = 'public/lib';

    return gulp.src(bower({
        debugging: true,
        includeDev: true
    }))

    // grab vendor js files from bower_components, minify and push in /public
    .pipe(jsFilter)
    .pipe(gulp.dest(destPath + '/js/'))
    .pipe(gulpif(!DEBUG, uglify()))
    .pipe(concat('vendor.js'))
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest(destPath + '/js/'))
    .pipe(jsFilter.restore)

    // grab vendor css files from bower_components, minify and push in /public
    .pipe(cssFilter)
    .pipe(gulp.dest(destPath + '/css'))
    // .pipe(minifycss())
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest(destPath + '/css'))
    .pipe(cssFilter.restore)

    // grab vendor font files from bower_components and push in /public
    .pipe(fontFilter)
    .pipe(flatten())
    .pipe(gulp.dest(destPath + '/fonts'));
});

gulp.task('browserify', function() {
    return browserify()
    .on('error', gutil.log)
    .require('./src/js/app.js', {
        entry: true,
        extensions: ['.js', 'jsx'],
        debug: true
    })
    .transform(babelify, {
        presets: ['es2015', 'react', 'stage-2']
    })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('js', function() {
    return gulp.src(['src/js/**/*.js', '!src/js/templates/**/*.js'])
    .pipe(jshint({
        devel: DEBUG
    }))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(gulpif(!DEBUG,uglify()))
    .pipe(concat('script.js'))
    .pipe(gulp.dest('./public/js/'))
    .pipe(connect.reload());
});

gulp.task('css', function() {
    gulp.src('src/css/style.styl')
    .pipe(stylus({
        use:nib(),
        compress: !DEBUG,
        import:['nib']
    }))
    .pipe(gulp.dest('public/css/'))
    .pipe(connect.reload());
});

gulp.task('img', function(){
    gulp.src('src/img/**/*')
    .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant(), gifsicle(), jpegtran(), svgo()]
    }))
    .pipe(gulp.dest('public/img'))
    .pipe(connect.reload());
});

gulp.task('html', function() {
    gulp.src('./src/*.html')
    .pipe(gulp.dest('./public/'))
    .pipe(connect.reload());
});

gulp.task('files', function() {
    gulp.src(['./src/**.*', '!./src/**.*.html', '!./src/**.*js', '!./src/img/'])
    .pipe(gulp.dest('./public/'));
});

gulp.task('react', function() {
    runSequence('js', 'browserify');
});

gulp.task('connect', function() {
    connect.server({
        root: 'public',
        livereload: true,
    });
});

gulp.task('init', ['css', 'bower', 'react', 'img', 'html', 'files']);

gulp.task('watch', ['css', 'react', 'img', 'html', 'connect'], function() {
    gulp.watch('src/css/**/*.styl', ['css']);
    gulp.watch('src/js/**/*.js', ['react']);
    gulp.watch('src/js/**/*.jsx', ['react']);
    gulp.watch('src/img/**/*', ['img']);
    gulp.watch('src/*.html', ['html']);
});

gulp.task('default', function() {
    runSequence('init', 'watch');
});
