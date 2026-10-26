try {
  process.loadEnvFile();
} catch (error) {
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
    throw error;
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  port: process.env.PORT ?? 3333,
};
