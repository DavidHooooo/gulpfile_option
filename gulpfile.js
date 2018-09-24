const gulp = require('gulp'),
    // 本地服务器
    browserSync = require('browser-sync').create(),
    SSI = require('browsersync-ssi'),
    // 版本号工具
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    // js丑化
    uglify = require('gulp-uglify'),
    // 防止报错
    plumber = require('gulp-plumber'),
    // sass编译
    sass = require('gulp-sass'),
    // css压缩
    cleanCSS = require('gulp-clean-css'),
    // 压缩发布版本
    zip = require('gulp-zip'),
    // 删除
    del = require('del'),
    // 更名
    rename = require('gulp-rename');
/*
1、压缩js
 */
// sass转译
gulp.task('sass', function() {
    return gulp.src("src/scss/**/*.scss")
        .pipe(plumber())
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(sass({outputStyle:"compact"}))
        .pipe(gulp.dest("src/css"))
        .pipe(browserSync.stream())
});
// css压缩,并形成新版本号
gulp.task('rev-css',function(){
    return gulp.src('src/css/**/*.css')
        .pipe(plumber())
        .pipe(cleanCSS())
        .pipe(rev())
        .pipe(gulp.dest('dist/css'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/css'))
        .pipe(browserSync.stream())
})
//压缩js并形成新版本号
gulp.task('rev-js',function(){
    return gulp.src("src/js/**/*.js")
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest("dist/js"))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/js'))
        .pipe(browserSync.stream())
})
//复制静态文件夹static
gulp.task('copy',  function() {
    return gulp.src('src/static/**')
        .pipe(plumber())
        .pipe(gulp.dest('dist/static'))
});
//删除发布版本文件夹
gulp.task('clean', function (cb) {
    del([
        './dist',
        './rev',
        './publish'
    ], cb);
});
// 开启服务器
gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir:["./dist"],
            middleware:SSI({
                baseDir:'./dist',
                ext:'.shtml',
                version:'2.10.0'
            })
        }
    });
    gulp.watch("src/scss/**/*.scss", ['sass', 'rev-css']);
    gulp.watch("src/js/**/*.js", ['rev-js']);
    gulp.watch("src/**/*.html", ['rev']);
    gulp.watch("src/static/**", ['copy']);
    gulp.watch("dist/**/*.html").on("change",browserSync.reload);
});
// 手动生成发布版本
gulp.task('rev',['sass','rev-css','rev-js','copy'],function(){
    return gulp.src(['rev/**/*.json','src/*.html'])
        .pipe(revCollector({
            replaceReved: true
        })).pipe(gulp.dest('dist'))
})
// 压缩发布版本
gulp.task('publish', function(){
    return gulp.src('dist/**/*')
        .pipe(plumber())
        .pipe(zip('publish.zip'))
        .pipe(gulp.dest('publish'))
});

/*
使用说明：
1、npm install
2、在node_modules中修改以下插件
    2.1、gulp-rev：node_modules\gulp-rev\index.js
        将144行的：
        manifest[originalFile] = revisionedFile;
        改为：
        manifest[originalFile] = originalFile + '?v=' + file.revHash;

    2.2、rev-path：node_modules\rev-path\index.js
        将第10行的：
        return filename + '-' + hash + ext;
        改为：
        return filename + ext;

    2.3、gulp-rev-collector: node_modules\gulp-rev-collector\index.js
        将第31行的：
        if ( !_.isString(json[key]) || path.basename(json[key]).replace(new RegExp( opts.revSuffix ), '' ) !==  path.basename(key) ) {
          isRev = 0;
        }
        改为：
        if ( !_.isString(json[key]) || path.basename(json[key]).split('?')[0] !== path.basename(key) ) {
          isRev = 0;
        }
        将第46行的：
        return pattern.replace(/[\-\[\]\{\}\(\)\*\+\?\.\^\$\|\/\\]/g, "\\$&");
        改为：
        var rp = pattern.replace(/[\-\[\]\{\}\(\)\*\+\?\.\^\$\|\/\\]/g, "\\$&");
        rp = pattern + "(\\?v=(\\d|[a-z]){8,10})*";
        return rp;
        将第94行的：
        patterns.push( escPathPattern( (path.dirname(key) === '.' ? '' : closeDirBySep(path.dirname(key)) ) + path.basename(key, path.extname(key)) )
                            + opts.revSuffix
                            + escPathPattern( path.extname(key) )
                        );
        改为：
        patterns.push( escPathPattern( (path.dirname(key) === '.' ? '' : closeDirBySep(path.dirname(key)) ) + path.basename(key, path.extname(key)) )
                            + opts.revSuffix
                            + escPathPattern( path.extname(key) ) + "(\\?v=(\\d|[a-z]){8,10})*"
                        );
        (如果在源码文件中，代码与上述不一致，请将"gulp-rev": "^7.1.2","gulp-rev-collector": "^1.1.1",控制为上述版本。)

3、开启本地服务器请依次执行以下命令, gulp clean, gulp rev, gulp server，然后在src目录下进行开发。
4、发版请依次执行以下命令，gulp clean, gulp rev, gulp publish，发布版本的压缩包在publish文件夹内。
5、该项目使用预编译项目sass，如果不需要，删除sass命令与相关依赖即可。
*/

/*
项目目录
- src
      - scss     (sass写在这里，如果不用sass可以不建立这个目录)
        - style.scss
      - css     （sass转译后的css目录，项目中不使用sass也不会影响）
        - common.css
      - static  (静态文件目录)
        - hsq.jpg
      - js      （脚本目录）
        - index.js
      - index.html
- gulpfile.js
- package.json
 */

