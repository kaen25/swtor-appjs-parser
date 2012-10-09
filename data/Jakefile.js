var path = require('path')
  , fs = require('fs')
  , jade = require('jade')
  , stylus = require('stylus')
  ;


desc('build all assets');
task('build', [ 'build:component'
              , 'build:dist/index.html'
              , 'build:dist/css/style.css'
              ], function (){
  
});

namespace('build', function (){

  desc('creates dist directory');
  directory('dist');
  
  desc('creates dist/css directory');
  directory('dist/css', ['dist']);
  
  desc('creates dist/js directory');
  directory('dist/js', ['dist']);
  
  desc('moves the application js file');
  task('dist/js/application.js', ['dist/js', 'src/js/application.js'], function (){
    fs.createReadStream('src/js/application.js').pipe(fs.createWriteStream('dist/js/application.js'));
  });
  
  desc('build component pieces');
  task('component', ['dist/js'], function (){
  
    //The following is essentially copied from component/component/bin/component-install
    var component = require('component')
      , config = require(path.resolve('src/component.json'))
      , pkgs = [];
      ;
      
      if (config.dependencies){
        pkgs = pkgs.concat(normalize(config.dependencies));
      }
      
      pkgs.forEach(function (pkg){
        var parts = pkg.split('@');
        pkg = parts.shift();
        var version = parts.shift() || 'master';
        pkg = component.install(pkg, version, {
          dest: 'dist/js/components'
        , force: false
        , dev: false
        });
        report(pkg);
        pkg.install();
      });
      
      function normalize(deps) {
        return Object.keys(deps).map(function(name){
          return name + '@' + deps[name];
        });
      }
      
      function report(pkg) {
        console.log('install', pkg.name + '@' + pkg.version);

        pkg.on('error', function(err){
          console.log('error', err.message);
          process.exit(1);
        });

        pkg.on('dep', function(dep){
          console.log('dep', dep.name + '@' + dep.version);
          report(dep);
        });

        pkg.on('exists', function(dep){
          console.log('exists', dep.name + '@' + dep.version);
        });

        pkg.on('file', function(file){
          console.log('fetch', pkg.name + ':' + file);
        });

        pkg.on('end', function(){
          console.log('complete', pkg.name);
        });
      }
  });
  
  desc('builds stylus files')
  file('dist/css/style.css', ['dist/css', 'src/stylus/style.styl'], function (){
    console.log("Generating layout.css from stylus.");

    var src = fs.readFileSync("src/stylus/style.styl", "utf8");

    stylus.render(src, {filename: 'src/stylus/style.styl'}, function (err, css){
        if (err) throw err;
        fs.writeFileSync("dist/css/style.css", css);
        complete();
    });
  }, {async: true});
  
  desc('builds jade index file');
  file('dist/index.html', ['dist', 'src/jade/index.jade'], function (){
    console.log("Generating index.html from jade.");
    var src = fs.readFileSync("src/jade/index.jade")
      , fn = jade.compile(src, {filename: "src/jade/index.jade"})
      , locals = {}
      ;

    fs.writeFileSync("dist/index.html", fn(locals));
  });
  
  
});
