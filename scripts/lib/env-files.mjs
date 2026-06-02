/**

 * Ordem de carregamento alinhada ao Vite (último arquivo vence).

 * @see https://vite.dev/guide/env-and-mode

 */

export function getDevEnvFiles() {

  return [".env", ".env.local"];

}



export function getStagingEnvFiles() {

  return [".env", ".env.local", ".env.staging", ".env.staging.local"];

}



export function getProductionEnvFiles() {

  return [".env", ".env.local", ".env.production", ".env.production.local"];

}


