/**
 * Web Worker para procesamiento de grafos en background
 *
 * NOTA: Este archivo ahora delega al nuevo worker modular.
 * El código original de 3,353 líneas ha sido refactorizado en una arquitectura modular.
 * Ver: /graph-worker/ para la nueva estructura.
 *
 * Versión: 0.9.0 (Migrado a arquitectura modular)
 * Autor: 686f6c61
 * Licencia: MIT
 */

// Importar el worker modular
import './graph-worker/index';
