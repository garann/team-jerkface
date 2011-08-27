var fs = require('fs')
  , node_env = process.env['NODE_ENV'] || 'development'
  , path = require('path')
  , base_dir = path.join(__dirname, '..')
  , config_path = base_dir + '/config/' + node_env + '.json'
  , config = JSON.parse(fs.readFileSync(config_path))
  , rules_path = base_dir + '/public/js/rules.json'
  , rules = JSON.parse(fs.readFileSync(rules_path));

config.rules = rules;
config.env = node_env;
config.port = node_env === 'production' ? 80 : 7777;

console.log('config:', config);
module.exports = config;
