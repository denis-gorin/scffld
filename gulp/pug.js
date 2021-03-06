'use strict';

import fs from 'fs';
import pug from 'pug';
import path from 'path';
import yaml from 'js-yaml';
import foldero from 'foldero';

export default function(gulp, args, $, config, bs) {
  let dirs = config.directories;
  let dest = path.join(dirs.build);
  let seedPath = path.join(dirs.source, dirs.data);

  // Compiling Pug templates.
  gulp.task('pug', () => {
    let data = {};
    // Populate data array with seeds from data folder.
    if (fs.existsSync(seedPath)) {
      // Parse directory content to JS Object
      data = foldero(seedPath, {
        recurse: true,
        whitelist: '(.*/)*.+\.(json|ya?ml)$',
        loader: function loadAsString(file) {
          let json = {};
          try {
            json = (path.extname(file).match(/^.ya?ml$/)) ?
              yaml.safeLoad(fs.readFileSync(file, 'utf8')):
              JSON.parse(fs.readFileSync(file, 'utf8'));
          }
          catch(e) {
            let msg  = $.util.colors.red(`Error Parsing DATA file: ${file}\n`);
                msg += $.util.colors.bold('==== Details Below ====') + `\n${e}`;
            $.util.log(msg);
          }
          return json;
        }
      });
    }

    if (args.debug) {
      //- Print seed data to terminal
      let msg  = $.util.colors.yellow('\n==== DEBUG: site.data injected to templates ====\n');
          msg += JSON.stringify(data, null, 2);
          msg += $.util.colors.yellow('\n==== DEBUG: package.json config injected to templates ====\n');
          msg += JSON.stringify(config, null, 2);
      $.util.log(msg);
    }

    return gulp.src([
      path.join(dirs.source, '**/*.pug'),
      '!' + path.join(dirs.source, '{**/\_*,**/\_*/**}')
    ])
    .pipe($.changed(dest))
    .pipe($.plumber())
    .pipe($.pug({
      pretty: true,
      locals: {
        config: config,
        debug: true,
        site: {
          data: data
        }
      }
    }))
    .pipe($.htmlmin({
      collapseBooleanAttributes: true,
      conservativeCollapse: true,
      removeCommentsFromCDATA: true,
      removeEmptyAttributes: true,
      removeRedundantAttributes: true
    }))
    .pipe(gulp.dest(dest))
    .on('end', bs.reload);
  });

}
