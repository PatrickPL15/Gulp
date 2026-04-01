const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const esbuild = require('gulp-esbuild');
const clean = require('gulp-clean');

const paths = {
  html: 'src/renderer/index.html',
  scss: 'src/renderer/scss/**/*.scss',
  js: 'src/renderer/js/**/*.{js,jsx}',
  jsEntry: 'src/renderer/js/main.jsx',
  main: 'src/main/**/*',
  dist: 'dist'
};

function cleanDist() {
  return gulp.src(paths.dist, { read: false, allowEmpty: true })
    .pipe(clean());
}

function copyHtml() {
  return gulp.src(paths.html)
    .pipe(gulp.dest(`${paths.dist}/renderer`));
}

function compileSass() {
  return gulp.src(paths.scss)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(`${paths.dist}/renderer/css`));
}

function bundleJs() {
  return gulp.src(paths.jsEntry)
    .pipe(esbuild({
      bundle: true,
      minify: true,
      outfile: 'app.js',
      target: 'es2020',
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx'
      }
    }))
    .pipe(gulp.dest(`${paths.dist}/renderer/js`));
}

function copyMain() {
  return gulp.src(paths.main)
    .pipe(gulp.dest(`${paths.dist}/main`));
}

function watchFiles() {
  gulp.watch(paths.html, copyHtml);
  gulp.watch(paths.scss, compileSass);
  gulp.watch(paths.js, bundleJs);
  gulp.watch(paths.main, copyMain);
}

const build = gulp.series(cleanDist, gulp.parallel(copyHtml, compileSass, bundleJs, copyMain));

exports.clean = cleanDist;
exports.watch = watchFiles;
exports.build = build;
exports.default = build;
