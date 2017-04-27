'use strict';

const gulp        = require('gulp');
const gutil       = require('gulp-util');
const source      = require('vinyl-source-stream');
const browserify  = require('browserify');
const babelify    = require('babelify');
const runSequence = require('run-sequence');
const bower       = require('main-bower-files');
const gulpif      = require('gulp-if');
const lint        = require('gulp-eslint');
const uglify      = require('gulp-uglify');
const concat      = require('gulp-concat');
const flatten     = require('gulp-flatten');
const rename      = require('gulp-rename');
const gulpFilter  = require('gulp-filter');
const nib         = require('nib');
const stylus      = require('gulp-stylus');
const connect     = require('gulp-connect');
const imagemin    = require('gulp-imagemin');
const cleanCSS    = require('gulp-clean-css');
const pngquant    = require('imagemin-pngquant');
const gifsicle    = require('imagemin-gifsicle');
const jpegtran    = require('imagemin-jpegtran');
const svgo        = require('imagemin-svgo');

const DEBUG = process.env.NODE_ENV === 'production' ? false : true;
const DEST_PATH = 'public/';
const DEST_PATH_LIB = DEST_PATH + 'lib/';

// grab libraries files from bower_components, minify and push in /public
gulp.task('bower', ()=> {
    var filterJs = gulpFilter('**/*.js', {
        restore: true
    });
    var filterCss = gulpFilter('**/*.css', {
        restore: true
    });
    var filterFont = gulpFilter(['**/*.eot', '**/*.woff', '**/*.ttf'],{
        restore: true
    });
    var filterImg = gulpFilter(['**/*.jpg', '**/*.png', '**/*.svg', '**/*.jpeg', '**/*.gif'],{
        restore: true
    });

    return gulp.src(bower({
        debugging: true,
        includeDev: true
    }))

    // grab vendor js files from bower_components, minify and push in /public
    .pipe(filterJs)
    .pipe(gulpif(!DEBUG, uglify()))
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest(DEST_PATH_LIB + 'js/'))
    .pipe(filterJs.restore)

    // grab vendor css files from bower_components, minify and push in /public
    .pipe(filterCss)
    .pipe(gulp.dest(DEST_PATH_LIB + 'css/'))
    .pipe(gulpif(!DEBUG, cleanCSS({compatibility: 'ie8'})))
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest(DEST_PATH_LIB + 'css/'))
    .pipe(filterCss.restore)

    // grab vendor font files from bower_components and push in /public
    .pipe(filterFont)
    .pipe(flatten())
    .pipe(gulp.dest(DEST_PATH_LIB + 'fonts/'))

    // grab vendor font files from bower_components and push in /public
    .pipe(filterImg)
    .pipe(flatten())
    .pipe(gulp.dest(DEST_PATH_LIB + 'img/'));
});

gulp.task('browserify', ()=> {
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
    .pipe(gulp.dest(DEST_PATH + 'js/'));
});

gulp.task('js', ()=> {
    return gulp.src(['src/js/**/*.js', '!src/js/templates/**/*.js'])
    .pipe(lint())
    .pipe(lint.format())
    .pipe(lint.failAfterError())
    .pipe(gulpif(!DEBUG,uglify()))
    .pipe(concat('script.js'))
    .pipe(gulp.dest(DEST_PATH + 'js/'))
    .pipe(connect.reload());
});

gulp.task('css', ()=> {
    gulp.src('src/css/style.styl')
    .pipe(stylus({
        use:nib(),
        compress: !DEBUG,
        import:['nib']
    }))
    .pipe(gulp.dest(DEST_PATH + 'css/'))
    .pipe(connect.reload());
});

gulp.task('img', ()=>{
    gulp.src('src/img/**/*')
    .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant(), gifsicle(), jpegtran(), svgo()]
    }))
    .pipe(gulp.dest(DEST_PATH + 'img/'))
    .pipe(connect.reload());
});

gulp.task('html', ()=> {
    gulp.src('./src/*.html')
    .pipe(gulp.dest(DEST_PATH))
    .pipe(connect.reload());
});

gulp.task('files', ()=> {
    gulp.src(['./src/**.*', '!./src/**.*.html', '!./src/**.*js', '!./src/img/'])
    .pipe(gulp.dest(DEST_PATH));
});

gulp.task('react', ()=> {
    runSequence('js', 'browserify');
});

gulp.task('connect', ()=> {
    connect.server({
        root: DEST_PATH,
        livereload: true,
    });
});

gulp.task('init', ['css', 'bower', 'react', 'img', 'html', 'files']);

gulp.task('watch', ['css', 'react', 'img', 'html', 'connect'], ()=> {
    gulp.watch('src/css/**/*.styl', ['css']);
    gulp.watch('src/js/**/*.js', ['react']);
    gulp.watch('src/js/**/*.jsx', ['react']);
    gulp.watch('src/img/**/*', ['img']);
    gulp.watch('src/*.html', ['html']);
});

gulp.task('default', ()=> {
    runSequence('init', 'watch');
});
