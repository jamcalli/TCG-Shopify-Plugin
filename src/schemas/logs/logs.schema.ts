export type LogLevel =
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace'
  | 'silent'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  [key: string]: unknown
}
