const fs = require('fs');

const parsePort = (value, name, fallback) => {
  const parsed = Number(value || fallback);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535.`);
  }
  return parsed;
};

const parsePoolSize = value => {
  const parsed = Number(value || '10');
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error('DB_POOL_MAX must be an integer between 1 and 100.');
  }
  return parsed;
};

const readSecret = (environment, name) => {
  const value = environment[name];
  const filePath = environment[`${name}_FILE`];
  if (value && filePath) {
    throw new Error(`Set either ${name} or ${name}_FILE, not both.`);
  }
  if (filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8').replace(/\r?\n$/, '');
    } catch (error) {
      throw new Error(`${name}_FILE could not be read.`);
    }
  }
  return value;
};

const parseOrigins = (value, production) => {
  if (!value?.trim()) {
    if (production) throw new Error('CORS_ORIGINS is required in production.');
    return [];
  }

  return value.split(',').map(valuePart => {
    const origin = valuePart.trim();
    let parsed;
    try {
      parsed = new URL(origin);
    } catch (error) {
      throw new Error('CORS_ORIGINS must contain valid HTTP(S) origins.');
    }
    if (
      !['http:', 'https:'].includes(parsed.protocol)
      || parsed.origin !== origin
      || (production && parsed.protocol !== 'https:')
    ) {
      throw new Error('CORS_ORIGINS must contain valid HTTPS origins in production.');
    }
    return parsed.origin;
  });
};

const loadConfig = (environment = process.env) => {
  const production = environment.NODE_ENV === 'production';
  const databasePassword = readSecret(environment, 'DB_PASSWORD');
  const jwtSecret = readSecret(environment, 'JWT_SECRET');
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER'];
  const missing = required.filter(name => !environment[name]?.trim());
  if (!databasePassword?.trim()) missing.push('DB_PASSWORD');
  if (!jwtSecret?.trim()) missing.push('JWT_SECRET');
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}.`);
  }
  if (
    jwtSecret.length < 32
    || /change-me|replace-with|example-secret|development-secret|test-secret/i.test(jwtSecret)
  ) {
    throw new Error('JWT_SECRET must be a non-placeholder value of at least 32 characters.');
  }

  const port = parsePort(environment.PORT, 'PORT', '5000');
  const dbPort = parsePort(environment.DB_PORT, 'DB_PORT', '5432');
  const dbPoolMax = parsePoolSize(environment.DB_POOL_MAX);
  const corsOrigins = parseOrigins(environment.CORS_ORIGINS, production);

  return {
    port,
    db: {
      host: environment.DB_HOST,
      database: environment.DB_NAME,
      user: environment.DB_USER,
      password: databasePassword,
      port: dbPort,
      max: dbPoolMax,
    },
    jwtSecret,
    corsOrigins,
    production,
  };
};

module.exports = { loadConfig, parseOrigins, parsePoolSize, parsePort, readSecret };
