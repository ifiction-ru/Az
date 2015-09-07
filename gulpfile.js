var gulp = require('gulp'),
    concat = require('gulp-concat'),
    compass = require('gulp-compass');

gulp.task('compass', function() {
    gulp.src('./src/scss/**/*.scss')
        .pipe(compass({
            config_file: 'config.rb',
            css: 'src/css',
            sass: 'src/scss'
        }))
        .on('error', function(error) {
            console.log(error);
        });
});

gulp.task('images', function() {
    gulp.src('./img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./img/'))
});

gulp.task('watch', function() {
    gulp.watch('./src/scss/**/*.scss', ['compass']);
});
