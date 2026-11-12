// Karma para correr los tests sin abrir ventana (CI o Linux como root, donde Chrome necesita --no-sandbox).
// Uso: CHROME_BIN=/ruta/a/chrome npx ng test --watch=false --karma-config=karma.ci.cjs --include='**/*.util.spec.ts'
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [require('karma-jasmine'), require('karma-chrome-launcher'), require('@angular-devkit/build-angular/plugins/karma')],
    browsers: ['ChromeHeadlessCI'],
    customLaunchers: { ChromeHeadlessCI: { base: 'ChromeHeadless', flags: ['--no-sandbox'] } },
    singleRun: true,
    reporters: ['progress'],
  });
};
