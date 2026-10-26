import { ConnectionTable } from '../connection/connections.type';
import type { DesignTable } from '../designs/designs.type';

export interface Databases {
  connections: ConnectionTable;
  designs: DesignTable;
}
