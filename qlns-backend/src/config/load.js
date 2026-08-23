const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const ENV_FOLDER = {
  development: 'develop',
  develop: 'develop',
  dev: 'develop',
  test: 'develop',
  staging: 'staging',
  stage: 'staging',
  production: 'production',
  prod: 'production',
};

function interpolate(node) {
  if (Array.isArray(node)) return node.map(interpolate);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] = interpolate(value);
    }
    return out;
  }
  if (typeof node !== 'string') return node;
  return node.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)(?::([^}]*))?\}/g, (_, name, fallback) => {
    const envVal = process.env[name];
    if (envVal !== undefined && envVal !== '') return envVal;
    return fallback !== undefined ? fallback : '';
  });
}

function resolveDir() {
  if (process.env.CONFIG_DIR) return path.resolve(process.env.CONFIG_DIR);
  const key = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  const folder = ENV_FOLDER[key] || 'develop';
  return path.resolve(__dirname, '../../../config', folder);
}

function loadYamlFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = yaml.load(raw) || {};
  return interpolate(parsed);
}

function loadConfig() {
  const dir = resolveDir();
  if (!fs.existsSync(dir)) {
    throw new Error(`Không tìm thấy thư mục cấu hình: ${dir}`);
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  if (!files.length) {
    throw new Error(`Không có file YAML trong ${dir}`);
  }
  const merged = {};
  for (const file of files.sort()) {
    Object.assign(merged, loadYamlFile(path.join(dir, file)));
  }
  merged.__dir = dir;
  merged.__env = path.basename(dir);
  return merged;
}

const config = loadConfig();

module.exports = { config, loadConfig, resolveDir };
