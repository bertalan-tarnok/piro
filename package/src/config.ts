import { BuildOptions } from 'esbuild';

export interface Config {
  src: string;
  out: string;
  static: string;

  /**
   * Inside `src`
   */
  pages: string;
  inject?: { [key: string]: (s: string) => string };
  esbuild?: BuildOptions;
}
