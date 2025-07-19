import * as FudoAdapter from './fudo/v1/fudo.service';

export const posRegistry = {
  fudo: { version: 'v1', adapter: FudoAdapter },
  bistrosoft: { version: 'v1', adapter: null },
};