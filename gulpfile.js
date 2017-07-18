var gulp = require('gulp');
//js压缩
var uglify = require('gulp-uglify');
//实时压缩对应文件
var watchPath = require('gulp-watch-path')
    //重新设置压缩文件名称
var rename = require('gulp-rename')
    //css压缩
var cssMin = require('gulp-clean-css')

var less = require('gulp-less')

//hash命名
var rev = require('gulp-rev')
var revCollector = require('gulp-rev-collector')

var browserSync = require('browser-sync').create();

var reload = browserSync.reload
    //图片压缩
var imagemin = require('gulp-imagemin')

var imageminJpegRecompress = require('imagemin-jpeg-recompress')

var imageminOptipng = require('imagemin-optipng')
    //清除文件
var clean = require('gulp-clean')

var runSequence = require('run-sequence')

/*开发环境配置*/
gulp.task('less:dev', function() {
    gulp.watch('src/asset/css/*.less', function(event) {
        var paths = watchPath(event, 'src/asset/css/', 'src/asset/css/');
        //return 以保证返回对象继续被调用，如需要browserSync.reload在正确的时机调用刷新页面
        return gulp.src(paths.srcPath)
            .pipe(less())
            .pipe(cssMin())
            //.pipe(rename({ suffix: '.min' }))
            .pipe(gulp.dest(paths.distDir))
            .pipe(reload({ stream: true }))
    })
});

gulp.task('js:dev', function() {
    gulp.watch('src/asset/js/*.js', function(event) {
        var paths = watchPath(event, 'src/asset/js/', 'src/asset/js/');
        return gulp.src(paths.srcPath)
            .pipe(gulp.dest(paths.distDir))
            .pipe(reload({ stream: true }))
    })
});

gulp.task('html:dev', function() {
    gulp.watch('src/*.html', function(event) {
        var paths = watchPath(event, 'src/', 'src/');
        return gulp.src(paths.srcPath)
            // .pipe(gulp.dest(paths.distDir))
            .pipe(reload({ stream: true }))
    })
});

gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: "./src/"
        }
    });
    gulp.start(['less:dev','js:dev','html:dev'])
});

gulp.task('dev', function() {
    gulp.start('server');
})

/*上线环境配置*/

//图片压缩任务,支持JPEG、PNG及GIF文件;
gulp.task('img:build', function() {
    var jpgmin = imageminJpegRecompress({

            accurate: true, //高精度模式

            quality: "high", //图像质量:low, medium, high and veryhigh;

            method: "smallfry", //网格优化:mpe, ssim, ms-ssim and smallfry;

            min: 70, //最低质量

            loops: 0, //循环尝试次数, 默认为6;

            progressive: false, //基线优化

            subsample: "default" //子采样:default, disable;

        }),

        pngmin = imageminOptipng({

            optimizationLevel: 4

        });

    return gulp.src('src/asset/img/' + '*.*')

    .pipe(imagemin({

            use: [jpgmin, pngmin]

        }))
        .pipe(gulp.dest('dist/asset/img'));
});
//打包js，压缩，生成hash
gulp.task('js:build', function() {
    return gulp.src('src/asset/js/*.js')
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest('dist/asset/js'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('hash/js'))
});
//打包css,压缩，生成hash
gulp.task('css:build', function() {
        return gulp.src('src/asset/css/*.less')
            .pipe(less())
            .pipe(cssMin())
            //.pipe(rename({ suffix: '.min' }))
            .pipe(rev())
            .pipe(gulp.dest('dist/asset/css/'))
            .pipe(rev.manifest())
            .pipe(gulp.dest('hash/css'))
    })
    //打包html，匹配hash
gulp.task('html:build', function() {
        return gulp.src(['hash/**/*.json', 'src/*.html'])
            .pipe(revCollector())
            .pipe(gulp.dest('dist'))
    })
    //打包静态资源文件，如bootstrap
gulp.task('staticAll:build', function() {
    return gulp.src('./src/static/**/*')
        .pipe(gulp.dest('dist/static'))
})

gulp.task("clean", function() {
    return gulp.src(['dist','hash'],{read: false})//src的第二个参数的{read:false}，是不读取文件加快程序。
        .pipe(clean())

})

gulp.task('build', function() {
    runSequence('clean','staticAll:build', 'img:build', 'js:build', 'css:build','html:build')

})
