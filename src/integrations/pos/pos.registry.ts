import * as FudoAdapter from './fudo/v1/fudo.service';
import * as BistrosoftAdapter from './bistrosoft/v1/bistrosoft.service';

export const posRegistry = {
  fudo: { version: 'v1', adapter: FudoAdapter },
  bistrosoft: { version: 'v1', adapter: BistrosoftAdapter },
};