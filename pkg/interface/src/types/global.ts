import { PatpNoSig } from '@urbit/api';

declare global {
  interface Window {
    ship: PatpNoSig;
    desk: string;
    isMobileApp: boolean;
  }
}
