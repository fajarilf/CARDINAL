describe('environment loading', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('loads the environment before exposing configuration', async () => {
    const load = jest
      .spyOn(process, 'loadEnvFile')
      .mockImplementation(() => {});

    const { env } = await import('./env');

    expect(load).toHaveBeenCalledTimes(1);
    expect(env).toHaveProperty('databaseUrl');
    expect(env).toHaveProperty('port');
  });

  it('allows a missing optional environment file', async () => {
    jest.spyOn(process, 'loadEnvFile').mockImplementation(() => {
      throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    });

    await expect(import('./env')).resolves.toHaveProperty('env');
  });

  it('does not swallow other environment loading errors', async () => {
    const error = Object.assign(new Error('permission denied'), {
      code: 'EACCES',
    });
    jest.spyOn(process, 'loadEnvFile').mockImplementation(() => {
      throw error;
    });

    await expect(import('./env')).rejects.toBe(error);
  });
});
