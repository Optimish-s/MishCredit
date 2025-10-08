// Provides normalized configuration values
const parseAllowedOrigins = (value: string): string[] => {
  if (!value) {
    return [];
  }

  if (value.trim() === '*') {
    return ['*'];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

export default () => ({
  app: {
    port: Number(process.env.PORT),
    useStubs: process.env.USE_STUBS === 'true',
    allowedOrigins: parseAllowedOrigins(process.env.ALLOWED_ORIGINS ?? ''),
  },
  database: {
    mongoUri: process.env.MONGO_URI ?? '',
  },
});
