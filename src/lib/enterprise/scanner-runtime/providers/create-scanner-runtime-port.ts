/**
 * ScannerRuntimeProvider — factory pública do ScannerRuntimePort (F3-CAP-01).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  ScannerRuntimeFactory,
  createScannerRuntimeFactory,
} from "../factory/scanner-runtime-factory";
import type { ScannerRuntimePort } from "../ports/scanner-runtime-port";
import type { ScannerRuntimeOptions } from "../ports/types";

let sharedFactory: ScannerRuntimeFactory | undefined;

function getSharedFactory(): ScannerRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createScannerRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o ScannerRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-01 oficial).
 */
export function createScannerRuntimePort(options: ScannerRuntimeOptions = {}): ScannerRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getScannerRuntimeFactory(): ScannerRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getScannerRuntimePort().
 */
export function getScannerRuntimePort(options: ScannerRuntimeOptions = {}): ScannerRuntimePort {
  return createScannerRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-01). */
export const ScannerRuntimeProvider = {
  create: createScannerRuntimePort,
  get: getScannerRuntimePort,
  getFactory: getScannerRuntimeFactory,
};
