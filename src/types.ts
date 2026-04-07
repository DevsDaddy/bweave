/**
 * BWeave Compressor Types
 *
 * @author              Elijah Rastorguev
 * @version             1.0.0
 * @build               1000
 * @git                 https://github.com/devsdaddy/bweave/
 */
/* Import Required Modules */
import {BWeaveMode} from "./compressor";

/**
 * Strategy interface
 */
export interface IWeaveStrategy {
    compress(data: Uint8Array): Uint8Array;
    decompress(compressed: Uint8Array, originalLength: number): Uint8Array;
}

/**
 * Compression Header
 */
export interface ICompressionHeader {
    mode: BWeaveMode;
    originalLen: number;
    payload: Uint8Array;
}