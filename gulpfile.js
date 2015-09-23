var gulp = require('gulp'),
    path = require('path'),
    concat = require('gulp-concat'),
    compass = require('gulp-compass');

gulp.task('compass', function() {
    gulp.src('./src/**/scss/*.scss')
        .pipe(compass({
            project: path.join(__dirname, 'src/themes/default/'),
            css: 'css',
            sass: 'scss'
        }))
        .on('error', function(error) {
            console.log(error);
        });
});

gulp.task('images', function() {
    gulp.src('./img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./img/'));
});

gulp.task('watch', function() {
    gulp.watch('./src/**/scss/*.scss', ['compass']);
});
