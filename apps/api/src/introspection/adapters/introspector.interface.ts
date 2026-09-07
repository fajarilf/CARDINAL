export interface SchemaIntrospector {
  connect(connString: string): IntrospectionSession;
}

export interface IntrospectionSession {
  getSchemas(): Promise<string[]>;
  close(): Promise<void>;
}
