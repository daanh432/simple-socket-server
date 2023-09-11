export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

export const configureLogging = () => {
  let logLevels = ['debug', 'info', 'warn', 'error', 'none'];
  let shouldLog = (level: LogLevel) => {
    // @ts-ignore
    return logLevels.indexOf(level) >= logLevels.indexOf(global.logLevel);
  };

  let _console = console;
  global.console = {
    ...global.console,
    log: (message?: any, ...optionalParams: any[]) => {
      shouldLog('info') && _console.log(`[INFO] ` + message, ...optionalParams);
    },
    warn: (message?: any, ...optionalParams: any[]) => {
      shouldLog('warn') && _console.warn(`[WARN] ` + message, ...optionalParams);
    },
    error: (message?: any, ...optionalParams: any[]) => {
      shouldLog('error') && _console.error(`[ERROR] ` + message, ...optionalParams);
    },
    debug: (message?: any, ...optionalParams: any[]) => {
      shouldLog('debug') && _console.debug(`[DEBUG] ` + message, ...optionalParams);
    },
  };
};
