/**
 * WatchFolderRuntimeProvider — factory pública do WatchFolderRuntimePort (F3-CAP-02).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  WatchFolderRuntimeFactory,
  createWatchFolderRuntimeFactory,
} from "../factory/watch-folder-runtime-factory";
import type { WatchFolderRuntimePort } from "../ports/watch-folder-runtime-port";
import type { WatchFolderRuntimeOptions } from "../ports/types";

let sharedFactory: WatchFolderRuntimeFactory | undefined;

function getSharedFactory(): WatchFolderRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createWatchFolderRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o WatchFolderRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-02 oficial).
 */
export function createWatchFolderRuntimePort(
  options: WatchFolderRuntimeOptions = {},
): WatchFolderRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getWatchFolderRuntimeFactory(): WatchFolderRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getWatchFolderRuntimePort().
 */
export function getWatchFolderRuntimePort(
  options: WatchFolderRuntimeOptions = {},
): WatchFolderRuntimePort {
  return createWatchFolderRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-02). */
export const WatchFolderRuntimeProvider = {
  create: createWatchFolderRuntimePort,
  get: getWatchFolderRuntimePort,
  getFactory: getWatchFolderRuntimeFactory,
};
