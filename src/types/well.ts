export interface WellMetadata {
  name: string;
  field: string;
  platform: string;
  wellType: 'producer' | 'injector';
  datum: 'RKB' | 'MSL';
  datumElevation: number;
  openHoleDiameter: number;   // inches
  openHoleTopMD: number;      // meters
  openHoleBaseMD: number;     // meters
}
