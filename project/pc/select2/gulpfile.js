const fs = require('fs');
const gulp = require('gulp');
const path = require('path');
const merge = require('merge-stream');       
const rename=require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');   
const plumber = require('gulp-plumber');  //报错不中断
const gulpif = require('gulp-if');


const uglify=require('gulp-uglify');      //js压缩
const babel=require('gulp-babel');  //es6->es5
gulp.task("minify-js",function(){
  gulp.src('asset/js/*.js')
    .pipe(plumber())  
    .pipe(sourcemaps.init())
    .pipe(babel({
          presets: ['es2015']
        }))        
    .pipe(uglify())
    .pipe(rename(function(path){
      path.basename+=".min"
    }))
    .pipe(sourcemaps.write("../maps"))
    .pipe(gulp.dest("dist/js"));
})
gulp.task('default',['minify-js',], ()=> {
    console.log("---------开始文件变化监听")
    gulp.watch(['asset/js/*.js'],['minify-js'])
});
